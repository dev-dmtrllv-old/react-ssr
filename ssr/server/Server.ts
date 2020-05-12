import fs from "fs";
import path from "path";
import webpack from "webpack";
import http from "http";
import https from "https";
import bodyParser from "body-parser";
import io from "socket.io";
import express, { Application } from "express";
import { Volume, createFsFromVolume } from "memfs";
import { getType } from "mime";

import { Renderer, RendererOptions } from "./Renderer";
import { Manifest } from "./Manifest";
import { ApiRoutes, ApiType, Api } from "ssr/Api";

export class Server
{
	public readonly app: Application;
	public readonly host: string;
	public readonly port: number;

	private readonly manifest: Manifest = new Manifest("app");

	private readonly onStartListeners: (() => any)[] = [];
	public readonly addStartListener = (fn: () => any) => this.onStartListeners.push(fn);
	public readonly removeStartListener = (fn: () => any) => this.onStartListeners.splice(this.onStartListeners.indexOf(fn), 1);

	private apiRoutes: { [path: string]: ApiType<any> } = {};

	private clientApiRoutes = {};

	private flattenApiRoutes = (routes: ApiRoutes<any>) =>
	{
		for (const k in routes)
		{
			const r: any = routes[k];
			if (r.path && r.type)
				this.apiRoutes[r.path] = r.type;
			else
				this.flattenApiRoutes(r);
		}
	}

	private createClientApi = (routes: ApiRoutes<any>) =>
	{
		const clientApi: any = {};
		for (const k in routes)
		{
			const r: any = routes[k];
			if (r.path && r.type)
			{
				const methods: string[] = [];
				const _api = new r.type(null, null);
				for (const type in _api)
					if (_api[type] !== undefined && Api.methodTypes.includes(type))
						methods.push(type);
				if (methods.length > 0)
					clientApi[k] = methods;
			}
			else
				clientApi[k] = this.createClientApi(r);
		}
		return clientApi;
	}

	public constructor({ host = "localhost", port = 3000, staticPath }: ServerOptions = {})
	{
		this.app = express();
		this.host = host;
		this.port = port;

		this.app.use(bodyParser.urlencoded({ extended: true }));
		this.app.use(bodyParser.json());

		if (env.isDev)
			this.setupDevServer(staticPath);
		else
			this.setupProductionServer();
	}

	public useApi({ routes, path = "/api" }: ApiProps)
	{
		this.flattenApiRoutes(routes);
		this.clientApiRoutes = this.createClientApi(routes);
		
		this.app.use(path, async (req, res) => 
		{
			const apiPath = path + req.url;
			const apiType = this.apiRoutes[apiPath];
			if (apiType)
			{
				const api = new apiType(req, res);
				const method = req.method.toLowerCase();
				const props = method === "get" ? req.query : req.body;
				if (!api[method])
					return res.status(404).send(`Cannot ${req.method} ${apiPath}`);
				res.send(await api[method](props));
			}
			else
				res.status(404).send(`Cannot ${req.method} ${apiPath}`);
		});
	}

	private setupDevServer(staticPath: string = "static")
	{
		const { createClientConfig } = require("../../scripts/client-config.js");
		const config = createClientConfig({ isDev: true, onManifest: this.manifest.updateJson });
		const compiler = webpack(config);

		const _fs = createFsFromVolume(new Volume());

		const output = _fs as any;
		output.join = path.join;

		compiler.outputFileSystem = output;

		this.addStartListener(() => new Promise((res, rej) => 
		{
			const server = http.createServer();
			const socket = io(server);

			let lastCompileTime: number | null = null;

			socket.on("connection", (s) => s.emit("reload", lastCompileTime));

			server.listen(3001);

			compiler.watch({ ignored: /node_modules/ }, (err, stats) => 
			{
				if (err)
				{
					if (!lastCompileTime)
						rej(err);
					console.error(err);
				}
				else
				{
					console.log("app compiled!");
					if (!lastCompileTime)
						res();
				}

				lastCompileTime = Date.now();
				setTimeout(() => 
				{
					socket.emit("reload", lastCompileTime);
				}, 100);
			});
		}));

		this.app.use(express.static(path.join(__dirname, "..", "..", staticPath)));
		this.app.use((req, res, next) => 
		{
			if (req.url === "/")
				return next();

			const _path = `build/public${req.url}`;

			if (_fs.existsSync(_path))
			{
				const type = getType(req.url);
				if (type)
					res.setHeader('Content-Type', type);
				return res.send(_fs.readFileSync(_path));
			}

			next();
		});
	}

	private setupProductionServer()
	{
		this.app.use(express.static(path.join(__dirname, "public")));
		const manifestPath = path.join(__dirname, "manifest.json");
		if (fs.readFileSync(manifestPath))
			this.manifest.updateJson(JSON.parse(fs.readFileSync(manifestPath, "utf-8")));
		else
			throw new Error(`Cannot find manifest.json!`);
	}

	public useRenderer(path: string, props: RendererOptions, handle?: RenderHandler): void
	{
		this.app.get(path, (req, res, next) => 
		{
			try
			{
				if (!props.fetch)
					props.fetch = (req, res) => (url, method, data) => new Promise(async (resolve, reject) =>
					{
						const apiType = this.apiRoutes[url];
						if (apiType)
						{
							const api = new apiType(req, res);
							if (api[method])
								resolve(await api[method](data));
							else
								reject(`Cannot ${method.toUpperCase()} ${url}!`);
						}
						else
						{
							const httpTarget = url.startsWith("https") ? https : http;
							const request = httpTarget.request(url, {
								method: method.toUpperCase(),
								headers: method === "get" ? undefined : {
									'Content-Type': 'application/json',
									'Content-Length': data.length
								}
							}, (response) =>
							{
								let resData = "";
								response.on("error", err => reject(err));
								response.on('data', (d) => resData += d.toString());
								response.on("end", () => resolve(JSON.parse(resData)));
							});

							request.on('error', (error) => reject(error));

							request.write(JSON.stringify(data));
							request.end();
						}
					});
				const renderer = new Renderer(this.manifest, this.clientApiRoutes, props, req, res, next);
				if (handle)
					handle(renderer);
				else
					renderer.render();
			}
			catch (e)
			{
				console.log(e);
			}
		});
	}

	public async start()
	{
		for (const fn of this.onStartListeners)
			await fn();

		this.app.listen(this.port, this.host, () => console.log(`server listening on http://${this.host}:${this.port}`))
	}
}

type ServerOptions = {
	host?: string;
	port?: number;
	staticPath?: string;
};

type RenderHandler = (renderer: Renderer) => void;

type ApiProps = {
	routes: ApiRoutes<any>;
	path?: string;
}