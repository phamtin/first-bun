export type JwtDecode = {
	accountId: string;
	iat: number;
	exp: number;
};

export type UserCheckParser = {
	_id: string;
	email: string;
	fullname: string;
	firstname: string;
	lastname: string;
};

export type Context = Record<"user", UserCheckParser>;
