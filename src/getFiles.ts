import { FileType, FolderChildren, QAR } from "./types.js";

export default function getFiles(qar: QAR): string[][] {
	const structure: FolderChildren = qar.footer;

	const files: string[][] = [];

	const stack: { structure: FolderChildren; path: string[] }[] = [
		{ structure, path: [] },
	];
	while (stack.length > 0) {
		const current = stack.pop();
		for (const [name, file] of Object.entries(current.structure)) {
			switch (file.type) {
				case FileType.FILE:
					files.push([...current.path, name]);
					break;
				case FileType.FOLDER:
					stack.push({
						structure: file.children,
						path: [...current.path, name],
					});
					break;
				case FileType.SYMLINK:
					throw new Error("Symlinks not supported here yet.");
				default:
					throw new Error(`Unknown file type.`);
			}
		}
	}

	return files;
}
