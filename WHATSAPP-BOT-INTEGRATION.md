# WhatsApp Bot Integration

Use this app endpoint to fetch the code that should be posted to WhatsApp:

- `GET /api/session-code`
- Example local URL: `http://localhost:8080/api/session-code`
- `GET /api/next-code` (next session code only)

You can also push a code from your bot into this app:

- `POST /incoming-sme-code`
- Example local URL: `http://localhost:8080/incoming-sme-code`

## Auto-share next code to WhatsApp webhook

You can let the server auto-send the next code during pre-live window.

Set environment variable before starting server:

- `WHATSAPP_PUSH_WEBHOOK=http://YOUR_SERVER:3000/incoming-sme-code`
- Optional auth header support:
  - `WHATSAPP_PUSH_AUTH_HEADER=Authorization`
  - `WHATSAPP_PUSH_AUTH_TOKEN=Bearer <your-token>`

Behavior:

- Server checks every 30 seconds.
- During `prelive`, it sends one POST per session with the next code.
- Payload includes `code`, `phase`, `sessionHour`, `start`, and `message`.

## Response shape

```json
{
  "phase": "live | prelive | offline",
  "code": "AV-XXXXX",
  "now": "local timestamp",
  "session": {
    "hour": 9,
    "start": "local timestamp",
    "end": "local timestamp",
    "preliveStart": "local timestamp"
  },
  "scheduleHours": [9, 14, 21],
  "message": "Human-friendly text"
}
```

## Bot behavior (recommended)

1. Poll endpoint every 30-60 seconds.
2. Send WhatsApp message only when:
   - phase changes (`offline` -> `prelive` or `prelive` -> `live`), or
   - `code` changes.
3. Store last sent `{ phase, code }` to avoid duplicate messages.

## Suggested WhatsApp message templates

- Pre-live:
  - `Aviator update: Going live soon. Upcoming code: {{code}}`
- Live:
  - `Aviator update: LIVE now. Session code: {{code}}`
- Offline:
  - `Aviator update: Offline now. Next code: {{code}}`

## Quick test

From terminal:

- `curl http://localhost:8080/api/session-code`

Push a code from bot:

- `curl -X POST http://localhost:8080/incoming-sme-code -H "Content-Type: application/json" -d "{\"code\":\"AV-9XQ12\",\"phase\":\"live\",\"source\":\"whatsapp-bot\",\"message\":\"LIVE NOW. Code: AV-9XQ12\"}"`

If you are hosting this publicly, replace localhost with your live domain.
