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
	 - Press “Meet” to record arrival time.
	 - Press “Lunch” to start lunch; press again to stop. If lunch duration < 30 min, use actual; if ≥ 30 min, default to 30 min.
	 - Press “Leave” to record departure time.
3. **Review:** Today’s times are shown immediately, with options to edit or delete.
4. **History:** Past days are listed for review, editing, or deletion.
5. **Reporting:** Table view for manual transfer, with input for internal company time and copy-to-clipboard actions.

## Interface Recommendations
- **Main View:**
	- Three prominent buttons: Meet, Leave, Lunch (toggle).
	- Below: summary of today’s times, with edit/delete icons.
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
- Clear display of today’s times and easy record management.
