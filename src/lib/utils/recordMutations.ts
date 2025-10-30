import type { Keyed } from '$lib/utils/KeyValueService';
import type { TimeRecord } from '$lib/models/TimeRecord';
import { idb } from '$lib/utils/KeyValueService';

/**
 * Load a record by key, apply mutate function, persist if mutate returns truthy.
 * Returns the updated record or undefined.
 */
export async function updateRecord(
	key: string,
	mutate: (record: Keyed<TimeRecord>) => boolean | void
): Promise<Keyed<TimeRecord> | undefined> {
	const record = await idb.get<TimeRecord>(key);
	if (!record) return undefined;
	const shouldPersist = mutate(record);
	if (shouldPersist === false) return undefined;
	await idb.set(record);
	return record;
}

export default updateRecord;
