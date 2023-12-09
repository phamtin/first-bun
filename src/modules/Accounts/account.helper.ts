import { Undefined } from "@/types/common.type";
import { AccountSetting, ProfileInfo } from "./account.model";

export const getProfileInfoUpdate = (payload: Undefined<Partial<ProfileInfo>>): Undefined<Partial<ProfileInfo>> => {
	if (!payload) return undefined;

	const res: Partial<ProfileInfo> = {};

	if (payload.phoneNumber) {
		res.phoneNumber = payload.phoneNumber;
	}

	if (payload.locale) {
		res.locale = payload.locale;
	}

	if (payload.locale) {
		res.locale = payload.locale;
	}

	return res;
};

export const getAccountSettingUpdate = (payload: Undefined<Partial<AccountSetting>>): Undefined<Partial<AccountSetting>> => {
	if (!payload) return undefined;

	const res: Partial<AccountSetting> = {};

	if (payload.theme) {
		res.theme = payload.theme;
	}

	if (payload.isPrivateAccount) {
		res.isPrivateAccount = payload.isPrivateAccount;
	}

	return res;
};
