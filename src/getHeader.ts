import fs from "fs";
import { IDENTIFIER_AND_HASH_LENGTH, SIZE_LENGTH } from ".";
import { QAR } from "./open";
import { QARHeader } from "./types";
import { parse } from "./util/jsonReplacers";

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
	const headerSize = headerSizeBuffer.readDoubleBE();

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
