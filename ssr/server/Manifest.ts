import webpack from "webpack";

const defaultJson: ManifestJSON = {
	main: {
		runtime: {
			id: "runtime",
			files: []
		},
	},
	chunks: {}
}

export class Manifest
{
	public static readonly Plugin = class ManifestPlugin
	{
		public static readonly pluginName = "ManifestPlugin";

		private readonly props: { onManifest: ManifestCallback };

		constructor(props: { onManifest: ManifestCallback })
		{
			this.props = props;
		}

		private readonly transformPath = (p: string) =>
		{
			if (p.startsWith("."))
				return p.substr(1, p.length);
			else if (!p.startsWith("/"))
				return "/" + p;
			else
				return p;
		}

		apply(compiler: webpack.Compiler)
		{
			compiler.hooks.emit.tapAsync(ManifestPlugin.pluginName, (c, cb) =>
			{
				const manifest: any = {
					main: {},
					chunks: {}
				};

				for (const { files, name, id } of c.chunks)
				{
					if (name)
					{
						manifest.main[name === "main" ? "app" : name] = {
							id,
							files: files.map((p: string) => this.transformPath(p))
						};
					}
				}

				for (const { chunks, origins } of c.chunkGroups)
				{
					const origin = origins && origins[0];
					if (origin)
					{
						const fileName = origin.request;
						if (fileName)
						{
							for (const { id, files } of chunks)
							{
								manifest.chunks[fileName] = {
									id,
									files: files.map((p: string) => this.transformPath(p))
								};
							}
						}
					}
				}

				this.props.onManifest(manifest);
				cb();
			});
		}
	};

	public readonly updateJson = (json: ManifestJSON) => this._json = json;

	public constructor(public appName: string, public _json: ManifestJSON = defaultJson) { }

	public readonly get = (id: string, from: keyof ManifestJSON, type: "css" | "js") =>
	{
		const target = this._json[from][id];
		return target ? target.files.filter(f => f.endsWith(type)) : [];
	}

	public readonly getAssets = (type: "css" | "js", ...chunks: string[]) =>
	{
		const chunkPaths: string[] = [];

		for(const chunk of chunks)
			chunkPaths.push(...this.get(chunk, "chunks", type));

		return [
			...this.get("runtime", "main", type),
			...this.get("vendor", "main", type),
			...this.get("common", "main", type),
			...chunkPaths,
			...this.get(this.appName, "main", type),
		];
	};

	public readonly getStyles = (...chunks: string[]) => this.getAssets("css", ...chunks);
	public readonly getScripts = (...chunks: string[]) => this.getAssets("js", ...chunks);
}

type ManifestJSON = {
	main: MainGroup;
	chunks: ManifestGroup;
};

interface MainGroup extends ManifestGroup
{
	runtime: ManifestData;
	vendor?: ManifestData;
	common?: ManifestData;
}

type ManifestData = {
	id: string;
	files: string[];
};

type ManifestGroup = {
	[id: string]: ManifestData | undefined;
};

export type ManifestCallback = (manifest: ManifestJSON) => void;