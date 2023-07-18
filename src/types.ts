import fs from "node:fs";

export type QAR = {
	readonly header: QARHeader;
	readonly footer: QARFooter;

	readonly hash: Buffer;
	readonly realHash: Buffer;

	readonly files: string[][];

	readonly fileDescriptor: number;
	readonly path: string;
	readonly stats: fs.Stats;

	verifyIntegrity(): boolean;

	readFileSync(file: string | string[]): Buffer;
	readFile(file: string | string[]): Promise<Buffer>;

	invalidateCache(): void;

	close(): void;
};

export type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
	  }
	: T;

export type QARHeader = {
	version: number;
	compression: { name: string; options: any; chunkSize: number };
};
export type QARFooter = FolderChildren;

export type FolderChildren = Record<string, File | Folder | Symlink>;

export enum FileType {
	FILE = "FILE",
	SYMLINK = "SYMLINK",
	FOLDER = "FOLDER",
}

export type Folder = {
	type: FileType.FOLDER;
	children: FolderChildren;
};
export type File = {
	type: FileType.FILE;
	offset: number;
	length: number;
	size: number;
	chunks: number[];
};
export type Symlink = {
	type: FileType.SYMLINK;
	target: string[];
};

export type EmbedArray = {
	type?: FileType.FILE | FileType.SYMLINK;
	from: string;
	to: string[];
}[];
