import React from "react";
import { AsyncContext, AsyncProvider } from "./AsyncContext";
import { AsyncHandler } from "./AsyncHandler";
import ReactDOMServer from "react-dom/server";
import { toBase64 } from "utils";

export class Async
{
	private static app: React.FC | React.ComponentClass;

	public static readonly registerApp = (app: React.FC | React.ComponentClass) =>
	{
		if (env.isClient && !Async.app)
			Async.app = app;
	}

	public static async prefetch(jsx: JSX.Element | null = null, handler: AsyncHandler = AsyncHandler.get(), shouldResolve: () => boolean = () => true): Promise<void>
	{
		if (!jsx && env.isClient && Async.app)
			jsx = <Async.app />;

		ReactDOMServer.renderToStaticMarkup(
			<AsyncProvider isPrefetching handler={handler}>
				{jsx}
			</AsyncProvider>
		);
		if (handler.shouldResolve && shouldResolve())
		{
			await handler.resolveAll();
			await Async.prefetch(jsx, handler);
		}
	};

	public static readonly Component = <T extends any>(props: AsyncProps<T>) =>
	{
		const ctx = React.useContext(AsyncContext);

		const ID = props.name + toBase64(props.id);

		const getData = (id: string) =>
		{
			let asyncData = ctx.handler.get(id);
			if (env.isClient)
			{
				
				if (asyncData && asyncData.cache && (typeof asyncData.cache === "number"))
				{
					if (asyncData.cache < new Date().getTime())
					{
						ctx.handler.remove(ID);
						asyncData = null;
					}
				}
			}
			return asyncData;
		}

		const [data, setData] = React.useState(getData(ID));
		const [id, setId] = React.useState(ID);

		React.useEffect(() => 
		{
			let _data = data;

			const newId = props.name + toBase64(props.id);
			if (newId !== id)
			{
				_data = getData(newId);
				if (!_data)
					setData({ data: null, error: null, cache: false, cacheVal: false });
				else
					setData(_data);
				setId(newId);
			}

			if (!_data)
			{
				ctx.handler.resolve(props.resolve, props.cache === undefined ? true : props.cache).then(_data => 
				{
					ctx.handler.set(newId, _data);
					setData(_data);
				});
			}
		}, [props.id]);

		if (!data)
		{
			if (ctx.isPrefetching && (props.prefetch !== false))
				ctx.handler.prefetch(id, props.resolve, props.cache || true);
			return props.children({ data: null, error: null, isLoading: true }) || <></>;
		}

		if (data.error)
			console.error(data.error);

		return props.children({ ...data, isLoading: !data.data && !data.error }) || <></>;
	};
}

type AsyncProps<T> = {
	name: string;
	id: string;
	resolve: AsyncResolver<T>;
	prefetch?: boolean;
	children: AsyncRender<T>;
	cache?: boolean | number;
};

export type AsyncRender<T> = (props: { data: T | null, error: Error | null, isLoading: boolean }) => JSX.Element | null;

export type AsyncResolver<T> = () => Promise<T>;

export type AsyncFC<P> = React.FC<P & { prefetch?: boolean, cache?: number | boolean; }>;