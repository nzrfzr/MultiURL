# Security and Privacy

## Principles
- Process URL input locally in the browser.
- Do not upload or transmit pasted URLs.
- Do not collect analytics or browsing history by default.
- Do not inject scripts into opened pages.
- Do not use remote executable code.
- Request the minimum permissions required by the implemented features.

## URL safety
- Accept only explicitly supported protocols, normally `http:` and `https:`.
- Reject dangerous or unsupported schemes such as `javascript:`, `data:`, and `file:` unless a separately reviewed requirement justifies them.
- Do not evaluate URL text as code.
- Treat URL text as untrusted input and render it as text, never as raw HTML.
- Normalize input carefully; do not silently transform malformed hostnames into unrelated destinations.

## Permissions review
Before release, document every manifest permission and why it is needed. Prefer narrow permissions. Avoid host permissions if the extension only creates tabs and does not inspect page content.

## Data storage
Persist only the URL list and queue metadata needed for user experience and recovery. Define whether URL input persists after the session and give users a clear way to clear it. Version persisted state and handle corrupt or outdated data safely.

## Error reporting
Show local, actionable error messages. Do not include full URLs in external telemetry. Since no external telemetry is planned, avoid adding any unless a separate explicit product decision and privacy review are completed.
