import React from "react";

type CacheContextType = {
	cache: boolean | number;
}

export const CacheContext = React.createContext<{ cache: boolean | number }>({ cache: true });

export const CacheProvider: React.FC<CacheContextType> = ({ cache, children }) => {
	const [cacheVal, setCacheVal] = React.useState<CacheContextType["cache"]>(cache);

	React.useEffect(() => 
	{
		if(cache !== cacheVal)
			setCacheVal(cache);
	}, [cache]);

	return (
		<CacheContext.Provider value={{ cache: cacheVal }}>
			{children}
		</CacheContext.Provider>
	);
}