const { spawn } = require("child_process");
const { resolve } = require("./paths");
const { watch } = require("./watch");

let server = null;

const startServer = () =>
{
	if (server)
	{
		console.log("Restarting server...\r\n");
		server.kill();
	
	}
	else
	{
		console.log("Starting server...\r\n");
	}

	server = spawn("node", ["./scripts/start-server"], { stdio: "inherit" });
};

watch(resolve("server"), () => startServer());
watch(resolve("ssr"), () => startServer());

startServer();