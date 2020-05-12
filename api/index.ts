import { Client } from "ssr/client";
import type { ApiRoutesType } from "./routes";
import type { ClientApi } from "ssr/Api";

let api: ClientApi<ApiRoutesType>;

if (env.isServer)
	api = Client.createServerApi(require("./routes").apiRoutes);
else
	api = Client.createApi<ApiRoutesType>();

export {
	api
};