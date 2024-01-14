import { StringId, Undefined } from "@/types/common.type";
import { AccountModel, AccountSetting, ProfileInfo } from "./account.model";
import { UpdateProfileRequest } from "./account.validator";

export const mergeProfileInfoWithDb = (model: StringId<AccountModel>, request: UpdateProfileRequest["profileInfo"]): Undefined<ProfileInfo> => {
	let res: Undefined<ProfileInfo> = undefined;

	if (!request) return res;

	res = {
		phoneNumber: model.profileInfo.phoneNumber,
		birthday: model.profileInfo.birthday as Date,
		locale: model.profileInfo.locale,
		tags: model.profileInfo.tags,
	};
	const { phoneNumber, birthday, tags } = request;

	if (phoneNumber) {
		res.phoneNumber = phoneNumber as string[];
	}
	if (birthday) {
		res.birthday = new Date(birthday);
	}
	if (tags) {
		res.tags = tags;
	}

	return res;
};

export const mergeAccountSettingWithDb = (model: StringId<AccountModel>, request: UpdateProfileRequest["accountSetting"]): Undefined<AccountSetting> => {
	let res: Undefined<AccountSetting> = undefined;

	if (!request) return res;

	res = {
		theme: model.accountSetting.theme,
		isPrivateAccount: model.accountSetting.isPrivateAccount,
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
