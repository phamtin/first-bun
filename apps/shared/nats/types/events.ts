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

export { NatsEvent, type NatsEventSubject };
