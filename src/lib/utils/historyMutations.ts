import type { Keyed } from '$lib/utils/KeyValueService';
import type { Duration, TimeRecord } from '$lib/models/TimeRecord';

export function updateSingleDuration(
	record: Keyed<TimeRecord>,
	index: number | null,
	startStr?: string,
	endStr?: string
): boolean {
	if (index === null) return false;
	const durations = record.Durations ?? [];
	if (!durations[index]) return false;
	const start = toDateForDay(record.date, startStr);
	if (!start) return false;
	const end = toDateForDay(record.date, endStr);
	durations[index] = { start, end };
	record.Durations = durations;
	return true;
}

export function replaceDurations(
	record: Keyed<TimeRecord>,
	durations: Array<{ startStr: string; endStr: string }>
): boolean {
	const updated = durations
		.map((duration, idx) => {
			const start = toDateForDay(record.date, duration.startStr);
			if (!start) return null;
			const previous = record.Durations?.[idx];
			const end = toDateForDay(record.date, duration.endStr) ?? previous?.end;
			return { start, end } as Duration;
		})
		.filter(Boolean) as Duration[];

	record.Durations = updated;
	return true;
}

export function updateLunch(
	record: Keyed<TimeRecord>,
	startStr?: string,
	endStr?: string
): boolean {
	const start = toDateForDay(record.date, startStr) ?? record.lunchDuration?.start;
	if (!start) return false;
	record.lunchDuration = {
		start,
		end: toDateForDay(record.date, endStr)
	};
	return true;
}

export function updateInternal(record: Keyed<TimeRecord>, raw?: string): boolean {
	record.internalCompanyTime = normaliseHours(raw);
	return true;
}

function toDateForDay(day: Date, timeStr?: string) {
	if (!timeStr) return undefined;
	const [hours, minutes] = timeStr.split(':').map(Number);
	if (Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;
	return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
}

function normaliseHours(input?: string) {
	if (!input) return 0;
	const value = parseFloat(input.replace(',', '.'));
	if (Number.isNaN(value)) return 0;
	return Math.max(0, Math.round(value * 3600000));
}
