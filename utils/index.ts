export const toBase64 = (str: string) => Buffer.from(str).toString("base64");

export const fromBase64 = (str: string) => Buffer.from(str, "base64").toString("ascii");

export const escapeConsoleCodes = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");

export const toURLQuery = (o: ObjectMap<any>) => Object.keys(o).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(o[k])}`).join("&");

export const fromUrlQuery = <T extends ObjectMap<any> = ObjectMap<any>>(str: string): T => 
{
	const o: ObjectMap<any> = {};
	str.split("&").forEach(param => 
	{
		const [key, val] = param.split("=");
		o[decodeURIComponent(key)] = decodeURIComponent(val);
	});
	return o as T;
}


export const joinPaths = (...parts: string[]) => 
{
	let path = parts.join("/").replace(new RegExp("/{1,}", 'g'), "/");
	if(path === "/")
		return path;
	if(path.endsWith("/"))
		return path.substr(0, path.length - 1);
	return path;
};

export * from "./console";
export * from "./react";
export * from "./string";