import React from "react";
import { Async, AsyncRender, AsyncFC } from "./Async";
import { toURLQuery } from "utils";

export const FetchContext = React.createContext<{ fetch: FetchFunction<any, any> }>({
	fetch: async (url, method = "get", data = {}) => 
	{
		if (env.isClient)
		{
			url = ((method === "get") && (Object.keys(data).length > 0)) ? `${url}?${toURLQuery(data)}` : url;
			const res = await window.fetch(url, {
				body: method !== "get" ? JSON.stringify(data) : undefined,
				method: method.toUpperCase(),
			});
			const responseText = await res.text();
			try
			{
				return JSON.parse(responseText);
			}
			catch
			{
				return responseText;
			}
		}
		throw new Error(`No fetch context provided for the server!`);
	}
});

export const Fetch: FetchFC = ({ url, method = "get", data, ...rest }) =>
{
	const { fetch } = React.useContext(FetchContext);

	return (
		<Async.Component id={`FETCH [${method}] ${url}`} name="Fetch" resolve={() => fetch(url, method, data)} {...rest} />
	);
};

type FetchFC<D = any, R = any> = AsyncFC<FetchProps<D, R>>;

export const FetchProvider: React.FC<{ fetch: FetchFunction<any, any> }> = ({ fetch, children }) => (
	<FetchContext.Provider value={{ fetch }}>
		{children}
	</FetchContext.Provider>
);

type FetchProps<D, R> = {
	url: string;
	method?: "get" | "post" | "put" | "delete";
	data?: D;
	children: AsyncRender<R>;
};

export type FetchFunction<D, R> = (url: string, method: Required<FetchProps<D, R>>["method"], data: D) => Promise<R>;