import React from "react";
import { RouterContext } from "./Router";
import { RouterHandler } from "./RouterHandler";
import { joinPaths } from "utils";

export const useRouter = (base: string = "/") =>
{
	const routerContext = React.useContext(RouterContext);
	const { path, handler } = React.useContext(RouterHandler.Context);

	return {
		match: (path: string, exact?: boolean) => handler.match(joinPaths(routerContext.base, base, path), exact),
		path,
		withBase: (path: string) => joinPaths(routerContext.base, base, path),
		routeTo: handler.routeTo,
		handler
	};
}