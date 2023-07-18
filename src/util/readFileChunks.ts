import fs from "node:fs";
import { DEFAULT_CHUNK_SIZE } from "../constants.js";

// Because fs.createReadStream() is async.
export function readFileChunks(
	fileOrFD: string | number,
	callback: (chunk: Buffer) => void,
	options?: {
		start?: number;
		end?: number;
		chunkSize?: number;
	}
) {
	options ??= {};
	options.start ??= 0;
	options.end ??= Infinity;
	options.chunkSize ??= DEFAULT_CHUNK_SIZE; // 64MB, 1,024 x fs.createReadStream().

	let fd: number;
	if (typeof fileOrFD === "string") {
		fd = fs.openSync(fileOrFD, "r");
	} else {
		fd = fileOrFD;
	}

	// The chunk size should be clamped to the max chunk size.
	options.chunkSize = Math.min(options.chunkSize, options.end - options.start);

	const fileSize = fs.fstatSync(fd).size;
	const allocSize = Math.min(options.chunkSize, fileSize);

	const buffer = Buffer.alloc(allocSize);

	let position = options.start;
	while (position < options.end) {
		const bytesRead = fs.readSync(fd, buffer, 0, allocSize, position);
		position += bytesRead;

		if (bytesRead === 0) break;

		// Remove the extra bytes if we read less than the chunk size.
		// Shortcut subarray if possible.
		if (position > options.end) {
			const neededBytes = bytesRead - (position - options.end);
			if (allocSize === neededBytes) {
				callback(buffer);
			} else {
				callback(buffer.subarray(0, neededBytes));
			}
		} else {
			const neededBytes = bytesRead;
			if (allocSize === neededBytes) {
				callback(buffer);
			} else {
				callback(buffer.subarray(0, neededBytes));
			}
		}
	}

	if (typeof fileOrFD === "string") fs.closeSync(fd);
}
