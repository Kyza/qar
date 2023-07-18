import fs from "node:fs";
import path from "node:path";
import getFiles from "./getFiles.js";
import getFooter from "./getFooter.js";
import getHash from "./getHash.js";
import getHeader from "./getHeader.js";
import readFile from "./readFile.js";
import { QAR, QARFooter, QARHeader } from "./types.js";
import verifyIntegrity from "./verifyIntegrity.js";

export default function open(file: string): QAR {
	const resolvedPath = path.resolve(file);

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
			this.invalidateCache();
			fs.closeSync(fd);
		},
	};

	return qar;
}
