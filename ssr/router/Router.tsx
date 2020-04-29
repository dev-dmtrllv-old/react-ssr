import React from "react";
import { joinPaths } from "utils";

export const RouterContext = React.createContext({ base: "/" });

export const Router: React.FC<RouterProps> = ({ base = "/", children }) =>
{
	const routerCtx = React.useContext(RouterContext);

	base = joinPaths(routerCtx.base, base);

	return (
		<RouterContext.Provider value={{ base }}>
			{children}
		</RouterContext.Provider>
	);
}

type RouterProps = {
	base?: string;
};