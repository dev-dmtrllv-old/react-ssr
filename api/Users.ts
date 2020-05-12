import { Api } from "ssr/Api"

type User = { name: string, age: number };

const users: User[] = [
	{ name: "henk", age: 123, },
	{ name: "piet", age: 123, },
	{ name: "klaas", age: 123, },
	{ name: "klaas", age: 123, }
];

export class Users extends Api
{
	post = (user: User) =>
	{
		console.log("TEST!@#")
		const i = users.push(user) - 1;
		return {
			success: i > -1,
			id: i
		};
	}

	get = () =>
	{
		return { users };
	}
}