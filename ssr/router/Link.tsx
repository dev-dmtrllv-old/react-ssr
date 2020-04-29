import React from "react";
import { useRouter } from "./RouterContext";

export const Link: React.FC<LinkProps> = ({ to, exact, children }) =>
{
	const { match, routeTo, withBase } = useRouter();

	const onClick = (e: React.MouseEvent) =>
	{
		e.preventDefault();
		if (!match(to, exact))
			routeTo(withBase(to));
	}

	const isActive = match(to, exact);

	return (
		<a href={to} onClick={onClick} className={isActive ? "active" : ""}>
			{children}
		</a>
	);
}

type LinkProps = {
	to: string;
	exact?: boolean;
};