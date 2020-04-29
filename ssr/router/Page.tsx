import React from "react";
import { joinPaths } from "utils";
import { Dynamic } from "ssr/async";
import { toCamelCase } from "utils/string";

import { useRouterHandler, useRouter } from "./RouterContext";
import { Route } from "./Route";

export const Page: React.FC<PageProps> = ({ path, exact = false, page, onError, title, ...rest }) =>
{
	const handler = useRouterHandler();
	const { base } = useRouter();

	path = joinPaths(base, path);
	page = page || path.split("/").map(p => toCamelCase(p, true)).join("/");

	if (page.startsWith("/"))
		page = page.substr(1, page.length - 1);

	if (handler.match(path, exact))
	{
		return (
			<Route exact={exact} path={path} title={title}>
				<Dynamic import={() => import(`../../app/pages/${page}`)} path={`./${page}`} {...rest}>
					{({ Component, error, isLoading }) => 
					{
						if (error && onError)
						{
							const errorComponent = onError(error);
							if (errorComponent)
								return <>{errorComponent}</>
						}
						
						if (Component)
							return (<Component />);

						return null;
					}}
				</Dynamic>
			</Route>
		);
	}

	return null;
};

type PageProps = {
	path: string;
	exact?: boolean;
	page?: string;
	onError?: (err: Error) => JSX.Element | string | null | undefined | void;
	title?: string;
	prefetch?: boolean;
};