import fs from "fs";
import { DEFAULT_CHUNK_SIZE } from "..";

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

	const buffer = Buffer.alloc(options.chunkSize);

	let position = options.start;
	while (position < options.end) {
		const bytesRead = fs.readSync(fd, buffer, 0, options.chunkSize, position);
		position += bytesRead;

		if (bytesRead === 0) break;

		if (position > options.end) {
			// Remove the extra bytes if we read more than the end.
			callback(buffer.subarray(0, bytesRead - (position - options.end)));
		} else {
			// Remove the extra bytes if we read less than the chunk size.
			callback(buffer.subarray(0, bytesRead));
		}
	}

	if (typeof fileOrFD === "string") fs.closeSync(fd);
}
