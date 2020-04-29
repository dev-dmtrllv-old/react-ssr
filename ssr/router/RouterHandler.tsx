import React from "react";
import { RouterContext } from "./RouterContext";
import { Async } from "ssr/async";
import { AsyncHandler } from "ssr/async/AsyncHandler";

export class RouterHandler
{
	// #region static fields
	public static readonly context = React.createContext<RouterHandler>(RouterHandler.get());

	public static readonly Provider: React.FC<{ handler?: RouterHandler }> = ({ handler = RouterHandler.get(), children }) =>
	{
		const [path, setPath] = React.useState(handler.path);

		React.useEffect(() => { handler.setRouterPath = setPath; }, []);

		return (
			<RouterHandler.context.Provider value={handler}>
				<RouterContext.Provider value={{ path, base: "/", params: {}, matchType: "all", matchedRoutes: 0 }}>
					{children}
				</RouterContext.Provider>
			</RouterHandler.context.Provider>
		);
	};

	public readonly hydrate = (props: { appTitle: string; }) =>
	{
		Object.assign(this, props);
	}

	private static _instance: RouterHandler | null = null;

	public static get(): RouterHandler
	{
		if (env.isClient)
		{
			if (!this._instance)
				this._instance = new RouterHandler();
			return this._instance;
		}
		return new RouterHandler();
	}
	// #endregion

	// #region path fields
	private startPath?: string;

	private _path: string;

	public get path() { return this._path; };

	private _redirected: { from: string; to: string; } | false = false;

	public get redirected()
	{
		if (this._redirected)
			return { ...this._redirected };
		return false;
	}

	public setRouterPath?: (path: string) => void;
	// #endregion

	// #region title fields
	private readonly appTitle: string = "";

	private _title: string = "";

	public readonly setTitle = (...parts: string[]): string =>
	{
		const newParts: string[] = [];
		parts = [...parts, this.appTitle];
		parts.forEach(p => p && newParts.push(p));
		const t = newParts.join(" - ");
		if (t !== this._title)
		{
			if (env.isClient && !this.isPrefetching)
				document.title = t;
			this._title = t;
		}
		return t;
	}

	public get title() { return this._title; }
	// #endregion

	private timeout: NodeJS.Timeout | null = null;
	private timeouts: number[] = [];

	private clearTimeout = () =>
	{
		if (this.timeout)
			clearTimeout(this.timeout);
	}

	public readonly setTimeout = (ms: number) => { if (!this.timeouts.includes(ms)) this.timeouts.push(ms); };
	public readonly removeTimeout = (ms: number) => { if (this.timeouts.includes(ms)) this.timeouts.splice(this.timeouts.indexOf(ms)); };

	private get maxTimeout()
	{
		let max = 0;
		this.timeouts.forEach(ms => ms > max && (max = ms));
		return max;
	}

	private readonly onChangeListeners: OnChangeCallback[] = [];
	public readonly isPrefetching: boolean = false;

	public constructor({ isPrefetching, path }: RouterHandlerOptions = {})
	{
		this._path = path || "/";
		this.isPrefetching = isPrefetching || false;
		if (env.isClient)
		{
			this._title = document.title;

			if (!isPrefetching)
			{
				this._path = window.location.pathname;

				if (location.pathname !== this.path)
					window.history.replaceState(null, this.title, this.path);
				window.addEventListener("popstate", (e) => 
				{
					this.routeTo(window.location.pathname, true);
				});
			}
		}
		else if (env.isServer)
		{
			this.setTitle("");
		}
	}

	public readonly onChange = (fn: OnChangeCallback) =>
	{
		if (!this.onChangeListeners.includes(fn))
			this.onChangeListeners.push(fn);
	}

	public readonly removeChangeListener = (fn: OnChangeCallback) => 
	{
		const i = this.onChangeListeners.indexOf(fn);
		if (i > -1)
			this.onChangeListeners.splice(i, 1);
	}

	public readonly routeTo = (path: string, fromPopState: boolean = false): any =>
	{
		if (this.timeout)
			this.clearTimeout();

		const from = this.path;
		const to = path;

		if (from === to)
		{
			this.startPath = undefined;
			this.onChangeListeners.forEach(l => l(from, to, false));
			return;
		}

		if (this.startPath && (this.startPath === path))
		{
			this.startPath = undefined;
			this.onChangeListeners.forEach(l => l(from, to, false));
			throw new Error(`Redirect cycle detected!`);
		}
		let shouldPrefetch = true;

		this.onChangeListeners.forEach(l => { (l(from, to, true) === false) && (shouldPrefetch = false) });

		const prefetch = async (prefetch: boolean = true) =>
		{
			if (env.isClient && !fromPopState)
				window.history.pushState(null, this.title, this.path);

			const handler = new RouterHandler({
				appTitle: this.appTitle,
				isPrefetching: true,
				path: to
			});

			if (prefetch)
				await Async.prefetch((
					<RouterHandler.Provider handler={handler}>
						{Async["app"] || null}
					</RouterHandler.Provider>
				), AsyncHandler.get(), () => !handler.redirected);

			if (handler.redirected)
			{
				const redirected = handler.redirected;
				if (redirected.to === this.path)
				{
					const { to, from } = redirected;
					this.onChangeListeners.forEach(l => l(from, to, false));
					return this.startPath = undefined;
				}

				if (!this.startPath)
					this.startPath = to;

				return this.routeTo(redirected.to);
			}

			this.startPath = undefined;
			this._redirected = false;
			this._path = path;

			if (env.isClient && !fromPopState)
				window.history.replaceState(null, handler.title, this.path);

			if (this.setRouterPath)
				this.setRouterPath(path);

			this.onChangeListeners.forEach(l => l(from, to, false));
			this.timeout = null;
		}

		if (shouldPrefetch)
			this.timeout = setTimeout(prefetch, this.maxTimeout);
		else
			prefetch(false);
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

	public readonly redirectTo = (path: string) =>
	{
		if (!this._redirected)
			this._redirected = {
				from: this.path,
				to: path
			};
	}
}

type OnChangeCallback = (from: string, to: string, isLoading: boolean) => void | boolean;

type RouterHandlerOptions = {
	path?: string;
	appTitle?: string;
	isPrefetching?: boolean;
};