
export function FormatTableTitle(contentLen: number, title: string, align = "left", format = "\x1B[32m")
{
	const tlen = title.length;
	if(align === "center")
	{
		const tprePadLen = (contentLen - tlen) / 2;
		const tpostPadLen = contentLen - (tprePadLen + tlen);
		const formatedTitle = "".padEnd(tprePadLen, " ") + format + title + "\x1B[0m" + "".padEnd(tpostPadLen, " ");
		return formatedTitle;
	}
	else if(align === "right")
	{
		const tprePadLen = (contentLen - tlen);
		const formatedTitle = "".padEnd(tprePadLen, " ") + format + title + "\x1B[0m";
		return formatedTitle;
	}
	else
	{
		const tpostPadLen = contentLen - tlen;
		const formatedTitle = format + title + "\x1B[0m" + "".padEnd(tpostPadLen, " ");
		return formatedTitle;
	}
}

export function FormatTableColumn(contentLen: number, content: string, align = "left", warnLevel?: number)
{
	let format = "";
	if (warnLevel === 1)
	{
		format = "\x1B[33m";
	}
	else if (warnLevel === 2)
	{
		format = "\x1B[31m";
	}
	const endFormat = format !== "" ? "\x1B[0m" : "";
	const tlen = content.length;
	if (align === "center")
	{
		const tprePadLen = (contentLen - tlen) / 2;
		const tpostPadLen = contentLen - (tprePadLen + tlen);
		const formatedTitle = "".padEnd(tprePadLen, " ") + format + content + endFormat + "".padEnd(tpostPadLen, " ");
		return formatedTitle;
	}
	else if (align === "right")
	{
		const tprePadLen = (contentLen - tlen);
		const formatedTitle = "".padEnd(tprePadLen, " ") + format + content + endFormat;
		return formatedTitle;
	}
	else
	{
		const tpostPadLen = contentLen - tlen;
		const formatedTitle = format + content + endFormat + "".padEnd(tpostPadLen, " ");
		return formatedTitle;
	}
}