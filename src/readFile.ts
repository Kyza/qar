import fs from "node:fs";
import compressors from "./compressors.js";
import { QAR } from "./types.js";
import getFileInStructure from "./util/getFileInFolderRoot.js";

export default function readFile(qar: QAR, filePath: string[]): Buffer {
	// Iterate through the file and handle symlinks along the way.
	const file = getFileInStructure(qar.footer, filePath);

	// We have saved the file's decompressed size in the footer.
	// Alloc that ahead of time since this isn't a stream.
	const fileBuffer = Buffer.alloc(file.size);

	// Save the position it is in reading chunks and writing to the file buffer.
	let chunkPosition = 0;
	let filePosition = 0;
	for (const chunkSize of file.chunks) {
		// Alloc only what's needed right now.
		const chunkBuffer = Buffer.alloc(chunkSize);
		fs.readSync(
			qar.fileDescriptor,
			chunkBuffer,
			0,
			chunkSize,
			chunkPosition + file.offset
		);

		// Decompress the chunk into a new buffer and set it at the correct position in the file buffer.
		const decompressedBuffer =
			compressors[qar.header.compression.name].decompress(chunkBuffer);
		fileBuffer.set(decompressedBuffer, filePosition);

		// Don't forget to update the positions.
		chunkPosition += chunkSize;
		filePosition += decompressedBuffer.length;
	}

	return fileBuffer;
}
