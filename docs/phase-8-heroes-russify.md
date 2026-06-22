# Phase 8.7 — Russify the heroes screen

Result of ROADMAP task 8.7. The heroes screen (`/children/[id]/heroes`) was the last
un-redesigned page — English text with raw inline styles. It is now Russian and on
the design system. Presentation only; no behavior change. OpenSpec change:
`russify-heroes-screen` (no spec delta).

## What was delivered

- **Russian UI.** All strings translated: роли (Главный герой / Питомец / Брат-сестра
  / Друг / Волшебный), статусы (ожидает / генерируется / готов), кнопки
  (Сгенерировать / Купить 3 / Удалить / Добавить), ошибка top-up, ссылка «← На
  главную». Free-attempts count uses correct Russian pluralization.
- **Design system.** Replaced inline styles with the shared tokens (cards, pill
  buttons, display font, muted text); heroes without an image use the shared
  `Avatar`.
- **Logic unchanged.** Same server actions (generate / add companion / remove /
  top-up) and data flow.

## Verification

Frontend `tsc --noEmit` clean; a scan for user-facing English strings on the page
returns nothing.
