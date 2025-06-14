import type { Context } from "hono";
import type * as pv from "./pomodoro.validator";
import PomodoroRepo from "./pomodoro.repo";
import { type PomodoroSession, PomodoroStatus, type PomodoroModel } from "@/shared/database/model/pomodoro/pomodoro.model";
import { AppError } from "@/shared/utils/error";
import { buildPayloadCreate } from "./pomodoro.mapper";
import TaskSrv from "../Tasks/task.srv";
import { TaskStatus } from "@/shared/database/model/task/task.model";
import { PomodoroColl } from "@/shared/loaders/mongo";
import dayjs from "dayjs";

const getPomodoros = async (ctx: Context, request: pv.GetPomodorosRequest): Promise<PomodoroModel[]> => {
	const pomodoros = await PomodoroRepo.findPomodoros(ctx, request);

	return pomodoros;
};

const createPomodoro = async (ctx: Context, request: pv.CreatePomodoroRequest): Promise<PomodoroModel> => {
	if (request.taskId) {
		const task = await TaskSrv.findById(ctx, { id: request.taskId });

		if (!task) throw new AppError("NOT_FOUND", "Task not found");

		if (task.status === TaskStatus.Archived) {
			throw new AppError("BAD_REQUEST", "Should create pomodoro for active task");
		}
	}

	const payload = buildPayloadCreate(ctx, request);

	const item = await PomodoroRepo.createPomodoro(ctx, payload);

	if (!item) throw new AppError("INTERNAL_SERVER_ERROR", "Fail to create pomodoro");

	return item;
};

const finishPomodoro = async (ctx: Context, pomodoro: PomodoroModel, request: pv.UpdatePomodoroRequest): Promise<PomodoroModel | null> => {
	const updated = await PomodoroColl.findOneAndUpdate(
		{
			_id: pomodoro._id,
		},
		[
			{
				$set: {
					pomodoroSessions: {
						$filter: {
							input: {
								$map: {
									input: "$pomodoroSessions",
									as: "session",
									in: {
										index: "$$session.index",
										durationType: "$$session.durationType",
										status: {
											$cond: {
												if: { $lte: ["$$session.index", request.sessionIndex] },
												then: PomodoroStatus.Completed,
												else: "$$session.status",
											},
										},
									},
								},
							},
							as: "sessionAfterMap",
							cond: { $lte: ["$$sessionAfterMap.index", request.sessionIndex] },
						},
					},
					updatedAt: dayjs().toDate(),
				},
			},
		],
		{ returnDocument: "after" },
	);

	return updated;
};

const completeSession = async (ctx: Context, pomodoro: PomodoroModel, request: pv.UpdatePomodoroRequest): Promise<PomodoroModel | null> => {
	const updated = await PomodoroColl.findOneAndUpdate(
		{
			_id: pomodoro._id,
		},
		[
			{
				$set: {
					pomodoroSessions: {
						$map: {
							input: "$pomodoroSessions",
							as: "session",
							in: {
								index: "$$session.index",
								durationType: "$$session.durationType",
								status: {
									$cond: {
										if: { $eq: ["$$session.index", request.sessionIndex] },
										then: PomodoroStatus.Completed,
										else: "$$session.status",
									},
								},
							},
						},
					},
					updatedAt: dayjs().toDate(),
				},
			},
		],
		{ returnDocument: "after" },
	);

	return updated;
};

const cancelPomodoro = async (ctx: Context, pomodoro: PomodoroModel, request: pv.UpdatePomodoroRequest): Promise<PomodoroModel | null> => {
	const updatedSessions: PomodoroSession[] = [];

	for (let i = 0; i < pomodoro.pomodoroSessions.length; i++) {
		const session = pomodoro.pomodoroSessions[i];
		updatedSessions.push({
			index: session.index,
			durationType: session.durationType,
			status: i >= request.sessionIndex ? PomodoroStatus.Cancelled : session.status,
		});
	}

	return PomodoroRepo.updatePomodoroSession(ctx, pomodoro._id.toHexString(), updatedSessions);
};

const pausePomodoro = async (ctx: Context, pomodoro: PomodoroModel, request: pv.UpdatePomodoroRequest): Promise<PomodoroModel | null> => {
	if (!request.pausedAt) throw new AppError("BAD_REQUEST", "Missing paused time");

	const updatedSessions: PomodoroSession[] = pomodoro.pomodoroSessions.map((session) => {
		if (session.index === request.sessionIndex) {
			return {
				index: session.index,
				durationType: session.durationType,
				status: PomodoroStatus.Paused,
				pausedAt: request.pausedAt,
			};
		}
		return session;
	});

	return PomodoroRepo.updatePomodoroSession(ctx, pomodoro._id.toHexString(), updatedSessions);
};

const updatePomodoro = async (ctx: Context, pomodoroId: string, request: pv.UpdatePomodoroRequest): Promise<PomodoroModel | null> => {
	const pomodoro = await PomodoroRepo.findById(ctx, pomodoroId);

	if (!pomodoro) throw new AppError("NOT_FOUND", "Pomodoro not found");

	const pomoSession = pomodoro.pomodoroSessions[request.sessionIndex];

	if (!pomoSession) throw new AppError("BAD_REQUEST", "Invalid pomo session");

	if (PomodoroStatus.Cancelled === pomoSession.status) {
		throw new AppError("BAD_REQUEST", "Invalid status");
	}

	if (request.taskId) {
		const task = await TaskSrv.findById(ctx, { id: request.taskId });

		if (!task) throw new AppError("NOT_FOUND", "Task not found");

		if (!task.assigneeInfo?.find((assignee) => assignee._id.toHexString() === ctx.get("user")._id)) {
			throw new AppError("BAD_REQUEST", "You're not assignee of this task");
		}
	}

	if (request.isFinished) {
		const updated = await finishPomodoro(ctx, pomodoro, request);
		if (!updated) throw new AppError("INTERNAL_SERVER_ERROR");
		return updated;
	}

	if (request.status === PomodoroStatus.Paused) {
		const updated = await pausePomodoro(ctx, pomodoro, request);
		if (!updated) throw new AppError("INTERNAL_SERVER_ERROR");
		return updated;
	}

	if (request.status === PomodoroStatus.Cancelled) {
		const updated = await cancelPomodoro(ctx, pomodoro, request);
		if (!updated) throw new AppError("INTERNAL_SERVER_ERROR");
		return updated;
	}

	if (request.status === PomodoroStatus.Completed) {
		const updated = await completeSession(ctx, pomodoro, request);
		if (!updated) throw new AppError("INTERNAL_SERVER_ERROR");
		return updated;
	}

	const updated = await PomodoroRepo.updatePomodoro(ctx, pomodoroId, request);

	if (!updated) throw new AppError("INTERNAL_SERVER_ERROR");

	return updated;
};

const PomodoroSrv = { getPomodoros, createPomodoro, updatePomodoro };

export default PomodoroSrv;
