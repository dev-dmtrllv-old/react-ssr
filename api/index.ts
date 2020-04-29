import { Api } from "ssr/Api";
import { Users } from "./Users";
import { Users2 } from "./Users2";

export const apiRoutes = Api.createRoutes({
	users: Users,
	users2: Users2
});

export const api = Api.createClientApi(apiRoutes);