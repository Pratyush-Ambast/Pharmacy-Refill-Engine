# Refill Engine

**Every stuck refill has a state, a reason, and an owner.**

Refill Engine is a coordination layer for the prescription refills that get
stuck when provider intervention is required. It replaces the
fax → phone-tag → portal-loop chaos with one thing: a **state machine** where
every refill knows why it's stuck, who can resolve it, and whether it
actually got resolved — with humans making every clinical decision and an
append-only audit trail proving it.

## Why it wins the argument

- **Product**: a work queue where every refill shows state + blocker +
  next action + owner.
- **Intelligence**: AI *proposes* triage classifications; guardrails decide
  the initial state; humans act; the system *verifies* outcomes.
- **Observability**: one append-only `events` table powers the UI timeline,
  "why is this stuck" debugging, and the compliance audit trail.
- **Market**: time-to-resolution is simultaneously the AI metric, the
  product KPI, and the sales pitch.

## Architecture

```
Intake (fax text / portal msg / eRx payload)
   → POST /api/intake
   → AI classifier (Anthropic; rules fallback if no key)
   → guardrails.ts (confidence threshold → ESCALATED on doubt)
   → Neon Postgres: refill row + creation event
   → Staff queue UI → routes / clears blockers
   → Provider decision screen → approve/decline (role-guarded)
   → eRx adapter (mock Surescripts) → SENT_TO_PHARMACY
   → Vercel Cron /api/cron/verify once per day on the Hobby plan
        → pharmacy fill confirmed → FILLED (+ SMS to patient)
        → stale states → auto-ESCALATED (+ SMS)
   → events table = timeline / observability / audit
```

Layering rules that make this safe to build in 24h:

- `lib/core/` — pure functions, zero imports. Unit-testable in isolation.
- `lib/ai/` + `lib/adapters/` — every external service behind a seam
  (LLM, SMS, pharmacy network). Mocks ship with the demo; production
  adapters drop in without touching the core.
- The AI has **no code path** to the decision endpoint.

## Quickstart (local)

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL (Neon), optional keys
npm run dev
# then visit:  http://localhost:3000/api/seed
# then:        http://localhost:3000
```

## Deploy to Vercel (≈10 minutes)

1. Push this repo to GitHub.
2. **Neon**: Vercel Marketplace → Neon → create project → copy the
   **pooled** connection string.
3. **Vercel**: Import repo → Settings → Environment Variables → add
   `DATABASE_URL` (+ optional `ANTHROPIC_API_KEY`, Twilio vars, `CRON_SECRET`).
4. Deploy. `vercel.json` registers a Hobby-compatible daily verification cron.
5. Visit `https://<your-app>.vercel.app/api/seed` once, then open the app.

No servers anywhere: frontend + API + cron are Vercel Functions; the
database is serverless Neon; artifacts would live in Vercel Blob.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon pooled connection string |
| `ANTHROPIC_API_KEY` | ➖ | LLM triage (falls back to rules classifier) |
| `ANTHROPIC_MODEL` | ➖ | Default `claude-3-5-haiku-latest` |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE` | ➖ | Real SMS (else simulated in logs) |
| `DEMO_PATIENT_PHONE` | ➖ | Where demo texts go |
| `CRON_SECRET` | ➖ | Protects `/api/cron/verify` |
| `DEMO_STALE_MINUTES` | ➖ | Compress escalation timeouts for live demos |
| `FILL_DELAY_MINUTES` | ➖ | Pharmacy fill delay for cron (default 2) |

## Stage demo script (6 minutes)

1. **Seed is pre-loaded** with 7 refills — one per blocker.
2. Show the queue: every row has state, blocker, confidence, age.
3. Open **Tom Baker** (#6): full history received → provider → approved →
   sent. Point at the timeline: "this is the audit trail."
4. Open **Linda Gomez** (#7): confidence 42% → auto-escalated by the
   guardrail. "The AI is not allowed to act on doubt."
5. Live intake: paste a new fax → watch classification → routed state →
   timeline event appear.
6. Switch role to **Provider**, approve Mary Alvarez → eRx fires instantly,
   patient SMS sent, state flips to SENT_TO_PHARMACY.
7. "The cron job checks every 5 minutes whether the pharmacy actually
   filled it." *(With `DEMO_STALE_MINUTES=3`, stale items escalate live
   on stage.)*
8. Guardrail beat (optional): switch back to **Staff**, try to approve →
   409 from the state machine. "Role enforcement is server-side."

## Security notes (read before judging)

- **Demo auth is deliberate and visible**: role travels as `x-demo-role`;
  enforcement is server-side in `canTransition()`. Production: Clerk/Auth.js
  + per-practice RBAC, membership-checked on every query.
- **PHI**: this demo uses synthetic data. A production deployment handling
  real PHI requires a BAA with the hosting provider (Vercel Enterprise) or
  moving compute to a HIPAA-eligible host — same architecture either way.
- **AI guardrails**: confidence threshold routes doubt to humans; clinical
  transitions require the `provider` role; the AI never executes actions.
- **Audit**: `events` is append-only; every action records actor, reason,
  timestamp, and payload.
- **Secrets**: server-side only; adapters are the only network egress.

## Production hardening (the roadmap)

- Real Surescripts/RxChange NCPDP adapter + pharmacy webhooks (seam ready).
- Per-practice tenancy + row-level security in Postgres.
- EHR write-back via FHIR R4 (Epic/Cerner SMART apps).
- Standing-order protocol engine: stable chronic meds auto-approved within
  encoded clinical rules, provider signs the batch.
- PA automation integration (e.g., CoverMyMeds seam).
- WebSocket/push live queue instead of polling.
