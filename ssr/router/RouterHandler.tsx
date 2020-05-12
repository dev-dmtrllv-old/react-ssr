import React from "react";
import { Async } from "ssr/async";
import { AsyncHandler } from "ssr/async/AsyncHandler";

export class RouterHandler
{
	private static clientInstance: RouterHandler;

	public static readonly get = (title: string, path: string = env.isClient ? window.location.pathname : "/") =>
	{
		if (env.isServer)
			return new RouterHandler(title, path);
		if (!RouterHandler.clientInstance)
			RouterHandler.clientInstance = new RouterHandler(title, path);
		return RouterHandler.clientInstance;
	}

	public static readonly Context = React.createContext({ path: "/", handler: new RouterHandler("", "/", false) });

	private _redirected: false | { from: string, to: string } = false;

	public get redirected() { return this._redirected; }

	public redirect = (from: string, to: string) =>
	{
		this._redirected = { from, to };
	}

	public setTitle = (...titles: string[]) =>
	{
		const t = titles.length > 0 ? `${titles.join(" - ")} - ${this.appTitle}` : this.appTitle;
		if (t !== this._title)
		{
			this._title = t;
			if (env.isClient && !this.isPrefetching)
				document.title = t;
		}
	}

	private _title: string;

	public get title() { return this._title; }

	private readonly isPrefetching: boolean = false;
	public readonly appTitle: string;

	public path: string;

	public constructor(title: string, path: string, isPrefetching: boolean = false)
	{
		this.appTitle = title;
		this.setTitle();
		this.path = path;
		this.isPrefetching = isPrefetching;
	}

	private updatePath = (path: string) => { this.path = path; };

	public Provider: React.FC = ({ children }) =>
	{
		const [path, setPath] = React.useState(this.path);

		React.useEffect(() =>
		{
			this.updatePath = (path: string) => 
			{
				this.path = path;
				setPath(path);
			}
		});

		return (
			<RouterHandler.Context.Provider value={{ path, handler: this }}>
				{children}
			</RouterHandler.Context.Provider>
		);
	}

	public readonly routeTo = async (path: string): Promise<void> =>
	{
		if (!env.isClient)
			return;

		if (path !== this.path)
		{
			const handler = new RouterHandler(this.appTitle, path, true);

			await Async.prefetch(
				<handler.Provider>
					{Async["app"]}
				</handler.Provider>
				, AsyncHandler.get(), () => 
			{
				if (handler.redirected)
					return false;
				return true;
			});

			if (handler.redirected)
				return this.routeTo(handler.redirected.to);

			this.updatePath(path);
		}
	}

	public readonly match = (path: string, exact: boolean = false, matchPath: string = this.path) =>
	{
		if (path === "*")
			return true;

		const p1 = path.split("/");
		const p2 = matchPath.split("/");

		if (exact && (p1.length !== p2.length))
			return false;

		for (let i = 0; i < p1.length; i++)
		{
			const p = p1[i];
			const check = p2[i];
			if (!p.startsWith(":") && (p !== check))
				return false;
		}

		return true;
	}

	public readonly getParams = (path: string, exact: boolean = false, matchPath: string = this.path) =>
	{
		if (path === "*")
			return {};

		const params: ObjectMap<string> = {};

		const p1 = path.split("/");
		const p2 = matchPath.split("/");

		if (exact && (p1.length !== p2.length))
			return params;

		for (let i = 0; i < p1.length; i++)
		{
			const p = p1[i];
			const check = p2[i];
			if (p.startsWith(":"))
				params[p.substr(1, p.length - 1)] = check;
		}
		return params;
	}
}

export const StaticRouterContext = React.createContext({ path: env.isClient ? window.location.pathname : "/" });

export const StaticRouter: React.FC<{ path: string }> = ({ children, path }) =>
{
	return (
		<StaticRouterContext.Provider value={{ path }}>
			{children}
		</StaticRouterContext.Provider>
	);
}