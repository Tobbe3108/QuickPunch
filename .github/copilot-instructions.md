# QuickPunch AI Coding Agent Instructions

## Project Overview

QuickPunch is a Svelte 5 SPA for fast, accurate daily work hour tracking. It features a flow-based UI, cloud persistence, and reporting tools for manual time transfer.

## Architecture & Data Flow

- **Frontend:** Svelte 5 SPA, organized by views (Main, History, Reporting) in `src/routes/` and a dedicated component architecture in `src/lib/components/`.
  - **Component Architecture:** All reusable UI elements (buttons, toasts, time displays, etc.) are implemented as Svelte components in `src/lib/components/`. Views in `src/routes/` compose these components for page-level logic and layout. Components follow atomic design principles for maintainability and reusability.
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

Whenever you are instructed to implement a issue you MUST:

- Discover and fetch information about the target issue, its parent issue (if any), all sub-issues, and recursively all sub-sub-issues at every level of the hierarchy.
- For every issue, always clarify and confirm the full hierarchy: parent, sub-issues, and all nested sub-issues before starting implementation.
- Implement all features and requirements for the target issue and all sub-issues and sub-sub-issues, in the exact order they appear in the hierarchy. (Do not implement the parent issue itself—use it only for context.)
- Do NOT consider any issue complete until all its sub-issues and all nested sub-issues are fully implemented.

This protocol guarantees that, regardless of which issue level you are asked to implement, you will deliver all related features and requirements for the entire hierarchy (excluding parent issue implementation), in the correct order, with nothing omitted.

## References

- `src/routes/` — Main, History, Reporting views
- `src/lib/idbService.ts` — Cloudflare KV service logic
- `vite.config.ts`, `playwright.config.ts` — Build/test config
- `README.md` — Architecture, deployment, calculation logic

---

For questions or unclear patterns, review the README and referenced files. Ask for feedback if any section is incomplete or ambiguous.
