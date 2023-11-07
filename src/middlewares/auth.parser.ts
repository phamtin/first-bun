import { Elysia } from "elysia";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

import { Context, UserCheckParser } from "@/types/app.type";
import { AccountColl, TokenColl } from "../loaders/mongo";
import { JwtDecode } from "@/types/app.type";
import AppError from "@/pkgs/appError/Error";

const verifyToken = (token: string, secret: string) =>
	new Promise((resolve, reject) =>
		jwt.verify(token, secret, (err, decoded) => {
			if (err) return reject(err);
			return resolve(decoded);
		})
	);

export const tokenParser = (app: Elysia) =>
	app.derive(async ({ request, store, set, headers }) => {
		let token;
		const authorization = headers["authorization"];

		let user: UserCheckParser = { _id: "", email: "", firstname: "", lastname: "", fullname: "" };

		if (authorization?.startsWith("Bearer")) {
			token = authorization.split(" ")[1];
		}

		if (request.url.includes("/auth/signout")) {
			return;
		}
		if (request.url.includes("/auth/signin/google")) {
			return;
		}
		if (!token && !request.url.includes("/auth/signin/google") && !request.url.includes("/auth/signout")) {
			set.status = 401;
			throw new AppError("UNAUTHORIZED");
		}

		try {
			const decoded: JwtDecode = (await verifyToken(token!, Bun.env.JWT_SECRET)) as JwtDecode;

			const [storedToken, currentUser] = await Promise.all([
				TokenColl.findOne({ token }),
				AccountColl.findOne({
					_id: new ObjectId(decoded.accountId),
				}),
			]);

			if (!storedToken || !currentUser?._id) {
				set.status = 403;
				throw new AppError("FORBIDDEN");
			}
			user = {
				_id: decoded.accountId,
				email: currentUser.email,
				fullname: currentUser.fullname,
				firstname: currentUser.firstname,
				lastname: currentUser.lastname,
			};
		} catch (err: any) {
			console.log("Error tokenParser = ", err);

			(store as Context)["user"] = {
				_id: "",
				email: "",
				firstname: "",
				lastname: "",
				fullname: "",
			};

			if (err.message === "invalid token" || err.message === "jwt malformed" || err.message === "invalid signature") {
				throw new AppError("FORBIDDEN");
			}
			if (err.message === "jwt expired") {
				set.status = 401;
				throw new AppError("UNAUTHORIZED");
			}
		}

		(store as Context)["user"] = user;

		return;
	});
