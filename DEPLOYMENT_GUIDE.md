# Deployment runbook

For what the platform does and its current gaps, see
[PRODUCTION_READY.md](PRODUCTION_READY.md). This file is the deploy procedure only.

## 1. Environment

```bash
cp .env.example .env.local
```

Required to boot:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Neon connection string, `?sslmode=require` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Public origin, e.g. `https://example.com` |

Required for payments:

| Variable | Notes |
| --- | --- |
| `STRIPE_SECRET_KEY` | Test key first |
| `STRIPE_WEBHOOK_SECRET` | From the webhook endpoint you create in step 4 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side card form |
| `FX_RATES_JSON` | BDT per unit. Defaults in `lib/fx.ts` are static and will drift. |

Optional: `FLIGHT_PROVIDER` / `AMADEUS_*` (see
[docs/flight-distribution.md](docs/flight-distribution.md)), `SENDGRID_API_KEY`,
`SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`.

## 2. Database

```bash
npm run db:migrate    # apply drizzle/ migrations
npm run db:seed       # 14 airlines, 13 airports, 4 sample flights
```

`db:seed` is idempotent — it skips rows that already exist.

Registration cannot create a superadmin, by design. Provision the first one
directly:

```sql
UPDATE users SET role = 'superadmin' WHERE email = 'you@example.com';
```

## 3. Build and deploy

```bash
npm run typecheck     # must be clean
npm run build         # must be clean
vercel deploy --prod
```

## 4. Stripe webhook

Create an endpoint at `https://<your-domain>/api/webhooks/stripe` subscribed to:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

Copy its signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy. Signatures
are verified before any handling, so a wrong secret rejects every event.

## 5. Smoke test

```bash
# Search — expect offers on a date with seeded inventory
curl -s -X POST "$BASE/api/flights/search" -H 'Content-Type: application/json' \
  -d '{"from":"DAC","to":"DXB","departureDate":"2026-08-02","adults":1}'

# Register, then sign in through /login and confirm the session carries a role
curl -s -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","fullName":"You","password":"a-long-passphrase"}'
curl -s -b cookies.txt "$BASE/api/auth/session"   # must include "role"
```

An empty `role` in the session means the JWT callbacks in `lib/auth-config.ts`
are not running — every role-gated endpoint will return 403.

Local Stripe testing:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

Confirmation only applies to bookings still in `pending_payment`; a redelivered
event on an already-confirmed booking is logged and skipped.

## 6. After deploy

- Sentry for errors, Neon console for query performance and connection count
- Stripe dashboard → Logs for declined and failed intents
- Watch for `Provider ... failed` lines: the flight search fell back to local
  inventory and served `degraded: true`

## Rollback

Migrations are additive (new nullable columns, a widened timestamp type), so the
previous build runs against the current schema. Redeploy the prior Vercel
deployment; no database rollback is needed.
