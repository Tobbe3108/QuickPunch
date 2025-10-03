export type TimeRecord = {
	date: Date;
	Durations?: Duration[];
	lunchDuration?: Duration;
	internalCompanyTime?: Date;
};

export type Duration = {
	start: Date;
	end?: Date;
};
