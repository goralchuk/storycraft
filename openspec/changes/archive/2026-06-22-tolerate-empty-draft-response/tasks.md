## 1. Tolerant draft parsing (already shipped in f3f321e)

- [x] 1.1 Add `jsonOrNull<T>(res)` helper in `frontend/src/lib/api.ts` (empty body → `null`)
- [x] 1.2 Use it at the `/books/draft` call sites: `dashboard/page.tsx`, `books/new/page.tsx`
- [x] 1.3 Verify a brand-new account (no draft) loads the dashboard and wizard without a 500

## 2. Spec

- [x] 2.1 Document the empty-body contract + client tolerance on the "Resume the current draft" requirement
