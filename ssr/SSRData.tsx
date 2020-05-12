import React from "react";
import { AsyncData } from "./async/AsyncHandler";
import { fromBase64, toBase64 } from "utils";

export type SSRData = {
	async: AsyncData;
	appTitle: string;
	api: any;
};

let ssrClientData: any = null;

let ssrApiData = {};

export const setSSRApiData = (api: any) => ssrApiData = api;

export const getSSRData = (): SSRData =>
{
	if (env.isClient)
	{
		if (!ssrClientData)
			ssrClientData = JSON.parse(fromBase64((window as any).__SSR_DATA__));
		return ssrClientData;
	}
	return {
		async: {},
		appTitle: "",
		api: ssrApiData
	};
}

export const SSRScript = ({ data }: { data: SSRData }) => <script id="SSR_DATA" dangerouslySetInnerHTML={{ __html: `window.__SSR_DATA__ = '${toBase64(JSON.stringify(data))}'; document.getElementById("SSR_DATA").remove();` }} />