import type { Context } from "hono";
import type * as pv from "./pomodoro.validator";
import PomodoroRepo from "./pomodoro.repo";
import { PomodoroStatus, type PomodoroModel } from "@/shared/database/model/pomodoro/pomodoro.model";
import { AppError } from "@/shared/utils/error";
import { buildPayloadUpdate, buildPayloadCreate } from "./pomodoro.mapper";
import TaskSrv from "../Tasks/task.srv";
import { TaskStatus } from "@/shared/database/model/task/task.model";

const getPomodoros = async (ctx: Context, request: pv.GetPomodorosRequest): Promise<PomodoroModel[]> => {
	const pomodoros = await PomodoroRepo.findPomodoros(ctx, request);

	return pomodoros;
};

const createPomodoro = async (ctx: Context, request: pv.CreatePomodoroRequest): Promise<PomodoroModel> => {
	if (request.duration) {
		if (request.duration <= 0) {
			throw new AppError("BAD_REQUEST", "Duration must be from 1");
		}
	}
	if (request.taskId) {
		const task = await TaskSrv.findById(ctx, request.taskId);
		if (!task) throw new AppError("NOT_FOUND", "Task not found");

		if ([TaskStatus.Done, TaskStatus.Pending, TaskStatus.Archived].includes(task.status)) {
			throw new AppError("BAD_REQUEST", "Should create pomodoro for active task");
		}
	}

	const payload = buildPayloadCreate(ctx, request);

	const insertedId = await PomodoroRepo.createPomodoro(ctx, payload);

	if (!insertedId) throw new AppError("INTERNAL_SERVER_ERROR", "Fail to create pomodoro");

	return insertedId;
};

const updatePomodoro = async (ctx: Context, pomodoroId: string, request: pv.UpdatePomodoroRequest): Promise<PomodoroModel> => {
	const pomodoro = await PomodoroRepo.findById(ctx, pomodoroId);

	if (!pomodoro) throw new AppError("NOT_FOUND", "Pomodoro not found");

	if (request.status) {
		if ([PomodoroStatus.Completed, PomodoroStatus.Cancelled].includes(pomodoro.status)) {
			throw new AppError("BAD_REQUEST", "Invalid status");
		}
	}

	const toUpdate = buildPayloadUpdate(request);

	if (!toUpdate) throw new AppError("BAD_REQUEST");

	const updated = await PomodoroRepo.updatePomodoro(ctx, pomodoroId, toUpdate);

	if (!updated) throw new AppError("INTERNAL_SERVER_ERROR");

	return updated;
};

const PomodoroSrv = { getPomodoros, createPomodoro, updatePomodoro };

export default PomodoroSrv;
