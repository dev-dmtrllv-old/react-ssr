import React from "react";
import { joinPaths } from "utils";
import { RouterContext, usePrivateRouter } from "./RouterContext";

export const Router: React.FC<RouterProps> = ({ base = "/", match = "all", timeout, onChange, children }) =>
{
	const { router, handler } = usePrivateRouter();
	base = joinPaths(router.base, base);
	React.useEffect(() =>
	{
		timeout && handler.setTimeout(timeout);
		onChange && handler.onChange(onChange);
		return () =>
		{
			timeout && handler.removeTimeout(timeout);
			onChange && handler.removeChangeListener(onChange);
		};
	}, [])

	return (
		<RouterContext.Provider value={{ ...router, base, matchType: match, matchedRoutes: 0 }}>
			{children}
		</RouterContext.Provider>
	);
}

type RouterProps = {
	base?: string;
	match?: "all" | "first";
	timeout?: number;
	onChange?: (from: string, to: string, isLoading: boolean) => void;
};