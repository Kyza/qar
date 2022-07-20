import fs from "fs";
import path from "path";
import getFiles from "./getFiles";
import getFooter from "./getFooter";
import getHash from "./getHash";
import getHeader from "./getHeader";
import readFile from "./readFile";
import { QARFooter, QARHeader } from "./types";
import verifyIntegrity from "./verifyIntegrity";

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

const qarCache = new Map<string, QAR>();

export default function open(file: string): QAR {
	const resolvedPath = path.resolve(file);

	if (qarCache.has(resolvedPath)) {
		return qarCache.get(resolvedPath);
	}

	const fd = fs.openSync(file, "r+");

	const cache: {
		header?: QARHeader;
		footer?: QARFooter;

		files?: string[][];

		hash?: Buffer;
		realHash?: Buffer;

		stats?: fs.Stats;
		integrity?: boolean;
	} = {};

	const qar = {
		get header() {
			return cache.header ?? (cache.header = getHeader(this));
		},
		get footer() {
			return cache.footer ?? (cache.footer = getFooter(this));
		},

		get hash() {
			return cache.hash ?? (cache.hash = getHash(this, false));
		},
		get realHash() {
			return cache.realHash ?? (cache.realHash = getHash(this, true));
		},

		get files() {
			return cache.files ?? (cache.files = getFiles(this));
		},

		get fileDescriptor() {
			return fd;
		},
		get path() {
			return file;
		},
		get stats() {
			return cache.stats ?? (cache.stats = fs.fstatSync(fd));
		},

		verifyIntegrity() {
			return cache.integrity ?? (cache.integrity = verifyIntegrity(this));
		},

		readFileSync(file) {
			if (typeof file === "string") file = file.split("/");
			return readFile(this, file);
		},
		async readFile(file) {
			if (typeof file === "string") file = file.split("/");
			return readFile(this, file);
		},

		invalidateCache(items?: (keyof typeof cache)[]) {
			const filterItems = items == null ? false : items.length > 0;
			for (const key in cache) {
				if (filterItems && !items.includes(key as any)) continue;
				cache[key] = undefined;
			}
		},

		close() {
			qarCache.delete(resolvedPath);
			this.invalidateCache();
			fs.closeSync(fd);
		},
	};

	qarCache.set(resolvedPath, qar);

	return qar;
}
