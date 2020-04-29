import React from "react";
import { RouterHandler } from "./RouterHandler";

type PublicRouterContext = {
	base: string;
	path: string;
	params: ObjectMap<any>;
	match?: {
		path: string;
		exact: boolean;
	};
};

type PrivateRouterContext = {
	matchType: "all" | "first";
	matchedRoutes: number;
};

export type RouterContextType = PublicRouterContext & PrivateRouterContext;

export const RouterContext = React.createContext<RouterContextType>({
	base: "/",
	path: "/",
	params: {},
	matchType: "all",
	matchedRoutes: 0
});

export const useRouterHandler = () => React.useContext(RouterHandler.context);
export const useRouter = (): PublicRouterContext => React.useContext(RouterContext);
export const usePrivateRouter = () => ({ router: React.useContext(RouterContext), handler: useRouterHandler() });