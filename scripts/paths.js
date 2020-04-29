const path = require("path");

const rootPath = path.join(__dirname, "..");
const resolve = (...parts) => path.resolve(rootPath, ...parts);

const paths = {
	root: rootPath,
	client: resolve("app", "index.tsx"),
	server: resolve("server", "index.ts"),
	build: resolve("build"),
	public: resolve("public")
};

const aliases = (() =>
{
	const aliasPaths = require("../tsconfig.json").compilerOptions.paths;

	let a = {};
	for (let alias in aliasPaths)
	{
		let p = aliasPaths[alias][0];
		if (p)
			a[alias.replace("/*", "")] = "./" + p.replace("/*", "");
	}
	return a;
})();

module.exports = {
	rootPath,
	resolve,
	aliases,
	paths
};