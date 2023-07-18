import crypto from "node:crypto";
import fs from "node:fs";
import {
	HASH_LENGTH,
	IDENTIFIER_AND_HASH_LENGTH,
	IDENTIFIER_LENGTH,
} from "./constants.js";
import { QAR } from "./types.js";
import { readFileChunks } from "./util/readFileChunks.js";

export default function getHash(qar: QAR, real: boolean = false): Buffer {
	// Here we are getting the real hash.
	// This is the actual hash of the contents of the QAR.
	if (real) {
		const realHash = crypto.createHash("md5");
		realHash.setEncoding("binary");

		readFileChunks(
			// TODO: Not have to reopen the archive.
			qar.path,
			(buffer) => realHash.write(buffer.toString("binary")),
			{ start: IDENTIFIER_AND_HASH_LENGTH }
		);

		realHash.end();
		const hashBinary = realHash.read();
		return Buffer.from(hashBinary, "binary");
	}

	// Here we are getting the expected hash.
	// It's what the contents of the QAR get checksum'd with.
	const buffer = Buffer.alloc(HASH_LENGTH);
	// Read the hash bytes after the identifier.
	fs.readSync(qar.fileDescriptor, buffer, 0, HASH_LENGTH, IDENTIFIER_LENGTH);

	return buffer;
}
