declare type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];
declare type OptionalKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T];

declare type ObjectMap<T> = { [key: string]: T };
declare type ExtractObjectMapType<T> = T extends ObjectMap<infer Type> ? Type : never;

declare type ReactPropsWithRef<T extends HTMLElement> = React.DetailedHTMLProps<React.HTMLAttributes<T>, T>;
declare type ReactProps<T extends HTMLElement> = Omit<ReactPropsWithRef<T>, "ref">;

//#region ResizeObserver
declare class ResizeObserver
{
	constructor(callback: ResizeObserverCallback);
	disconnect: () => void;
	observe: (target: Element, options?: ResizeObserverObserveOptions) => void;
	unobserve: (target: Element) => void;
}

interface ResizeObserverObserveOptions
{
	box?: "content-box" | "border-box";
}

type ResizeObserverCallback = (
	entries: ResizeObserverEntry[],
	observer: ResizeObserver,
) => void;

interface ResizeObserverEntry
{
	readonly contentBoxSize: ResizeObserverEntryBoxSize;
	readonly contentRect: DOMRectReadOnly;
	readonly target: Element;
}

interface ResizeObserverEntryBoxSize
{
	blockSize: number;
	inlineSize: number;
}
//#endregion

interface Window
{
	ResizeObserver: ResizeObserver;
}

declare interface Environment
{
	isDev: boolean;
	isServer: boolean;
	isClient: boolean;
}

declare const env: Environment;

//#region modules
declare module "*.css"
{
	const data: string;
	export default data;
}

declare module "*.scss"
{
	const data: string;
	export default data;
}

declare module "*.png"
{
	const data: any;
	export default data;
}

declare module "*.gif"
{
	const data: any;
	export default data;
}

declare module "*.jpg"
{
	const data: any;
	export default data;
}

declare module "*.jpeg"
{
	const data: any;
	export default data;
}
//#endregion