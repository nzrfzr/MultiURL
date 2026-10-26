import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  OpenMode,
  QueueSessionState,
  UrlEntry,
} from '../core/types';
import { parseUrls, calculateStats } from '../core/url-parser';
import {
  selectAll,
  selectNone,
  deleteSelected,
  removeEntry,
  toggleSelection,
  getEligibleSelectedEntries,
} from '../core/selection';
import { deriveProgress, DEFAULT_LIMIT, DEFAULT_INTERVAL_SECONDS } from '../core/scheduler';
import { sendRuntimeMessage, readStorage, writeStorage } from '../platform/browser-api';
import { ExtensionMessage } from '../shared/messages';

import { Header } from './components/Header';
import { UrlInput } from './components/UrlInput';
import { StatsSummary } from './components/StatsSummary';
import { ListControls } from './components/ListControls';
import { UrlList } from './components/UrlList';
import { OpenModeSelector } from './components/OpenModeSelector';
import { ProgressPanel } from './components/ProgressPanel';
import { ActionControls } from './components/ActionControls';
import { Footer } from './components/Footer';

const INPUT_STORAGE_KEY = 'multiurls_saved_input_text';
const SETTINGS_STORAGE_KEY = 'multiurls_saved_settings';

interface SavedSettings {
  mode: OpenMode;
  delaySeconds: number;
  limit: number;
}

export const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [entries, setEntries] = useState<UrlEntry[]>([]);
  const [mode, setMode] = useState<OpenMode>('open_all');
  const [delaySeconds, setDelaySeconds] = useState<number>(DEFAULT_INTERVAL_SECONDS);
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  // True once settings have been read from storage — prevents flash of defaults
  const [isSettingsLoaded, setIsSettingsLoaded] = useState<boolean>(false);

  const [session, setSession] = useState<QueueSessionState>({
    sessionId: '',
    status: 'idle',
    mode: 'open_all',
    delaySeconds: DEFAULT_INTERVAL_SECONDS,
    limit: DEFAULT_LIMIT,
    entries: [],
    nextIndex: 0,
    managedTabIds: [],
    tabToEntryIdMap: {},
    entryOutcomes: {},
    statusMessage: 'Ready to open URLs',
    updatedAt: Date.now(),
  });

  const stats = useMemo(() => calculateStats(entries), [entries]);
  const eligibleSelectedCount = useMemo(() => getEligibleSelectedEntries(entries).length, [entries]);
  const progress = useMemo(() => deriveProgress(session), [session]);
  const isBusy = session.status === 'running' || session.status === 'paused';

  useEffect(() => {
    // 1. Setup message listener FIRST so we never miss STATE_UPDATED events
    let messageListener: ((msg: ExtensionMessage) => void) | null = null;
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      messageListener = (msg: ExtensionMessage) => {
        if (msg.type === 'STATE_UPDATED') {
          setSession(msg.state);
          if (msg.state.status === 'running' || msg.state.status === 'paused') {
            setMode(msg.state.mode);
            setLimit(msg.state.limit);
            setDelaySeconds(msg.state.delaySeconds);
            if (msg.state.entries && msg.state.entries.length > 0) {
              setEntries(msg.state.entries);
            }
          }
        }
      };
      chrome.runtime.onMessage.addListener(messageListener);
    }

    // 2. Fetch state from service worker, with local storage fallback
    Promise.all([
      sendRuntimeMessage<QueueSessionState>({ type: 'GET_STATE' }),
      readStorage<SavedSettings>(SETTINGS_STORAGE_KEY),
      readStorage<string>(INPUT_STORAGE_KEY),
      readStorage<QueueSessionState>('multiurls_queue_session_v1'),
    ]).then(([res, savedSettings, cachedInput, fallbackStorageSession]) => {
      // Restore settings (mode, delay, limit)
      if (savedSettings) {
        setMode(savedSettings.mode);
        setDelaySeconds(savedSettings.delaySeconds);
        setLimit(savedSettings.limit);
      }

      // Determine active session: prefer res.data from background, fallback to storage
      const activeSession = (res.success && res.data) ? res.data : fallbackStorageSession;

      if (activeSession) {
        setSession(activeSession);
        if (activeSession.status === 'running' || activeSession.status === 'paused') {
          setMode(activeSession.mode);
          setLimit(activeSession.limit);
          setDelaySeconds(activeSession.delaySeconds);
          if (activeSession.entries && activeSession.entries.length > 0) {
            setEntries(activeSession.entries);
          }
        } else if (activeSession.status === 'completed' || activeSession.status === 'stopped') {
          if (activeSession.entries && activeSession.entries.length > 0) {
            setEntries(activeSession.entries);
          }
        }
      }

      // Restore URL input text
      if (cachedInput && typeof cachedInput === 'string') {
        setInputText(cachedInput);
        if (!activeSession || activeSession.status === 'idle' || !activeSession.entries || activeSession.entries.length === 0) {
          setEntries(parseUrls(cachedInput));
        }
      }

      // Mark settings as loaded — UI can now render without flashing defaults
      setIsSettingsLoaded(true);
    });

    return () => {
      if (messageListener && typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(messageListener);
      }
    };
  }, []);

  // Persist settings — only after initial load to avoid overwriting storage with
  // React's default values before the async read has completed.
  const persistSettings = useCallback(
    (newMode: OpenMode, newDelay: number, newLimit: number) => {
      writeStorage<SavedSettings>(SETTINGS_STORAGE_KEY, {
        mode: newMode,
        delaySeconds: newDelay,
        limit: newLimit,
      }).catch(() => {});
    },
    []
  );

  const handleSetMode = useCallback((newMode: OpenMode) => {
    setMode(newMode);
    persistSettings(newMode, delaySeconds, limit);
  }, [delaySeconds, limit, persistSettings]);

  const handleSetDelay = useCallback((newDelay: number) => {
    setDelaySeconds(newDelay);
    persistSettings(mode, newDelay, limit);
  }, [mode, limit, persistSettings]);

  const IDLE_SESSION: QueueSessionState = {
    sessionId: '',
    status: 'idle',
    mode: 'open_all',
    delaySeconds: DEFAULT_INTERVAL_SECONDS,
    limit: DEFAULT_LIMIT,
    entries: [],
    nextIndex: 0,
    managedTabIds: [],
    tabToEntryIdMap: {},
    entryOutcomes: {},
    statusMessage: 'Ready to open URLs',
    updatedAt: Date.now(),
  };

  const handleInputChange = useCallback((newText: string) => {
    setInputText(newText);
    const parsed = parseUrls(newText);
    setEntries(parsed);
    writeStorage(INPUT_STORAGE_KEY, newText).catch(() => {});
    // Reset progress display when URLs are cleared and no active session
    if (parsed.length === 0) {
      setSession((prev) =>
        prev.status === 'idle' || prev.status === 'stopped' || prev.status === 'completed' || prev.status === 'failed'
          ? { ...IDLE_SESSION, updatedAt: Date.now() }
          : prev
      );
    }
  }, []);


  const updateEntriesAndText = useCallback((updatedEntries: UrlEntry[]) => {
    setEntries(updatedEntries);
    const text = updatedEntries.map((e) => e.raw).join('\n');
    setInputText(text);
    writeStorage(INPUT_STORAGE_KEY, text).catch(() => {});
  }, []);

  const handleSelectAll = () => setEntries((curr) => selectAll(curr));
  const handleSelectNone = () => setEntries((curr) => selectNone(curr));
  const handleDeleteSelected = () => updateEntriesAndText(deleteSelected(entries));
  const handleClear = () => { updateEntriesAndText([]); setInputText(''); };
  const handleToggleSelect = (id: string) => setEntries((curr) => toggleSelection(curr, id));
  const handleRemove = (id: string) => updateEntriesAndText(removeEntry(entries, id));

  const handleStart = async () => {
    const toOpen = getEligibleSelectedEntries(entries);
    if (toOpen.length === 0) return;
    const res = await sendRuntimeMessage<QueueSessionState>({
      type: 'START_QUEUE', mode, entries: toOpen, delaySeconds, limit,
    });
    if (res.success && res.data) setSession(res.data);
  };

  const handlePause = async () => {
    const res = await sendRuntimeMessage<QueueSessionState>({ type: 'PAUSE_QUEUE' });
    if (res.success && res.data) setSession(res.data);
  };

  const handleResume = async () => {
    const res = await sendRuntimeMessage<QueueSessionState>({ type: 'RESUME_QUEUE' });
    if (res.success && res.data) setSession(res.data);
  };

  const handleStop = async () => {
    const res = await sendRuntimeMessage<QueueSessionState>({ type: 'STOP_QUEUE' });
    if (res.success && res.data) setSession(res.data);
  };

  const handleUpdateLimit = (newLimit: number) => {
    setLimit(newLimit);
    persistSettings(mode, delaySeconds, newLimit);
    sendRuntimeMessage<QueueSessionState>({ type: 'UPDATE_LIMIT', limit: newLimit }).then((res) => {
      if (res.success && res.data) setSession(res.data);
    });
  };

  return (
    <div
      style={{
        width: 520,
        height: 580,
        maxHeight: 580,
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '14px 18px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* 1. Header */}
      <Header status={session.status} />

      {/* 2. URL Input */}
      <UrlInput value={inputText} onChange={handleInputChange} disabled={isBusy} />

      {/* 3. Stats Summary */}
      <StatsSummary stats={stats} />

      {/* 4. List Controls */}
      <ListControls
        onSelectAll={handleSelectAll}
        onSelectNone={handleSelectNone}
        onDeleteSelected={handleDeleteSelected}
        onClear={handleClear}
        disabled={isBusy}
        selectedCount={eligibleSelectedCount}
        totalCount={entries.length}
      />

      {/* 5. URL List */}
      <UrlList
        entries={entries}
        entryOutcomes={session.entryOutcomes}
        onToggleSelect={handleToggleSelect}
        onRemove={handleRemove}
        disabled={isBusy}
      />

      {/* 6. Open Mode Selector — only render once settings are loaded to avoid flashing defaults */}
      {isSettingsLoaded && (
        <OpenModeSelector
          mode={mode}
          onChangeMode={handleSetMode}
          delaySeconds={delaySeconds}
          onChangeDelay={handleSetDelay}
          limit={limit}
          onChangeLimit={handleUpdateLimit}
          disabled={isBusy}
        />
      )}

      {/* 7. Progress Panel */}
      <ProgressPanel
        statusMessage={session.statusMessage}
        progress={progress}
        mode={mode}
        limit={limit}
      />

      {/* 8. Action Controls */}
      <ActionControls
        status={session.status}
        selectedCount={eligibleSelectedCount}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
      />

      {/* 9. Footer */}
      <Footer />
    </div>
  );
};
