import type { Keyed } from '$lib/utils/KeyValueService';
import type { TimeRecord } from '$lib/models/TimeRecord';

function toDate(d: unknown): Date | undefined {
	if (!d) return undefined;
	if (d instanceof Date) return d;
	const parsed = new Date(String(d));
	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function formatTimeHHMM(d?: Date | null): string {
	if (!d) return '';
	const date = toDate(d);
	if (!date) return '';
	const hh = String(date.getHours()).padStart(2, '0');
	const mm = String(date.getMinutes()).padStart(2, '0');
	return `${hh}:${mm}`;
}

/**
 * Convert milliseconds to decimal hours string using comma as decimal separator.
 * Rounds half-up to 2 decimals and strips trailing zeros (1,50 -> 1,5; 1,00 -> 1)
 */
export function formatDecimalHours(ms?: number | null): string {
	if (ms === null || ms === undefined) return '';
	const hours = ms / 3600000;
	// round half-up to 2 decimals
	const rounded = Math.round((hours + Number.EPSILON) * 100) / 100;
	// produce string with two decimals
	let s = rounded.toFixed(2);
	// strip trailing zero to produce at most two decimals, but ensure 0 becomes '0,0'
	if (/\.00$/.test(s)) {
		// whole number -> keep one decimal place (e.g. 1.00 -> 1,0)
		s = `${Math.trunc(rounded)}.0`;
	} else {
		// remove trailing zero in the hundredths place (e.g. 1.50 -> 1.5)
		s = s.replace(/(\d+\.\d)0$/, '$1');
	}
	return s.replace('.', ',');
}

/**
 * Parse a decimal hours string (comma or dot) into milliseconds.
 * Returns 0 for invalid input.
 */
export function parseDecimalHoursToMs(input?: string | null): number {
	if (!input) return 0;
	const normalized = input.trim().replace(',', '.');
	const value = parseFloat(normalized);
	if (Number.isNaN(value) || value < 0) return 0;
	return Math.round(value * 3600000);
}

/**
 * Compute work time in milliseconds for a TimeRecord.
 * Returns null when data is incomplete per plan (missing meet/leave or partially entered lunch).
 * Clamps negative results to 0.
 */
export function computeWorkTime(record: Keyed<TimeRecord>): number | null {
	const durations = record.Durations ?? [];
	if (!durations || durations.length === 0) return null;
	const first = durations[0];
	const last = durations[durations.length - 1];
	const meet = toDate(first?.start);
	const leave = toDate(last?.end);
	if (!meet || !leave) return null;

	// lunch: if present, both start and end must be present to be used; otherwise treat as incomplete
	const lunch = record.lunchDuration;
	let lunchMs = 0;
	if (lunch) {
		const lunchStart = toDate(lunch.start);
		const lunchEnd = toDate(lunch.end);
		if (!lunchStart || !lunchEnd) return null; // partial lunch -> incomplete
		lunchMs = Math.max(0, lunchEnd.getTime() - lunchStart.getTime());
	}

	const internalMs =
		typeof record.internalCompanyTime === 'number' ? Math.max(0, record.internalCompanyTime) : 0;

	const total = Math.max(0, leave.getTime() - meet.getTime() - lunchMs - internalMs);
	return total;
}

export function minutesBetween(a?: Date | null, b?: Date | null): number | null {
	const da = toDate(a);
	const db = toDate(b);
	if (!da || !db) return null;
	return Math.round((db.getTime() - da.getTime()) / 60000);
}

export type TimeCalc = {
	formatTimeHHMM: typeof formatTimeHHMM;
	formatDecimalHours: typeof formatDecimalHours;
	parseDecimalHoursToMs: typeof parseDecimalHoursToMs;
	computeWorkTime: typeof computeWorkTime;
};

export default {
	formatTimeHHMM,
	formatDecimalHours,
	parseDecimalHoursToMs,
	computeWorkTime
} as TimeCalc;
