(function(){"use strict";const d="mul-host",g="mul-styles",k={running:{label:"Running",dotColor:"#2563EB",pillBg:"#EFF6FF",pillBorder:"#DBEAFE",pillText:"#2563EB"},paused:{label:"Paused",dotColor:"#D97706",pillBg:"#FFFBEB",pillBorder:"#FDE68A",pillText:"#D97706"}};let f=!1;function C(){if(document.getElementById(g))return;const t=document.createElement("style");t.id=g,t.textContent=`
    /* ── Host: fixed, bottom-right ── */
    #${d} {
      all: initial;
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      color: #0F172A;
      user-select: none;
      pointer-events: auto;
    }
    #${d} * { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Expanded Card ── */
    #mul-card {
      width: 360px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
      padding: 13px 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: box-shadow 0.2s, transform 0.2s;
      animation: mul-in 0.24s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    #mul-card:hover {
      box-shadow: 0 14px 28px -4px rgba(0, 0, 0, 0.16), 0 10px 12px -5px rgba(0, 0, 0, 0.10);
    }

    /* ── Header Row ── */
    .mul-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #F1F5F9;
      padding-bottom: 8px;
    }
    .mul-header-left {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    /* ── Dot Indicator ── */
    #mul-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    #mul-dot.running {
      animation: mul-blink 1.8s ease-in-out infinite;
    }
    @keyframes mul-blink {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.35; transform: scale(0.9); }
    }

    /* ── App name ── */
    #mul-name {
      font-size: 12.5px;
      font-weight: 700;
      color: #0F172A;
      letter-spacing: -0.01em;
      flex-shrink: 0;
    }

    /* ── Status pill ── */
    #mul-pill {
      display: inline-flex;
      align-items: center;
      border-radius: 9999px;
      border-width: 1px;
      border-style: solid;
      padding: 1px 7px;
      font-size: 10px;
      font-weight: 600;
      flex-shrink: 0;
    }

    /* ── Header Actions ── */
    .mul-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* ── Buttons ── */
    .mul-btn {
      all: unset;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 24px;
      padding: 0 9px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid #CBD5E1;
      background: #F8FAFC;
      color: #334155;
      transition: background 0.12s, color 0.12s, border-color 0.12s;
      flex-shrink: 0;
    }
    .mul-btn:hover {
      background: #F1F5F9;
      color: #0F172A;
    }
    .mul-btn.resume {
      background: #FFFBEB;
      color: #D97706;
      border-color: #FDE68A;
    }
    .mul-btn.resume:hover {
      background: #FEF3C7;
    }
    .mul-btn.stop {
      background: #FEF2F2;
      color: #DC2626;
      border-color: #FECACA;
    }
    .mul-btn.stop:hover {
      background: #FEE2E2;
    }

    /* ── Minimize Toggle Button ── */
    #mul-toggle {
      all: unset;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 4px;
      color: #94A3B8;
      cursor: pointer;
      font-size: 15px;
      line-height: 1;
      margin-left: 2px;
      flex-shrink: 0;
      transition: background 0.12s, color 0.12s;
    }
    #mul-toggle:hover {
      background: #F1F5F9;
      color: #475569;
    }

    /* ── Progress Section ── */
    .mul-progress-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .mul-progress-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
    }
    .mul-progress-label {
      font-weight: 600;
      color: #0F172A;
    }
    #mul-pct {
      font-weight: 700;
      color: #2563EB;
      margin-left: 5px;
    }
    .mul-progress-counts {
      color: #64748B;
      font-variant-numeric: tabular-nums;
    }
    #mul-active-slots {
      margin-left: 5px;
      color: #2563EB;
      font-weight: 600;
    }

    /* ── Progress Bar Track ── */
    #mul-track {
      width: 100%;
      height: 6px;
      background: #EEF2F6;
      border-radius: 9999px;
      overflow: hidden;
      flex-shrink: 0;
    }
    #mul-fill {
      height: 100%;
      width: 0%;
      background: #2563EB;
      border-radius: 9999px;
      transition: width 0.25s ease-out;
    }

    /* ── Stats Breakdown Row ── */
    .mul-stats-row {
      display: flex;
      gap: 7px;
    }
    .mul-stat-chip {
      flex: 1;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 5px 6px;
      text-align: center;
    }
    .mul-stat-title {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748B;
      line-height: 1;
    }
    .mul-stat-val {
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 2px;
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
    }
    .mul-stat-chip.failed.has-errors {
      background: #FEF2F2;
      border-color: #FECACA;
    }
    .mul-stat-chip.failed.has-errors .mul-stat-title,
    .mul-stat-chip.failed.has-errors .mul-stat-val {
      color: #DC2626;
    }

    /* ── Status Message Row ── */
    #mul-status-msg {
      font-size: 10.5px;
      color: #64748B;
      font-style: italic;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding-top: 2px;
      border-top: 1px solid #F8FAFC;
    }

    /* ── Minimized State: Sleek Corner Pill ── */
    #mul-card.minimized {
      width: auto;
      max-width: 260px;
      padding: 6px 12px;
      border-radius: 9999px;
      cursor: pointer;
      flex-direction: row;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }
    #mul-card.minimized .mul-header-row {
      border-bottom: none;
      padding-bottom: 0;
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }
    #mul-card.minimized .mul-header-actions,
    #mul-card.minimized .mul-progress-section,
    #mul-card.minimized .mul-stats-row,
    #mul-card.minimized #mul-status-msg {
      display: none !important;
    }
    #mul-min-info {
      display: none;
      font-size: 11px;
      font-weight: 600;
      color: #0F172A;
      align-items: center;
      gap: 6px;
    }
    #mul-card.minimized #mul-min-info {
      display: inline-flex;
    }
    .mul-expand-icon {
      font-size: 11px;
      color: #94A3B8;
      margin-left: 2px;
    }

    /* ── Slide-in Animation ── */
    @keyframes mul-in {
      from { opacity: 0; transform: translateY(12px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
  `,document.documentElement.appendChild(t)}function A(){const t=document.getElementById(d);if(t)return t;C();const e=document.createElement("div");e.id=d,e.innerHTML=`
    <div id="mul-card">
      <!-- 1. Header -->
      <div class="mul-header-row">
        <div class="mul-header-left">
          <span id="mul-dot"></span>
          <span id="mul-name">MultiURL</span>
          <span id="mul-pill"></span>
          <div id="mul-min-info">
            <span id="mul-min-counts">0/0</span>
            <span class="mul-expand-icon" title="Click to expand">↗</span>
          </div>
        </div>
        <div class="mul-header-actions">
          <button id="mul-btn-pr" class="mul-btn">Pause</button>
          <button id="mul-btn-stop" class="mul-btn stop">Stop</button>
          <button id="mul-toggle" title="Minimize">&minus;</button>
        </div>
      </div>

      <!-- 2. Progress Section -->
      <div class="mul-progress-section">
        <div class="mul-progress-meta">
          <div>
            <span class="mul-progress-label">Progress</span>
            <span id="mul-pct">0%</span>
          </div>
          <div class="mul-progress-counts">
            <span id="mul-dispatched">0</span> / <span id="mul-total">0</span> opened
            <span id="mul-active-slots"></span>
          </div>
        </div>
        <div id="mul-track">
          <div id="mul-fill"></div>
        </div>
      </div>

      <!-- 3. Stats Row -->
      <div class="mul-stats-row">
        <div class="mul-stat-chip">
          <div class="mul-stat-title">Success</div>
          <div id="mul-stat-success" class="mul-stat-val">0</div>
        </div>
        <div id="mul-chip-failed" class="mul-stat-chip failed">
          <div class="mul-stat-title">Failed</div>
          <div id="mul-stat-failed" class="mul-stat-val">0</div>
        </div>
        <div class="mul-stat-chip">
          <div class="mul-stat-title">Remaining</div>
          <div id="mul-stat-remaining" class="mul-stat-val">0</div>
        </div>
      </div>

      <!-- 4. Status Message -->
      <div id="mul-status-msg">Opening URLs...</div>
    </div>
  `,document.documentElement.appendChild(e);const s=e.querySelector("#mul-card"),i=e.querySelector("#mul-toggle"),o=e.querySelector("#mul-btn-pr"),l=e.querySelector("#mul-btn-stop");return i.addEventListener("click",n=>{n.stopPropagation(),x(!0)}),s.addEventListener("click",()=>{f&&x(!1)}),o.addEventListener("click",n=>{var a;n.stopPropagation();const r=(a=o.textContent)==null?void 0:a.trim();chrome.runtime.sendMessage({type:r==="Resume"?"RESUME_QUEUE":"PAUSE_QUEUE"}).catch(()=>{})}),l.addEventListener("click",n=>{n.stopPropagation(),chrome.runtime.sendMessage({type:"STOP_QUEUE"}).catch(()=>{})}),e}function x(t){f=t;const e=document.getElementById("mul-card");e&&(t?e.classList.add("minimized"):e.classList.remove("minimized"))}function z(t){var r;let e=0,s=0,i=0;for(const a of Object.values(t.entryOutcomes??{}))a==="opened"?e++:a==="failed"?s++:a==="opening"&&i++;const o=e+s+i,l=((r=t.entries)==null?void 0:r.length)??0,n=Math.max(0,l-o);return{success:e,failed:s,remaining:n,dispatched:o,total:l,pct:l>0?Math.round(o/l*100):0}}function I(){const t=document.getElementById(d);if(!t)return;const e=t.querySelector("#mul-card");e&&(e.style.transition="opacity 0.2s ease, transform 0.2s ease",e.style.opacity="0",e.style.transform="translateY(10px) scale(0.95)"),setTimeout(()=>t.remove(),220)}function h(t){var S;if(!(t.status==="running"||t.status==="paused")){I();return}A();const s=k[t.status],i=z(t),o=t.status==="running",l=document.getElementById("mul-dot");l&&(l.className=o?"running":"",l.style.background=s.dotColor);const n=document.getElementById("mul-pill");n&&(n.textContent=s.label,n.style.background=s.pillBg,n.style.borderColor=s.pillBorder,n.style.color=s.pillText);const r=document.getElementById("mul-pct");r&&(r.textContent=`${i.pct}%`);const a=document.getElementById("mul-fill");a&&(a.style.width=`${Math.min(100,Math.max(0,i.pct))}%`);const b=document.getElementById("mul-dispatched"),v=document.getElementById("mul-total");b&&(b.textContent=String(i.dispatched)),v&&(v.textContent=String(i.total));const m=document.getElementById("mul-active-slots");if(m)if(t.mode==="queue"){const R=((S=t.managedTabIds)==null?void 0:S.length)??0;m.textContent=`· ${R}/${t.limit} active slots`,m.style.display="inline"}else m.style.display="none";const y=document.getElementById("mul-stat-success"),E=document.getElementById("mul-stat-failed"),F=document.getElementById("mul-stat-remaining"),u=document.getElementById("mul-chip-failed");y&&(y.textContent=String(i.success)),E&&(E.textContent=String(i.failed)),F&&(F.textContent=String(i.remaining)),u&&(i.failed>0?u.classList.add("has-errors"):u.classList.remove("has-errors"));const p=document.getElementById("mul-status-msg");p&&(p.textContent=t.statusMessage||"Opening URLs...",p.title=t.statusMessage||"");const B=document.getElementById("mul-min-counts");B&&(B.textContent=`${i.dispatched}/${i.total} (${i.pct}%)`);const c=document.getElementById("mul-btn-pr");c&&(o?(c.textContent="Pause",c.className="mul-btn"):(c.textContent="Resume",c.className="mul-btn resume"));const w=document.getElementById("mul-toggle");w&&(w.innerHTML="&minus;")}function M(t){typeof t!="object"||t===null||t.type!=="MULTIURL_STATE_UPDATE"||h(t.state)}function T(){var t;typeof chrome>"u"||!((t=chrome.runtime)!=null&&t.onMessage)||(chrome.runtime.onMessage.addListener(M),chrome.runtime.sendMessage({type:"GET_STATE"},e=>{chrome.runtime.lastError||!(e!=null&&e.success)||!(e!=null&&e.data)||h(e.data)}))}T()})();
