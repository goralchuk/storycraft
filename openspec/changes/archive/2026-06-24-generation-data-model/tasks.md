## 1. Schema

- [x] 1.1 Add enum `GenerationStatus`; models `StyleTemplate`, `PageLayoutTemplate`, `BookGeneration`, `BookGenerationLog`, `BookTemplateHistory`
- [x] 1.2 Modify `Hero` (`imageCaption?`, `personality?`), `Template` (`isCustomBase`), `Book` (`templateHistoryId?` + relation)
- [x] 1.3 Migration + `prisma generate`

## 2. Seeds (placeholders)

- [x] 2.1 Seed ≥1 `StyleTemplate`, a `PageLayoutTemplate` for 12/16/20/24, and a custom-base `Template`

## 3. Verify + document

- [x] 3.1 `migrate deploy` + `prisma generate` + `npm run build` clean; seed runs; fresh-DB catalog present
- [x] 3.2 Document in `docs/phase-9-data-model.md`
