# QuickPunch AI Coding Agent Instructions

## Project Overview

QuickPunch is a Svelte 5 SPA for fast, accurate daily work hour tracking. It features a flow-based UI, cloud persistence, and reporting tools for manual time transfer.

## Architecture & Data Flow

- **Frontend:** Svelte 5, organized by views: Main, History, Reporting (see `src/routes/` and `src/lib/`).
- **State Management:** Svelte stores drive UI state and sync with backend.
- **Persistence:** All CRUD operations use Cloudflare KV via serverless API endpoints. No local/offline cache.
- **Authentication:** User token stored locally, sent with all API requests.
- **Styling:** TailwindCSS for responsive, utility-first design.
- **Clipboard:** Use browser Clipboard API for copy actions in reporting.

## Developer Workflows

- **Build:** Use Vite (`vite.config.ts`).
- **Run/Dev:** `npm run dev` (see `package.json`).
- **Test:** Playwright for E2E (`playwright.config.ts`).
- **Deploy:** Cloudflare Pages (static + serverless). See README for deployment steps.

## Key Patterns & Conventions

- **Flow-based UI:** Only one main action button visible at a time, context-driven (see Main View logic).
- **Data Model:** `{ date, meetTime, leaveTime, lunchStart, lunchEnd, internalCompanyTime, workTime }`.
- **Cloudflare KV Service:** Centralize API logic in a service module (see `src/lib/idbService.ts`).
- **Reporting:** Table view with copy-to-clipboard, decimal time format (e.g., 1.5 for 1h30m).
- **No Export/Import:** No backup/migration features; all data is cloud-based.
- **No Offline Support:** App requires connectivity for all features.

## Integration Points

- **Cloudflare KV:** All data operations via API endpoints.
- **Clipboard API:** For reporting view copy actions.
- **TailwindCSS:** Utility classes for layout and design.

## Examples

- Main action button logic: see Main View in `src/routes/+page.svelte`.
- Cloudflare KV service: see `src/lib/idbService.ts`.
- Reporting table: see Reporting View in `src/routes/+page.svelte`.

## Epic & Issue Implementation Protocol

When instructed to implement an Epic (e.g., "implement Epic (some id)"), you MUST:

- Fetch the Epic issue and ALL its sub-issues recursively (including sub-issues of sub-issues).
- For each Epic, implement all sub-issue features in the order they appear.
- For each sub-issue, if it contains further sub-issues, fetch and implement those in order before proceeding.
- Do NOT consider the Epic complete until all sub-issues and their sub-issues are fully implemented.
- Always clarify and confirm the full issue hierarchy before starting implementation.

This ensures that all features and requirements associated with an Epic are delivered completely and in the correct order.

## References

- `src/routes/` — Main, History, Reporting views
- `src/lib/idbService.ts` — Cloudflare KV service logic
- `vite.config.ts`, `playwright.config.ts` — Build/test config
- `README.md` — Architecture, deployment, calculation logic

---

For questions or unclear patterns, review the README and referenced files. Ask for feedback if any section is incomplete or ambiguous.
