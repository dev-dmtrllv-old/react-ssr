import React from "react";
import ReactDOM from "react-dom";
import io from "socket.io-client";

import { getSSRData } from "./SSRData";
import { AsyncHandler } from "./async/AsyncHandler";
import { AsyncProvider } from "./async/AsyncContext";
import { Async } from "./async";
import { RouterHandler } from "./router/RouterHandler";

export class Client
{
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
		const routerHandler = RouterHandler.get();
		routerHandler.hydrate({ appTitle });

		const app = (
			<RouterHandler.Provider>
				<Component />
			</RouterHandler.Provider>
		);

		await Async.prefetch(app);

		ReactDOM.hydrate(
			<AsyncProvider handler={asyncHandler}>
				{app}
			</AsyncProvider>, document.getElementById("root"));
	}
}