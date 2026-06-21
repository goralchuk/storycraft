## 1. Scenarios & business-logic doc

- [x] 1.1 Write `docs/SCENARIOS.md` — actors, the coin economy (charges/credits/refunds table), and the main user journeys (onboarding, 3-step wizard, generation, reader, wallet, children/heroes, admin pricing); a living reference for further development

## 2. Idempotent job-claim (fix)

- [x] 2.1 `book-generation.processor.ts`: replace the unconditional initial `PROCESSING` update with an atomic claim `updateMany status=PENDING → PROCESSING (stage HEROES, progress 5)`; return early if it claims nothing

## 3. Integration test harness (dev-only)

- [x] 3.1 `test/jest-int.json` (`testRegex: .int-spec.ts$`) + `test:int` script (`jest --config ... --runInBand`)
- [x] 3.2 `test/coin-economy.int-spec.ts`: build module from `AppModule`, override `TextGenerator`/`ImageGenerator`/`PdfService`/`StorageService` with fakes and `TasksService.enqueueBookGeneration` no-op; create one test user (cleanup-only in `afterAll`, restore changed prices)
- [x] 3.3 Scenarios: starting balance 500; package purchase credit; book-type debit; companion + hero top-up debits; page-tier surcharge at submit; completion resets hero free attempts; failure refunds the surcharge; tier-12 failure refunds nothing; refund happens once on re-run; admin price change applies to the next charge — each asserting balance + the ledger entry

## 4. Run docs

- [x] 4.1 `docs/running.md`: prerequisites (Postgres + Redis; MinIO/AI not needed), the `test:int` command, the no-DB-wipe / test-user guarantees, and that integration tests are dev-only

## 5. Verify

- [x] 5.1 `npm run test:int` passes; backend `npm run build` + `lint` clean
