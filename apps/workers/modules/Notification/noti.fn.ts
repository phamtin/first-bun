import type { JsMsg } from "nats";
import type { PublishMessage } from "@/api/init-nats";
import NotificationSrv from "@/api/modules/Notification";
import { InviteJoinFolderPayloadStatus } from "@/shared/database/model/notification/notification.model";
import type { EventPayload, NatsEvent } from "@/shared/nats/types/events";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { Context } from "@/shared/types/app.type";
import dayjs from "@/shared/utils/dayjs";

const handleNotificationExpiration = async (jsMsg: JsMsg, msg: PublishMessage) => {
	const ctx: Context = msg.ctx;
	const { notiIds, expiredAt }: EventPayload<typeof NatsEvent.Notifications.Expired> = msg.data;

	const now = dayjs();

	const diffTimeInMs = dayjs(expiredAt).diff(now, "millisecond");

	if (diffTimeInMs > 0 && now.isBefore(expiredAt)) {
		jsMsg.nak(diffTimeInMs);
		return;
	}

	await NotificationSrv.updateNotifications(ctx, {
		filter: {
			_id: {
				$in: notiIds.map((id) => toObjectId(id)),
			},
		},
		payload: {
			payload: { status: InviteJoinFolderPayloadStatus.Expired },
		},
	});
};

export const NotificationFn = { handleNotificationExpiration };
