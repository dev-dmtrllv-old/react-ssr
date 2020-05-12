import React from "react";
import { useRouter } from "./RouterContext";

export const Route: React.FC<RouteProps> = ({ path, exact, title, children }) =>
{
	const { match, handler } = useRouter();

	if (match(path, exact))
	{
		if (title)
			handler.setTitle(title);
		return <>{children}</>;
	}
	return null;
}

type RouteProps = {
	exact?: boolean;
	path: string;
	title?: string;
};