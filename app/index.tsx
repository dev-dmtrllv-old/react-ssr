import { Client } from "ssr/client";
import App from "./App";

try
{
	Client.render(App);
}
catch (e)
{
	Client.startLiveReload();
}