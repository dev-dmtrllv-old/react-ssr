import React from "react";
import { toSnakeCase } from "./string";

export const getClassFromProps = (name: string, { className, ...props }: ObjectMap<string | boolean | undefined | null> = {}): string =>
{
	name = className ? className + " " + name : name;
	for (let prop in props)
	{
		const p = props[prop];
		if (typeof p === "boolean" && p === true)
			name += ` ${toSnakeCase(prop)}`;
		else if (typeof p === "string")
			name += ` ${toSnakeCase(prop)}-${toSnakeCase(p)}`;
	}
	return name;
};

export const deepForEach = (children: React.ReactNode, cb: (child: React.ReactNode & JSX.Element, i?: number) => void) =>
{
	return React.Children.map(children, (child: React.ReactNode) =>
	{
		if (!React.isValidElement(child))
			return child;

		const _children = child.props && (child.props as any).children

		if (_children)
			deepForEach(_children, cb);

		return cb(child);
	});
};

export const deepMap = (children: React.ReactNode, cb: (child: React.ReactNode & JSX.Element, i?: number) => React.ReactNode) =>
{
	return React.Children.map(children, (child: any) =>
	{
		if (!React.isValidElement(child))
			return child;

		const _children = (child.props as any).children;

		if (_children)
		{
			const props = { children: deepMap(_children, cb) };
			child = React.cloneElement(child, props);
		}

		return cb(child);
	});
}

export const filter = <T extends React.ReactNode = React.ReactNode>(children: React.ReactNode, cb: (child: React.ReactNode, i?: number) => boolean): T[] =>
{
	const filtered: T[] = [];

	React.Children.forEach(children, (child: any, index: number) =>
	{
		if (cb(child, index) === true)
			filtered.push(child);
	});

	return filtered;
}

export const filterType = <T extends React.ComponentClass>(children: React.ReactNode, type: T): InstanceType<T>[] =>
{
	return filter(children, (c: any) =>
	{
		return c.type === type;
	});
}

export const jsx = Object.seal(Object.freeze({
	map: <T extends any>(items: T[], fn: (item: T, key: number) => JSX.Element): JSX.Element => (
		<>
			{items.map(fn)}
		</>
	),
}));