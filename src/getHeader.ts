import fs from "node:fs";
import { IDENTIFIER_AND_HASH_LENGTH, SIZE_LENGTH } from "./constants.js";
import { QAR, QARHeader } from "./types.js";
import { parse } from "./util/jsonReplacers.js";

export default function getHeader(qar: QAR): QARHeader {
	// Read the 8 bytes after the identifier and hash.
	const headerSizeBuffer = Buffer.alloc(SIZE_LENGTH);
	fs.readSync(
		qar.fileDescriptor,
		headerSizeBuffer,
		0,
		SIZE_LENGTH,
		IDENTIFIER_AND_HASH_LENGTH
	);
	const headerSize = headerSizeBuffer.readDoubleLE();

	const headerBuffer = Buffer.alloc(headerSize);
	fs.readSync(
		qar.fileDescriptor,
		headerBuffer,
		0,
		headerSize,
		IDENTIFIER_AND_HASH_LENGTH + SIZE_LENGTH
	);

	return JSON.parse(
		headerBuffer.toString(),
		// Add support for Infinity and -Infinity.
		parse
	);
}
