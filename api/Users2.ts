import { Api } from "ssr/Api"

type User = { name: string, age: number };

const users: User[] = [
	{ name: "henk 2", age: 14, },
];

export class Users2 extends Api
{
	post = (user: User) =>
	{
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