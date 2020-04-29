export class Console
{
	private static _isDisabled: boolean = false;

	private static buffer: string[][] = [];

	public static getBuffer() { return [...this.buffer]; }

	public static get isDisabled() { return this._isDisabled; }
	public static get isEnabled() { return !this._isDisabled; }

	private static ref: any = {};

	public static readonly disable = () =>
	{
		if (!Console.isDisabled)
		{
			Console.buffer = [];
			Object.keys(console).forEach((key) => 
			{
				Console.ref[key] = (console as any)[key];
				(console as any)[key] = (...str: string[]) => { Console.buffer.push(str); };
			});
			Console._isDisabled = true;
		}
	}

	public static readonly enable = () =>
	{
		if (Console.isDisabled)
		{
			Object.keys(console).forEach((key) => (console as any)[key] = Console.ref[key]);
			Console._isDisabled = false;
		}
	}
}