import { AsyncResolver } from "./Async";

export class AsyncHandler
{
	private static clientInstance: AsyncHandler;
	
	public static readonly get = (data: AsyncData = {}) =>
	{
		if(env.isServer)
			return new AsyncHandler(data);
		if (!AsyncHandler.clientInstance)
			AsyncHandler.clientInstance = new AsyncHandler(data);
		return AsyncHandler.clientInstance;
	}

	public readonly data: AsyncData = {};

	private readonly toResolve: ObjectMap<AsyncResolver<any>> = {};

	public get shouldResolve() { return Object.keys(this.toResolve).length > 0; }

	public constructor(data: AsyncData = {})
	{
		this.data = data;
	}

	public readonly get = <T extends any>(id: string): AsyncDataProps<T> | null => this.data[id] || null;

	public readonly prefetch = <T extends any>(id: string, fn: AsyncResolver<T>) => this.toResolve[id] = fn;

	public readonly set = <T extends any>(id: string, data: AsyncDataProps<T>) => this.data[id] = data;

	public readonly resolve = async <T extends any>(fn: () => Promise<any>): Promise<AsyncDataProps<T>> =>
	{
		try
		{
			const data = await fn();
			return {
				data,
				error: null
			};
		}
		catch (e)
		{
			return {
				data: null,
				error: e,
			};
		}
	}

	public readonly resolveAll = async () =>
	{
		for (const id in this.toResolve)
		{
			const data = await this.resolve(this.toResolve[id]);
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
};