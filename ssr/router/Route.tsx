import React from "react";
import { joinPaths } from "utils";
import { RouterContext, usePrivateRouter } from "./RouterContext";

export const Route: React.FC<RouteProps> = ({ path, exact = false, component, title, children }) =>
{
	const { handler, router } = usePrivateRouter();

	path = joinPaths(router.base, path);

	if (handler.match(path, exact))
	{
		if (router.matchType === "first" && router.matchedRoutes >= 1)
			return null;

		if (title)
			handler.setTitle(title);

		const params = handler.getParams(path, exact);
		children = component ? React.createElement(component) : children;
		router.matchedRoutes++;
		return (
			<RouterContext.Provider value={{ ...router, params, match: { exact, path } }}>
				{children}
			</RouterContext.Provider>
		);
	}

	return null;
};

type RouteProps = {
	path: string;
	exact?: boolean;
	component?: React.ComponentClass | React.FC;
	title?: string;
};