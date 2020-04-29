global.env = {
	isDev: true,
	isServer: true,
	isClient: false,
};

require("./ts-loader");
require("./overrideRequire");

const { resolve } = require("./paths");
const { watch } = require("./watch");

let removing = [];

const onChange = (path) =>
{
	if (!removing.includes(path))
	{
		const i = removing.push(path) - 1;
		setTimeout(() => 
		{
			delete require.cache[path];
			removing.splice(i, 1);
		}, 100);
	}
};

watch(resolve("app"), onChange);
watch(resolve("utils"), onChange);

require("../server");

process.on("exit", ()=> {
	console.log("kill :X");
})