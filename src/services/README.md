# Services

All API calls live here — one service file per domain.

Every service uses the shared Axios instance from `lib/axios.ts`.
API base URLs come from environment variables.

**Mock mode**: all services return realistic mock data with simulated network delays.
**Production**: swap mock responses for real Axios calls — no component changes needed.

| File | Endpoints |
|------|-----------|
| `auth.service.ts` | POST /auth/login, register, logout, verify-otp |
| `dashboard.service.ts` | GET /dashboard |
| `mood.service.ts` | GET/POST /moods |
| `journal.service.ts` | GET/POST/PATCH/DELETE /journal |
| `listener.service.ts` | GET /listeners |
| `booking.service.ts` | POST /booking |
| `community.service.ts` | GET/POST /communities |
| `event.service.ts` | GET /circles, /events |
| `affirmation.service.ts` | GET/POST /affirmations |
| `ai.service.ts` | POST /ai/message |
| `profile.service.ts` | GET/PATCH /profile |
