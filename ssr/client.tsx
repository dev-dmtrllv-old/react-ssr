import React from "react";
import ReactDOM from "react-dom";
import io from "socket.io-client";

import { getSSRData } from "./SSRData";
import { AsyncHandler } from "./async/AsyncHandler";
import { AsyncProvider } from "./async/AsyncContext";
import { Async, Fetch } from "./async";
import { RouterHandler } from "./router/RouterHandler";
import { ApiRoutes, ClientApi, ApiMethods, Api } from "./Api";
import { toURLQuery } from "utils";

export class Client
{
	// transforms the api to use on the server
	public static readonly createServerApi = (routes: any, basePath: string = "/api") =>
	{
		const api: any = {};

		for (const k in routes)
		{
			const r: any = routes[k];
			if (r.path && r.type)
			{
				const a: any = {};
				const _api = new r.type(null, null);
				for (const type in _api)
					if (_api[type] !== undefined && Api.methodTypes.includes(type))
					{
						a[type] = () => {};
						a[type].Component = ({ data, children, ...rest }: { data: any, children: any }) => <Fetch data={data} url={r.path} method={type as ApiMethods} {...rest}>{children}</Fetch>;
					}
				api[k] = a;
			}
			else
				api[k] = Client.createServerApi(r);
		}

		return api;
	}

	// creates the xmlhttp requests to the server api routes
	private static readonly createApiMethod = (type: ApiMethods, path: string) =>
	{
		return async (props?: any) => 
		{
			path = ((type === "get") && (props !== undefined)) ? `${path}?${toURLQuery(props)}` : path;
			const res = await window.fetch(path, {
				body: type === "get" ? undefined : JSON.stringify(props),
				method: type.toUpperCase(),
				headers: type === "get" ? {} : {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
			});
			let response: any = await res.text();
			try
			{
				response = JSON.parse(response);
			} catch{ };
			return response;
		};
	}

	public static createApiRoutes(routes: any, basePath: string = "/api")
	{
		const api: any = {};

		for (const k in routes)
		{
			const r = routes[k];
			const path = basePath + "/" + k;
			if (Array.isArray(r))
			{
				const methods: any = {};
				r.forEach((m: ApiMethods) => 
				{
					methods[m] = env.isClient ? this.createApiMethod(m, path) : () => {};
					methods[m].Component = ({ data, children, ...rest }: { data: any, children: any }) => <Fetch data={data} url={path} method={m} {...rest}>{children}</Fetch>;
				});
				api[k] = methods;
			}
			else
				api[k] = this.createApiRoutes(r, path);
		}
		return api;
	}

	public static createApi<T extends ApiRoutes<any>>(): ClientApi<T>
	{
		const ssrData = getSSRData();
		return this.createApiRoutes(ssrData.api);
	}

	private static isLiveReloadListening = false;

	public static readonly startLiveReload = () =>
	{
		if (!Client.isLiveReloadListening)
			Client.isLiveReloadListening = true;

		let lastCompileTime: number | null = null;
		const socket = io(`http://${location.hostname}:3001`);

		socket.on("reload", (data: any) => 
		{
			if (!lastCompileTime)
				return lastCompileTime = data;

			if (lastCompileTime !== data)
				window.location.reload(true);
		});
	}

	public static readonly render = async (Component: React.FC | React.ComponentClass) =>
	{
		if (env.isServer)
			return;

		if (env.isDev)
			Client.startLiveReload();

		Async.registerApp(Component);

		const { async, appTitle } = getSSRData();

		const asyncHandler = AsyncHandler.get(async);
		const routerHandler = RouterHandler.get(appTitle);

		const app = (
			<routerHandler.Provider>
				<Component />
			</routerHandler.Provider>
		);

		await Async.prefetch(app);

		ReactDOM.hydrate(
			<AsyncProvider handler={asyncHandler}>
				{app}
			</AsyncProvider>, document.getElementById("root"));
	}
}