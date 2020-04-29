import React from "react";
import { getClassFromProps } from "utils/react";
import { useRouterHandler } from "./RouterContext";

export const Link: React.FC<LinkProps> = ({ to, exact = false, className, children, ...rest }) =>
{
	const handler = useRouterHandler();

	const onClick = (e: React.MouseEvent<HTMLAnchorElement>) =>
	{
		e.preventDefault();
		handler.routeTo(to);
		rest.onClick && rest.onClick(e);
	};

	const cn = getClassFromProps("link", {
		active: handler.match(to, exact),
		className
	});

	return (
		<a className={cn} href={to} onClick={onClick}>
			{children}
		</a>
	);
};

type LinkProps = {
	className?: string;
	to: string;
	exact?: boolean;
	onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};