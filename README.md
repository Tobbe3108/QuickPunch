# QuickPunch - Time Tracking App

## Purpose
Enable fast, accurate daily work hour tracking with minimal effort, supporting lunch breaks and internal company time reporting for easy manual transfer to employer systems.

## Core UX Principles
- **Speed & Simplicity:** One-tap time recording, minimal data entry.
- **Clarity:** Distinct actions for Meet, Leave, and Lunch; clear feedback after each entry.
- **Error Recovery:** Easy editing and deletion of records.

## User Flow
1. **Start of Day:** User opens app, sees today’s date.
2. **Time Entry:**
- User is presented with a single, full-width button for the next required action ("Meet" on arrival, then "Leave" at departure).
- "Lunch" is an optional step: after "Meet", the user can either record lunch ("Start Lunch"/"End Lunch") or skip directly to "Leave".
- The flow enforces that "Meet" and "Leave" must be recorded in order; lunch can be skipped.
3. **Review:** Today’s times are shown immediately, with options to edit or delete.
4. **History:** Past days are listed for review, editing, or deletion.
5. **Reporting:** Table view for manual transfer, with input for internal company time and copy-to-clipboard actions.

- **Main View:**
- Flow-based: Only one large, context-sensitive button is shown at a time, filling the page (e.g., Meet, Pause, Resume, Start Lunch, End Lunch, Leave).
- After each action, the button updates to the next logical step, guiding the user through the day, including pause/resume cycles.
- Minimal summary of today’s segments and times shown below the button, with quick access to edit/undo for corrections. Paused state is clearly indicated.
- No other controls or distractions until their step is reached.

- **History View:**
- List/table of previous days, with management actions.

- **Reporting View:**
- Table: Date, Meet, Leave, Lunch, Internal Company Time, Work Time (auto-calculated).
- Input for internal company time (default null).
- All times in decimal format (e.g., 1.5 for 1 hour 30 minutes).
- Copy row/all functionality for manual transfer.

- **Visual Design:**
- Use color and spacing to separate sections and highlight actions.
- Responsive layout for desktop and mobile.

## Calculation Logic
- **Work Time:** {Work Time} = ({Leave Time} - {Meet Time}) - {Lunch Time} - {Internal Company Time}$

## Design Principles
- Minimal, fast, and focused on quick time entry.
- Flow-based, context-sensitive UI with only one action visible at a time.
- "Meet" and "Leave" are required steps; "Lunch" is optional and can be skipped.
- Clear display of today’s times and easy record management.

# High-Level Architecture
- **App Shell (Svelte 5 SPA)**
  - Main View: Meet, Leave, Lunch buttons; today’s summary; edit/delete actions.
  - History View: Table/list of previous days; edit/delete.
  - Reporting View: Table with copyable values.
- **State Management**
  - Svelte stores for UI state.
- **Persistence Layer**
  - Cloudflare KV (via serverless API endpoints).
  - All CRUD operations interact with Cloudflare KV using a user token for identification.
- **Styling**
  - TailwindCSS for rapid, responsive UI.
- **Clipboard Utility**
  - Per-value copy logic (using browser Clipboard API).
- **Hosting**
  - Cloudflare Pages (static site + serverless functions).

---

## Data Flow & Storage Strategy
- **Data Model:**  
  Each record: { date, meetTime, leaveTime, lunchStart, lunchEnd, internalCompanyTime, workTime }
- **Persistence:**  
  - All CRUD operations interact with Cloudflare KV via API endpoints.
  - Svelte store syncs with Cloudflare KV on load/change.
- **Authentication:**  
  - User token is provided by user and stored locally; used for all requests.
- **No Export/Import:**  
  - No backup/migration features required.
- **Offline Support:**  
  - Not supported; all data is cloud-based.

---

## Technology Stack
- **Frontend:** Svelte 5 (SPA)
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Persistence:** Cloudflare KV (cloud-based, no local cache)
- **Clipboard:** Browser Clipboard API
- **Hosting:** Cloudflare Pages (static site + serverless functions)

---

## Optimizations & Best Practices
- Use Cloudflare KV for simple, scalable, free data storage.
- Structure Svelte components for maintainability (Main, History, Reporting).
- Main view should use a state-driven flow to determine which button/action is shown, including logic for skipping lunch.
- Use Tailwind’s utility classes for rapid prototyping and responsive tweaks.
- Implement clipboard copy with clear feedback (e.g., tooltip or toast).
- Document calculation logic and UI flows for future maintainers.

---

## Implementation Guidelines
- Organize code into logical Svelte components.
- Centralize Cloudflare KV logic in a service module.
- Use Svelte stores for reactive UI updates.
- Ensure all UI elements are accessible and keyboard-friendly. No additional accessibility or localization requirements beyond standard best practices.
- Add clear instructions for Cloudflare Pages deployment in the README.
