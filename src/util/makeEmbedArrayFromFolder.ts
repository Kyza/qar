import path from "node:path";
import { EmbedArray, FileType } from "../types.js";
import walkFolder from "./walkFolder.js";

export default function makeEmbedArrayFromFolder(folder: string): EmbedArray {
	const filesToEmbed: EmbedArray = [];
	walkFolder(folder, (file) => {
		filesToEmbed.push({
			type: FileType.FILE,
			from: file,
			to: file.replace(folder + path.sep, "").split(path.sep),
		});
	});
	return filesToEmbed;
}
