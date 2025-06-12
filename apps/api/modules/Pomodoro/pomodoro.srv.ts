import type { Context } from "hono";
import type * as pv from "./pomodoro.validator";
import PomodoroRepo from "./pomodoro.repo";
import { PomodoroStatus, type PomodoroModel } from "@/shared/database/model/pomodoro/pomodoro.model";
import { AppError } from "@/shared/utils/error";
import { buildPayloadCreate } from "./pomodoro.mapper";
import TaskSrv from "../Tasks/task.srv";
import { TaskStatus } from "@/shared/database/model/task/task.model";

const getPomodoros = async (ctx: Context, request: pv.GetPomodorosRequest): Promise<PomodoroModel[]> => {
	const pomodoros = await PomodoroRepo.findPomodoros(ctx, request);

	return pomodoros;
};

const createPomodoro = async (ctx: Context, request: pv.CreatePomodoroRequest): Promise<PomodoroModel> => {
	if (request.taskId) {
		const task = await TaskSrv.findById(ctx, { id: request.taskId });

		if (!task) throw new AppError("NOT_FOUND", "Task not found");

		if ([TaskStatus.Done, TaskStatus.Pending, TaskStatus.Archived].includes(task.status)) {
			throw new AppError("BAD_REQUEST", "Should create pomodoro for active task");
		}
	}

	const payload = buildPayloadCreate(ctx, request);

	const item = await PomodoroRepo.createPomodoro(ctx, payload);

	if (!item) throw new AppError("INTERNAL_SERVER_ERROR", "Fail to create pomodoro");

	return item;
};

const updatePomodoro = async (ctx: Context, pomodoroId: string, request: pv.UpdatePomodoroRequest): Promise<PomodoroModel | null> => {
	const pomodoro = await PomodoroRepo.findById(ctx, pomodoroId);

	if (!pomodoro) throw new AppError("NOT_FOUND", "Pomodoro not found");

	if (request.status) {
		const sessionIndex = pomodoro.pomodoroSessions[request.sessionIndex];

		if (!sessionIndex) throw new AppError("BAD_REQUEST", "Invalid session index");

		if (PomodoroStatus.Completed === sessionIndex.status || PomodoroStatus.Cancelled === sessionIndex.status) {
			throw new AppError("BAD_REQUEST", "Invalid status");
		}

		if (request.status === PomodoroStatus.Paused) {
			if (!request.pausedAt) throw new AppError("BAD_REQUEST", "Missing pausedAt");
		}

		if (request.status === PomodoroStatus.Cancelled) {
			const payload = [];

			for (let i = request.sessionIndex; i < pomodoro.pomodoroSessions.length; i++) {
				payload.push({
					sessionIndex: i,
					status: request.status,
				});
			}
			const updated = await PomodoroRepo.updatePomodoroSession(ctx, pomodoroId, payload);

			if (!updated) throw new AppError("INTERNAL_SERVER_ERROR");

			return updated;
		}
	}

	const updated = await PomodoroRepo.updatePomodoroSession(ctx, pomodoroId, [request]);

	if (!updated) throw new AppError("INTERNAL_SERVER_ERROR");

	return updated;
};

const PomodoroSrv = { getPomodoros, createPomodoro, updatePomodoro };

export default PomodoroSrv;
