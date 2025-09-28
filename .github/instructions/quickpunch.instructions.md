---
applyTo: "src/**"
---

# QuickPunch Developer & Maintainer Instructions

## 1. Project Overview

QuickPunch is a fast, minimal time tracking app designed for daily work hour recording, including lunch breaks and internal company time. It enables easy manual transfer to employer systems and prioritizes speed, clarity, and error recovery.

---

## 2. Core UX Principles

- **Speed & Simplicity:** One-tap time recording, minimal data entry.
- **Clarity:** Distinct actions for Meet, Leave, and Lunch; clear feedback after each entry.
- **Error Recovery:** Easy editing and deletion of records.

---

## 3. User Flow

1. **Start of Day:**
   - User opens app, sees today’s date.
2. **Time Entry:**
   - "Meet" records arrival time.
   - "Lunch" toggles lunch start/stop. If lunch < 30 min, use actual; if ≥ 30 min, default to 30 min.
   - "Leave" records departure time.
3. **Review:**
   - Today’s times shown immediately; options to edit/delete.
4. **History:**
   - Past days listed for review, editing, or deletion.
5. **Reporting:**
   - Table view for manual transfer, with input for internal company time and copy-to-clipboard actions.

---

## 4. Implementation Guidelines

### 4.1 Component Structure

- **Main View:**
  - Three buttons: Meet, Leave, Lunch (toggle).
  - Summary of today’s times with edit/delete icons.
- **History View:**
  - List/table of previous days with management actions.
- **Reporting View:**
  - Table: Date, Meet, Leave, Lunch, Internal Company Time, Work Time (auto-calculated).
  - Input for internal company time (default null).
  - Copy row/all functionality for manual transfer.

### 4.2 State Management

- Use Svelte stores for all UI state.
- Sync Svelte store with IndexedDB on load/change.

### 4.3 Persistence Layer

- Use IndexedDB for all CRUD operations.
- Centralize IndexedDB logic in a service module (consider a wrapper like `idb-keyval`).
- No export/import or backup features required.

### 4.4 Styling

- Use TailwindCSS for rapid, responsive UI.
- Apply color and spacing to separate sections and highlight actions.
- Ensure responsive layout for desktop and mobile.

### 4.5 Clipboard Utility

- Implement per-value copy logic using the browser Clipboard API.
- Provide clear feedback (tooltip or toast) after copy actions.

---

## 5. Calculation Logic & Data Flow

### 5.1 Data Model

Each record:

```js
{
  date,
    meetTime,
    leaveTime,
    lunchStart,
    lunchEnd,
    internalCompanyTime,
    workTime;
}
```

### 5.2 Calculation

- **Work Time:**
  $$
  \text{Work Time} = (\text{Leave Time} - \text{Meet Time}) - \text{Lunch Time} - \text{Internal Company Time}
  $$
- Lunch time: If duration < 30 min, use actual; if ≥ 30 min, default to 30 min.
- All times displayed in decimal format (e.g., 1.5 for 1 hour 30 minutes).

### 5.3 Data Flow

- All CRUD operations interact with IndexedDB.
- Svelte store updates UI reactively and syncs with IndexedDB.

---

## 6. Best Practices

- Organize code into logical Svelte components (Main, History, Reporting).
- Centralize persistence logic for maintainability.
- Use Tailwind utility classes for rapid prototyping and responsive tweaks.
- Ensure all UI elements are accessible and keyboard-friendly.
- Document calculation logic and UI flows for future maintainers.
- Provide clear feedback for all user actions (e.g., copy, edit, delete).

---

## 7. Accessibility & Maintainability

- Ensure keyboard navigation for all interactive elements.
- Use semantic HTML and ARIA attributes where appropriate.
- Write clear, concise comments and documentation.
- Structure components for easy extension and refactoring.

---

## 8. Deployment Instructions (GitHub Pages)

- Build the app using Vite.
- Deploy the static site to GitHub Pages.
- Add clear deployment instructions to the README for future maintainers.

---

## 9. Onboarding Checklist

- Review this instructions file and the README.
- Familiarize yourself with Svelte, TailwindCSS, and IndexedDB.
- Explore the component structure and persistence logic.
- Test all user flows: time entry, review, history, reporting, and copy actions.
- Validate accessibility and responsive design.
- Follow best practices for maintainability and deployment.

---

## 10. References

- [Svelte Documentation](https://svelte.dev/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [idb-keyval](https://github.com/jakearchibald/idb-keyval)
- [GitHub Pages Deployment Guide](https://pages.github.com/)
