# Working on this repo

## Before you push

CI runs these; running them locally first is faster than a red build.

```bash
npm run typecheck   # must be clean
npm test            # must be clean
npm run build       # must be clean
npm run lint        # advisory — see below
```

## Branching

Work on a branch and open a pull request. `main` should always be deployable.

```bash
git switch -c fix/seat-release-on-cancel
# ... work ...
git push -u origin fix/seat-release-on-cancel
gh pr create
```

Branch names: `feat/`, `fix/`, `docs/`, `chore/` followed by a short
description.

## Commit messages

A subject line that says what changed, then a body that says **why**, and what
was actually verified. The history is the only place the reasoning survives —
"fix bug" tells a future reader nothing.

State what you checked and what you did not. If a path compiles but was never
run, say so rather than implying it works.

## Database changes

Editing `lib/db/schema.ts` alone is not enough — CI fails if the schema and the
committed migrations disagree.

```bash
npm run db:generate   # writes drizzle/NNNN_*.sql
npm run db:migrate    # applies to the database in DATABASE_URL
```

Commit the generated `.sql` and its `drizzle/meta` snapshot together with the
schema change.

## Tests

`tests/` uses vitest and runs with `TZ=UTC` pinned — flight times are
timezone-sensitive, and a developer's local zone must not change what the suite
asserts.

Logic that decides money or eligibility belongs in a module free of database
and network access, so it can be tested directly:
`lib/ancillaries/pricing.ts`, `lib/alerts/evaluate.ts`, `lib/fx.ts`.

Route handlers are not covered by the suite; they have been exercised by hand.
Verifying one means running it, not reading it.

## Known lint debt

`npm run lint` reports around 20 errors in the UI layer — React hooks rules in
`components/search`, `app/account`, and `lib/hooks`. They predate the current
work, so lint is advisory in CI rather than blocking; a gate that is red on its
first run teaches everyone to ignore it.

Do not add new ones. When the existing ones are cleared, drop
`continue-on-error` from the lint step in `.github/workflows/ci.yml`.

## Secrets

`.env.local` is ignored and has never been committed — verified against the
full history. `.env.example` carries key names only, no values. Keep it that
way: add the name to `.env.example` when you add a variable, and put the value
in the deployment environment.
