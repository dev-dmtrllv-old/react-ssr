import { Server } from "ssr/server";
import { apiRoutes } from "api/routes";

const server = new Server();

server.app.get("/favicon.ico", (req, res) => res.send(null));

server.useApi({ routes: apiRoutes });

server.useRenderer("*", { title: "SSR - test", app: () => import("../app/App") });

server.start();