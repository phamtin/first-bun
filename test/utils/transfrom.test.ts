import { toPayloadUpdate } from "@/utils/transfrom";
import { test, expect } from "bun:test";
import { ObjectId } from "mongodb";

test("Should throws error for null input", () => {
	expect(() => toPayloadUpdate(null as any)).toThrowError();
	expect(() => toPayloadUpdate(42 as any)).toThrowError();
	expect(() => toPayloadUpdate("string" as any)).toThrowError();
});

test("Should handles simple flat object", () => {
	const now = new Date();
	const input = {
		name: "John",
		age: 30,
		address: null,
		updatedAt: undefined,
		createdAt: now,
	};
	const expected = {
		name: "John",
		age: 30,
		address: null,
		updatedAt: undefined,
		createdAt: now,
	};
	expect(toPayloadUpdate(input)).toEqual(expected);
});

test("Should handles nested objects", () => {
	const input = {
		user: {
			name: "John",
			address: {
				city: "danang",
				zip: 55000,
				palaces: [],
				note: {
					food: null,
					drink: undefined,
				},
			},
		},
	};
	const expected = {
		"user.name": "John",
		"user.address.city": "danang",
		"user.address.zip": 55000,
		"user.address.palaces": [],
		"user.address.note.food": null,
		"user.address.note.drink": undefined,
	};
	expect(toPayloadUpdate(input)).toEqual(expected);
});

test("Should preserves ObjectId", () => {
	const objectId = new ObjectId();
	const input = { id: objectId };
	const result = toPayloadUpdate(input);
	expect(result.id).toBe(objectId);
	expect(result.id instanceof ObjectId).toBe(true);
});

test("Should preserves Date", () => {
	const date = new Date("2023-01-01");
	const input = { createdAt: date };
	const result = toPayloadUpdate(input);
	expect(result.createdAt).toBe(date);
	expect(result.createdAt instanceof Date).toBe(true);
});

test("Should preserves arrays", () => {
	const input = {
		tags: ["a", "b", null, undefined],
		nested: {
			scores: [1, 2, undefined],
		},
	};
	const expected = {
		tags: ["a", "b", null, undefined],
		"nested.scores": [1, 2, undefined],
	};
	expect(toPayloadUpdate(input)).toEqual(expected);
});

test("Should handles mixed content", () => {
	const objectId = new ObjectId();
	const date = new Date();
	const input = {
		id: objectId,
		user: {
			name: "John",
			created: date,
			tags: ["developer", null, "senior"],
			stats: {
				age: 30,
				active: true,
			},
		},
	};
	const expected = {
		id: objectId,
		"user.name": "John",
		"user.created": date,
		"user.tags": ["developer", null, "senior"],
		"user.stats.age": 30,
		"user.stats.active": true,
	};
	expect(toPayloadUpdate(input)).toEqual(expected);
});
