import React from "react";
import { AsyncHandler } from "./AsyncHandler";

export const AsyncContext = React.createContext<AsyncContextType>({ handler: new AsyncHandler(), isPrefetching: false });

export const AsyncProvider: React.FC<AsyncContextType> = ({ isPrefetching = false, handler, children }) => 
{
	return (
		<AsyncContext.Provider value={{ handler, isPrefetching }}>
			{children}
		</AsyncContext.Provider>
	);
};

export type AsyncContextType = {
	handler: AsyncHandler;
	isPrefetching?: boolean;
};