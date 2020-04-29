import React from "react";
import { joinPaths } from "utils";
import { useRouterHandler, useRouter } from "./RouterContext";

export const Redirect: React.FC<RedirectProps> = ({ from, to, exact }) =>
{
	const handler = useRouterHandler();
	const { base } = useRouter();
	
	const path = joinPaths(base, to);
	if (handler.match(from, exact))
		handler.redirectTo(path);

	return null;
}

type RedirectProps = {
	from: string;
	to: string;
	exact?: boolean;
};