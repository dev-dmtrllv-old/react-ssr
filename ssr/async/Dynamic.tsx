import React from "react";
import { Async, AsyncFC } from "./Async";
import { AsyncData } from "./AsyncHandler";
import { fromBase64 } from "utils";

const NAME = "dynamic";

export const getDynamicPaths = (asyncData: AsyncData) =>
{
	const paths: string[] = [];
	for (const id in asyncData)
	{
		if (id.startsWith(NAME))
		{
			const path = fromBase64(id.substr(NAME.length, id.length - NAME.length));
			if(!paths.includes(path))
				paths.push(path);
		}
	}
	return paths;
};

export const removeDynamicData = (asyncData: AsyncData) =>
{
	for (const id in asyncData)
		if (id.startsWith(NAME))
			delete asyncData[id];
	return asyncData;
}

export const Dynamic: AsyncFC<DynamicProps> = (props) => (
	<Async.Component id={props.path} name={NAME} prefetch={props.prefetch} resolve={async () => 
	{
		const module = await props.import();
		if(module.default)
			return module.default;
		throw new Error(`no default exported for ${props.path}`);
	}}>
		{({ data, error, isLoading }) => 
		{
			if(props.children)
				return props.children({ Component: data, error, isLoading });
			else if(data)
				return React.createElement(data);
			return null;
		}}
	</Async.Component>
);

type DynamicProps = {
	import: () => Promise<any>;
	path: string;
	children?: (props: DynamicRenderProps) => JSX.Element | null;
	prefetch?: boolean;
};

type DynamicRenderProps = {
	Component: React.FC | React.ComponentClass;
	error: Error | null;
	isLoading: boolean;
};