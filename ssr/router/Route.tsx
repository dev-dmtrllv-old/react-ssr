import React from "react";
import { useRouter } from "./RouterContext";

export const Route: React.FC<RouteProps> = ({ path, exact, children }) =>
{
	const { match } = useRouter();

	if(match(path, exact))
		return <>{children}</>;
	return null;
}

type RouteProps = {
	exact?: boolean;
	path: string;
};