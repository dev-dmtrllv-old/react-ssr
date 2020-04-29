import React from "react";
import path from "path";
import { toURLQuery } from "utils";
import type { Response, Request } from "express";
import { Fetch, AsyncFC } from "./async";

export class Api
{
	public static readonly methodTypes = ["get", "post", "put", "delete"];

	private static readonly createClientMethod = (type: ApiMethods, path: string) =>
	{
		return async (props?: any) => 
		{
			console.log(props);
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

	public static createClientApi = <T extends ApiRoutes<any>>(apiRoutes: T): ClientApi<T> =>
	{
		const api: any = {};

		for (const k in apiRoutes)
		{
			const route: any = apiRoutes[k];
			if (route.path && route.type)
			{
				const clientApi: any = {
					path: route.path,
					get: () => { throw new Error(`GET method not found for ${route.path}!`) },
					post: () => { throw new Error(`POST method not found for ${route.path}!`) },
					put: () => { throw new Error(`PUT method not found for ${route.path}!`) },
					delete: () => { throw new Error(`DELETE method not found for ${route.path}!`) },

				};
				const _api = new route.type(null, null);
				for (const type in _api)
					if (_api[type] !== undefined && Api.methodTypes.includes(type))
					{
						clientApi[type] = Api.createClientMethod(type as any, route.path);
						clientApi[type].Component = ({ data, children, ...rest }: { data: any, children: any }) => <Fetch data={data} url={route.path} method={type as any} {...rest}>{children}</Fetch>;
					}
				api[k] = clientApi;
			}
			else
			{
				api[k] = Api.createClientApi(route);
			}
		}
		return api;
	}

	public static createRoutes = <T extends ApiGroup>(apiGroup: T, basePath: string = "/api"): ApiRoutes<T> =>
	{
		const routes: any = {};

		for (const apiPath in apiGroup)
		{
			const p: string = path.join(basePath, apiPath).replace(/\\/g, "/");
			const route: any = apiGroup[apiPath];
			if (route.prototype instanceof Api)
			{
				routes[apiPath] = { path: p, type: route };
			}
			else
			{
				routes[apiPath] = Api.createRoutes(route, p);
			}
		}
		return routes;
	}

	private req: Request;
	private res: Response;

	public constructor(req: Request, res: Response)
	{
		this.req = req;
		this.res = res;
	}

	public get?: (props?: any) => any;
	public post?: (props?: any) => any;
	public put?: (props?: any) => any;
	public delete?: (props?: any) => any;
}

export type ApiGroup = {
	[path: string]: ApiType<any> | ApiGroup;
};

export type ApiRoutes<T extends ApiGroup> = {
	[K in keyof T]: T[K] extends ApiType<infer A> ? ApiRoute<A>
	: T[K] extends ApiGroup ? ApiRoutes<T[K]>
	: never;
};

export type ApiRoute<T extends Api> = {
	path: string;
	type: ApiType<T>;
};

export type ApiMethods = "get" | "post" | "put" | "delete";

type ExtractMethods<T extends Api> = Omit<Pick<T, ApiMethods>, OptionalKeys<T>>;

export type ApiType<T extends Api> = new (req: Request, res: Response) => T;
export type ApiMethod<P = undefined, R = any> = (props: P) => R;

type ExtractPromise<T> = T extends Promise<infer P> ? P : T;

type FetchApiComponent<T extends Api, K extends keyof ExtractMethods<T>> = AsyncFC<T[K] extends ApiMethod<undefined, infer R> ? {
	children: (props: { data: ExtractPromise<R> | null, error: Error | null, isLoading: boolean }) => JSX.Element | null;
} : T[K] extends ApiMethod<infer P, infer R> ? {
	data: P;
	children: (props: { data: ExtractPromise<R> | null, error: Error | null, isLoading: boolean }) => JSX.Element | null;
} : {}>;

export type ClientRoute<T extends Api> = {
	[K in keyof ExtractMethods<T>]: ParseApiMethod<ExtractMethods<T>[K]> & {
		Component: FetchApiComponent<T, K>;
	}
} & { path: string };

type Promisify<T> = T extends Promise<any> ? T : Promise<T>;

type ParseApiMethod<T> = T extends ApiMethod<undefined, infer R> ? () => Promisify<R> : T extends ApiMethod<infer P, infer R> ? (props: P) => Promisify<R> : never;

export type ClientApi<T extends ApiRoutes<any>> = {
	[K in keyof T]: T[K] extends ApiRoute<infer A> ? ClientRoute<A>
	: T[K] extends ApiRoutes<any> ? ClientApi<T[K]>
	: never;
};