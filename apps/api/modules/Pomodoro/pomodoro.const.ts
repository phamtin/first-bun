import { DurationType } from "@/shared/database/model/pomodoro/pomodoro.model";

export const DEFAULT_DURATION = {
	[DurationType.Work]: 25,
	[DurationType.Break]: 5,
};
