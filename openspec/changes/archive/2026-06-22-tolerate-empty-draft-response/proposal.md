## Why

`GET /books/draft` returns the active draft or, when there is none, an HTTP 200 with an **empty body** (NestJS serializes a `null` handler return that way). The frontend parsed the response with `Response.json()` whenever it was `ok`, which throws `Unexpected end of JSON input` on an empty body — 500-ing the dashboard and the book wizard for any brand-new account with no draft. This change retro-documents the already-shipped fix (commit `f3f321e`).

## What Changes

- Clarify the `GET /books/draft` contract: "no draft" is conveyed as an HTTP 200 with an empty body, and clients SHALL tolerate it (treat empty as "no draft") rather than assume a JSON body.
- (Already implemented) Frontend `jsonOrNull` helper used at the two draft call sites (`dashboard`, `books/new`) so an empty body parses to `null`.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `book-lifecycle`: the "Resume the current draft" requirement gains the empty-body semantics and the client-tolerance expectation.

## Impact

- **Frontend**: `lib/api.ts` (`jsonOrNull`), `dashboard/page.tsx`, `books/new/page.tsx` — already committed in `f3f321e`.
- **Backend**: no change (the `null`→empty-body behavior is the documented contract).
