import fs from "fs";
import path from "path";

export default function walkFolder(
	folder: string,
	callback: (filePath: string) => void
): string[] {
	const files = fs.readdirSync(folder);
	const result = [];

	for (const file of files) {
		const filePath = path.join(folder, file);
		const stats = fs.statSync(filePath);

		if (stats.isDirectory()) {
			walkFolder(filePath, callback);
		} else {
			callback(filePath);
		}
	}

	return result;
}
