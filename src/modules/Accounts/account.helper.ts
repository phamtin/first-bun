import type { Undefined } from "@/types/common.type";
import type { UpdateProfileRequest } from "./account.validator";
import type { AccountModel, AccountSettings, ProfileInfo } from "../../database/model/account/account.model";

export const mergeProfileInfoWithDb = (model: AccountModel, request: UpdateProfileRequest["profileInfo"]): Undefined<ProfileInfo> => {
	let res: Undefined<ProfileInfo> = undefined;

	if (!request) return res;

	res = {
		phoneNumber: model.profileInfo.phoneNumber,
		birthday: model.profileInfo.birthday as Date,
		locale: model.profileInfo.locale,
		avatar: model.profileInfo.avatar,
		email: model.profileInfo.email,
		fullname: model.profileInfo.fullname,
		firstname: model.profileInfo.firstname,
		lastname: model.profileInfo.lastname,
	} satisfies ProfileInfo;

	const { phoneNumber, birthday } = request;

	if (phoneNumber) {
		res.phoneNumber = phoneNumber;
	}
	if (birthday) {
		res.birthday = new Date(birthday);
	}

	return res;
};

export const mergeAccountSettingWithDb = (model: AccountModel, request: UpdateProfileRequest["accountSettings"]): Undefined<AccountSettings> => {
	let res: Undefined<AccountSettings> = undefined;

	if (!request) return res;

	res = {
		theme: model.accountSettings.theme,
		isPrivateAccount: model.accountSettings.isPrivateAccount,
	};
	const { theme, isPrivateAccount } = request;

	if (theme) {
		res.theme = theme;
	}
	if (isPrivateAccount) {
		res.isPrivateAccount = isPrivateAccount;
	}

	return res;
};
