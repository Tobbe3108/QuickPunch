export type TimeRecord = {
	date: Date;
	Durations?: Duration[];
	lunchDuration?: Duration;
	internalCompanyTime?: number;
};

export type Duration = {
	start: Date;
	end?: Date;
};
