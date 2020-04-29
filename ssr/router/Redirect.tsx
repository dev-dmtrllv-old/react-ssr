import React from "react";
import { useRouter } from "./RouterContext";

export const Redirect: React.FC<RedirectProps> = ({ from, to, exact }) =>
{
	const { handler, match } = useRouter();

	if (match(from, exact))
		handler.redirect(from, to);
	return null;
}

export type RedirectProps = {
	from: string;
	to: string;
	exact?: boolean;
};