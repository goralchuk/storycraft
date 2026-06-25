# Working Process

The development cycle, in order:

1. **Plan.** From ideas and drafts, refine the shared `ROADMAP.md`, then commit the accepted plan. `ROADMAP.md` is the plan — edit only unimplemented phases.
2. **Implement via OpenSpec.** Take tasks from `ROADMAP.md` in order and work each one through the full OpenSpec cycle (propose → implement → verify). Fully close one change (verify → sync specs → archive) before opening the next.
3. **Document.** After finishing a task, update the docs in `docs/` — one document per phase (`docs/phase-N-*.md`).
4. **Commit, don't push.** Make a Git commit when the task is done. **Never `git push` without my explicit permission.**

# Development Rules
## 1. Implementation Analysis
No guessing. If something is unclear, ask clarifying questions.
State assumptions and offer simple coding solutions.
## 2. Minimalism
Code only for the current task. No future-proofing unless explicitly requested.
If you see a way to shorten or simplify, shorten and simplify.
## 3. Precise Changes.
Changes are limited to the target code. Do not touch adjacent functions or any other logic unless explicitly requested.
Adhere to the established project style.
Clean up after yourself: if functionality is no longer used, remove it. Remove only those dependencies that are no longer needed due to your changes.
## 4. Complex Tasks – Composition
For complex tasks, write a plan: an action and a verification method that will validate the result.
## 5. Git Commits
Commit when a task is complete (see Working Process). Never `git push` without explicit permission.
Do **not** add any `Co-Authored-By` trailer (e.g. `Co-Authored-By: Claude ...`) or other AI attribution to commit messages.
## 6. Stage Documentation
After completing a stage, create a stage description file in the `docs/` folder. Wait for review before making edits.
## 7. API Documentation
Maintain a dedicated `docs/API.md` file. Document API endpoints there only — keep it separate from other docs.
## 8. User Guide
Maintain `docs/USERGUIDE.md` with descriptions of user use cases.
## 9. Basic Philosophy
Before getting started, please review the `AGENTS.md` file.