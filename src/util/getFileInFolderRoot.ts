import { File, FileType, Folder, FolderChildren, Symlink } from "../types.js";

export default function getFileInFolderRoot<Root extends FolderChildren>(
	root: Root,
	path: string[]
): File {
	const symlinksTraveled = new Set<Symlink>();

	let current: FolderChildren = root;
	let navPath = [...path];

	while (navPath.length > 0) {
		// TODO: Don't use `shift()`, it could be slow on long paths.
		const childName = navPath.shift();
		let file = current[childName];

		if (navPath.length !== 0) {
			if (file == null) {
				// If the item is not in the object, return undefined immediately.
				return undefined;
			}
			// Check if the path has been visited before.
			else if (file.type === FileType.SYMLINK) {
				if (symlinksTraveled.has(file)) throw new Error("Circular path detected.");
				symlinksTraveled.add(file);
			}
		}
		// If the path is empty, then we are at the end of the path.
		else {
			// If it already exists and is a folder...
			if (current[childName] != null && current[childName].type === FileType.FOLDER)
				throw new Error("Cannot set an existing folder to a file.");
			// Make sure to set the reference not the variable.
			return current[childName] as File;
		}

		switch (file.type) {
			case FileType.FOLDER:
				current = (current[childName] as Folder).children;
				break;
			case FileType.FILE:
				throw new Error("Path leads to a file before reaching the destination.");
			case FileType.SYMLINK:
				navPath = file.target;
				current = root;
				break;
			default:
				throw new Error("Unknown file type found.");
		}
	}
}
