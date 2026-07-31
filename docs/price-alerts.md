# Price alerts

A user saves a route; a scheduled sweep re-shops it and emails them when the
fare drops.

## Endpoints

```
POST   /api/alerts        Create a watch
GET    /api/alerts        List your own
PATCH  /api/alerts/:id    Pause, resume, or change the target
DELETE /api/alerts/:id    Stop watching
GET    /api/cron/price-alerts   Run the sweep (cron only)
```

`targetPrice` is optional. With one, the user is told when the fare reaches it
and the alert is done. Without one, they are told whenever it sets a new low
and the watch continues.

Ownership is enforced in the `WHERE` clause, not by loading a row and comparing
afterwards, so another user's alert is never in memory and a miss is
indistinguishable from "does not exist".

Limits: 20 active alerts per user, departures up to 365 days out, one alert per
user per exact itinerary. That last constraint uses `UNIQUE NULLS NOT
DISTINCT` — `returnDate` is null on a one-way watch, and Postgres's default
treats every null as unique, which would let duplicates through.

## Notification rules

In `lib/alerts/evaluate.ts`, deliberately free of database and network access
so the rules that decide whether to email someone can be tested directly.

| Rule | Why |
| --- | --- |
| First sweep records a baseline, never notifies | Nothing to compare against yet |
| Drops under ৳500 are ignored | Fares wobble constantly; an alert that fires on noise gets muted |
| A new low is measured against the lowest *ever* seen, not the last seen | A fare that fell to 50k, bounced to 70k, then eased to 69k is not good news |
| At most one email per alert per 24h | A fare ticking down all day is one story, not twenty |
| A past departure date expires the alert | It cannot improve |
| No inventory keeps the alert active | Inventory reappears |

## Delivery must actually succeed

`sendEmail` returns `delivered: false` when SendGrid is unconfigured or rejects
the message — it does not throw and does not pretend.

The sweep depends on that: an alert whose notification failed stays `active`
and does **not** start its cooldown or flip to `triggered`. A user who was never
told must not lose their alert. This was verified against a rejected SendGrid
key: the target was met, delivery 401'd, and the alert correctly remained
active and un-notified.

## Scheduling

`vercel.json` runs the sweep every 6 hours. Vercel Cron invokes with **GET** and
supplies `Authorization: Bearer $CRON_SECRET` itself when `CRON_SECRET` is set.

Without `CRON_SECRET` the route returns 503 and refuses to run. An open
endpoint that fans out shopping calls is a denial-of-wallet vector, not just an
information leak. A wrong secret gets 404 rather than 401, and the comparison
is constant-time.

Alerts are swept least-recently-checked first, capped at 100 per run. A growing
alert table lengthens the cycle rather than blowing one invocation's budget. An
alert that fails five consecutive sweeps is paused rather than retried forever.

## Operating

```bash
curl -X POST localhost:3000/api/cron/price-alerts \
  -H "Authorization: Bearer $CRON_SECRET"
# {"checked":2,"notified":0,"failed":0,"expired":0,"outcomes":{...}}
```

`notified` counts messages that actually went out. If it stays at zero while
`outcomes` shows `notify_target_met`, email delivery is failing — check the logs
for `SendGrid rejected` or `Email not configured`.
