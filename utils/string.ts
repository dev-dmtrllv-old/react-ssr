export const toSnakeCase = (str: string, delimiter: string = "-"): string => str.split("").map((l, i) => 
{
	if (i !== 0 && l === l.toUpperCase())
		return `${delimiter}${l}`;
	return l;
}).join("").toLowerCase();

export const toCamelCase = (str: string, cap: boolean = false, delimiter: string = "-") =>
{
	let s = "";
	str.split(delimiter).forEach(p => 
	{
		if (p)
		{
			if (s === "")
				if (cap)
					s += capitalize(p);
				else
					s += p;
			else
				s += capitalize(p)
		}
	});
	return s;
};

export const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1, str.length).toLowerCase();