import type { FolderModel } from "@/shared/database/model/folder/folder.model";
import type { TaskModel } from "@/shared/database/model/task/task.model";
import type { NotificationModel, NotificationType } from "@/shared/database/model/notification/notification.model";
import type { AccountModel } from "@/shared/database/model/account/account.model";
import type { PomodoroModel } from "@/shared/database/model/pomodoro/pomodoro.model";
import type { WithdrawInvitationRequest } from "@/api/modules/Folder/folder.validator";
import type { UpdateTaskRequest } from "@/api/modules/Tasks/task.validator";

const NatsEvent = {
	SyncModel: "events.sync_model",

	Auth: {
		LoginWithGoogle: "events.auth.login_with_google",
		LoginWithApple: "events.auth.login_with_apple",
		Logout: "events.auth.logout",
	},
	Accounts: {
		Created: "events.accounts.created",
		Updated: "events.accounts.updated",
		Deleted: "events.accounts.deleted",
	},
	Folders: {
		Created: "events.folders.created",
		Updated: "events.folders.updated",
		Deleted: "events.folders.deleted",
		Invited: "events.folders.invited",
		WithdrawInvitation: "events.folders.withdraw_invitation",
	},
	Tasks: {
		Created: "events.tasks.created",
		Updated: "events.tasks.updated",
		Deleted: "events.tasks.deleted",
	},
	Notifications: {
		Created: "events.notifications.created",
		Updated: "events.notifications.updated",
		Deleted: "events.notifications.deleted",
	},
	Pomodoros: {
		Created: "events.pomodoros.created",
		Updated: "events.pomodoros.updated",
		Deleted: "events.pomodoros.deleted",
	},
} as const;

type ExtractValues<T> = T extends string ? T : T extends Record<string, unknown> ? { [K in keyof T]: ExtractValues<T[K]> }[keyof T] : never;

type NatsEventSubject = ExtractValues<typeof NatsEvent>;

interface SyncModelPayload {
	model: "accounts" | "folders" | "tasks";
	payload: AccountModel | FolderModel | TaskModel;
}

interface NatsEventPayloadMap {
	[NatsEvent.SyncModel]: SyncModelPayload;

	[NatsEvent.Auth.LoginWithGoogle]: unknown;
	[NatsEvent.Auth.LoginWithApple]: unknown;
	[NatsEvent.Auth.Logout]: unknown;

	[NatsEvent.Accounts.Created]: AccountModel;
	[NatsEvent.Accounts.Updated]: AccountModel;
	[NatsEvent.Accounts.Deleted]: AccountModel;

	[NatsEvent.Folders.Created]: FolderModel;
	[NatsEvent.Folders.Updated]: FolderModel;
	[NatsEvent.Folders.Deleted]: FolderModel;
	[NatsEvent.Folders.Invited]: FolderModel;
	[NatsEvent.Folders.WithdrawInvitation]: { folder: FolderModel; request: WithdrawInvitationRequest };

	[NatsEvent.Tasks.Created]: TaskModel;
	[NatsEvent.Tasks.Updated]: { task: TaskModel; request: UpdateTaskRequest };
	[NatsEvent.Tasks.Deleted]: TaskModel;

	[NatsEvent.Notifications.Created]: NotificationModel<NotificationType>;
	[NatsEvent.Notifications.Updated]: NotificationModel<NotificationType>;
	[NatsEvent.Notifications.Deleted]: NotificationModel<NotificationType>;

	[NatsEvent.Pomodoros.Created]: PomodoroModel;
	[NatsEvent.Pomodoros.Updated]: PomodoroModel;
	[NatsEvent.Pomodoros.Deleted]: PomodoroModel;
}

type EventPayload<T extends NatsEventSubject> = NatsEventPayloadMap[T];

export { NatsEvent, type NatsEventSubject, type NatsEventPayloadMap, type EventPayload };
