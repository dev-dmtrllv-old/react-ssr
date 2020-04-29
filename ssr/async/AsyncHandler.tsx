import { AsyncResolver } from "./Async";

export class AsyncHandler
{
	private static clientInstance: AsyncHandler;

	public static readonly get = (data: AsyncData = {}) =>
	{
		if (env.isServer)
			return new AsyncHandler(data);
		if (!AsyncHandler.clientInstance)
			AsyncHandler.clientInstance = new AsyncHandler(data);
		return AsyncHandler.clientInstance;
	}

	public readonly data: AsyncData = {};

	private readonly toResolve: ObjectMap<{ resolver: AsyncResolver<any>, cache: boolean | number }> = {};

	public get shouldResolve() { return Object.keys(this.toResolve).length > 0; }

	public constructor(data: AsyncData = {})
	{
		for (const key in data)
		{
			const d = data[key];
			this.data[key] = d;
			if (typeof d.cacheVal === "number")
			{
				const c = this.data[key].cache;
				this.data[key].cache = new Date().getTime() + d.cacheVal;
			}
		}
	}

	public readonly get = <T extends any>(id: string): AsyncDataProps<T> | null => this.data[id] || null;

	public readonly remove = (id: string) => 
	{
		if (this.data[id])
			delete this.data[id];
	}

	public readonly prefetch = <T extends any>(id: string, fn: AsyncResolver<T>, cache: boolean | number) => this.toResolve[id] = { resolver: fn, cache };

	public readonly set = <T extends any>(id: string, data: AsyncDataProps<T>) => this.data[id] = data;

	public readonly resolve = async <T extends any>(fn: () => Promise<any>, cache: boolean | number): Promise<AsyncDataProps<T>> =>
	{
		let _cache = typeof cache === "boolean" ? cache : new Date().getTime() + cache;
		try
		{
			const data = await fn();
			return {
				data,
				error: null,
				cache: _cache,
				cacheVal: cache
			};
		}
		catch (e)
		{
			return {
				data: null,
				error: e,
				cache: _cache,
				cacheVal: cache
			};
		}
	}

	public readonly resolveAll = async () =>
	{
		for (const id in this.toResolve)
		{
			const data = await this.resolve(this.toResolve[id].resolver, this.toResolve[id].cache);
			this.data[id] = data;
			delete this.toResolve[id];
		}
	}
}

export type AsyncData = {
	[id: string]: AsyncDataProps<any>;
};

export type AsyncDataProps<T> = {
	data: T | null;
	error: Error | null;
	cache: boolean | number;
	cacheVal: boolean | number;
};