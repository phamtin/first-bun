import { Context } from "@/types/app.type";

const getProfile = (ctx: Context, request: any) => {};

const getMyTasks = (ctx: Context, request: any) => {};

const updateProfile = (ctx: Context, request: any) => {};

const AccountSrv = {
	getMyTasks,
	getProfile,
	updateProfile,
};

export default AccountSrv;
