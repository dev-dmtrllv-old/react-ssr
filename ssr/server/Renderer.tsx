import React from "react";
import ReactDOMServer from "react-dom/server";
import path from "path";
import type { Request, Response, NextFunction } from "express";

import { escapeConsoleCodes, } from "utils";

import { Manifest } from "./Manifest";

import { AsyncProvider } from "../async/AsyncContext";
import { AsyncHandler } from "../async/AsyncHandler";
import { Async, getDynamicPaths, removeDynamicData, FetchProvider, FetchFunction } from "../async";
import { SSRScript, SSRData } from "../SSRData";
import { RouterHandler } from "ssr/router/RouterHandler";

const HTML: React.FC<HTMLProps> = ({ lang = "en", title, styles = [], scripts = [], children }) =>
{
	return (
		<html lang={lang}>
			<head>
				{title && <title>{title}</title>}
				{styles.map((s, i) => <link key={i} href={s} rel="stylesheet" />)}
			</head>
			<body>
				{children}
				{scripts.map((s, i) => <script key={i} src={s} />)}
			</body>
		</html>
	);
}

type HTMLProps = {
	lang?: string;
	title?: string;
	styles?: string[];
	scripts?: string[];
};

const appStringFromError = (e: RenderError) =>
{
	let msg = escapeConsoleCodes(e.message);
	const stack: string = e.stack.substr((e.message + " " + e.name + ":").length, e.stack.length).replace(/\r?\n|\r/g, "").replace(/  /g, " ");
	if (e.code)
		msg = ` at \"${JSON.stringify(msg.split(": ")[0]).replace(/\\\\/g, "\\").replace(/\"/g, "")}`;
	else
		msg += " at " + stack.split(" at ")[1].replace(/.*\(/gi, "").replace(/:\d+:\d+\)/gi, "").split(path.sep === "/" ? "\\" : "/").join("");
	return `
				<style>
					html, body {
						font-family: sans-serif;
						background-color: rgb(41, 0, 0);
						color: rgb(255, 98, 98);
					}
				</style>
				<h2 style="text-align: center;">
					${e.name} ${msg}
				</h2>
				<script>
					const err = new Error("${e.name}" + ${JSON.stringify(msg)} + '"');
					delete err.stack;
					console.error(err);
				</script>
			`;
}

export class Renderer
{
	public readonly props: Readonly<RendererOptions>;
	private readonly req: Request;
	private readonly res: Response;
	private readonly next: NextFunction;

	private readonly styles: string[] = []
	private readonly scripts: string[] = [];
	public readonly manifest: Manifest;
	public readonly fetch: FetchFunction<any, any>;

	public constructor(manifest: Manifest, props: RendererOptions, req: Request, res: Response, next: NextFunction)
	{
		this.manifest = manifest;
		this.props = props;
		this.req = req;
		this.res = res;
		this.next = next;
		if (props.fetch)
			this.fetch = props.fetch(req, res);
	}

	public addAsset = (url: string) =>
	{
		if (url.endsWith(".css") && !this.styles.includes(url))
			this.styles.push(url);
		else if (url.endsWith(".js") && !this.scripts.includes(url))
			this.scripts.push(url);
	}

	public prefetch = async (): Promise<PrefetchResponse> =>
	{
		const { getStyles, getScripts } = this.manifest;

		const asyncHandler = new AsyncHandler();
		const router = new RouterHandler({ path: this.req.url, appTitle: this.props.title });
		
		let appString = "";

		const styles = [...this.styles];
		const scripts = [...this.scripts];

		try
		{
			const imported = await this.props.app();
			const Component = imported.default || imported;

			const app = (
				<RouterHandler.Provider handler={router}>
					<FetchProvider fetch={this.fetch}>
						<Component />
					</FetchProvider>
				</RouterHandler.Provider>
			);

			await Async.prefetch(app, asyncHandler, () => router.redirected === false);

			if (router.redirected !== false)
				return { redirected: router.redirected };

			appString = ReactDOMServer.renderToString(
				<AsyncProvider handler={asyncHandler}>
					{app}
				</AsyncProvider>
			);
		}
		catch (err) 
		{
			appString = appStringFromError(err);
			console.error(err);
		}

		const dynamicPaths = getDynamicPaths(asyncHandler.data);
		styles.push(...getStyles(...dynamicPaths));
		scripts.push(...getScripts(...dynamicPaths));

		return {
			title: router.title === "" ? this.props.title : router.title,
			redirected: false,
			appString: appString,
			styles,
			scripts,
			ssrData: {
				appTitle: this.props.title,
				async: removeDynamicData(asyncHandler.data)
			}
		};
	}

	public render = async () =>
	{
		const prefetchData = await this.prefetch();
		if (prefetchData.redirected)
			return this.res.redirect(prefetchData.redirected.to);
		else
		{
			const { ssrData, appString, ...rest } = prefetchData;
			this.res.send(ReactDOMServer.renderToStaticMarkup(
				<HTML {...rest}>
					<div id="root" dangerouslySetInnerHTML={{ __html: appString }} />
					<SSRScript data={ssrData} />
				</HTML>
			));
		}

	}
}

export type RendererOptions = {
	app: () => any;
	fetch?: (req: Request, res: Response) => FetchFunction<any, any>;
	title: string
};

type PrefetchData = {
	styles: string[];
	scripts: string[];
	appString: string;
	ssrData: SSRData;
	redirected: false;
	title: string;
};


export type RedirectData = { redirected: { from: string, to: string }; };

type PrefetchResponse = PrefetchData | RedirectData;

type RenderError = {
	name: string;
	message: string;
	stack: string;
	code?: string;
	loc?: any;
	pos?: any;
}