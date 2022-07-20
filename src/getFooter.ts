import fs from "fs";
import { compressors } from ".";
import { SIZE_LENGTH } from "./constants";
import { QAR } from "./open";
import { FolderChildren } from "./types";

export default function getFooter(qar: QAR): FolderChildren {
	const fileSize = qar.stats.size;

	// Read last 8 bytes.
	const footerSizeBuffer = Buffer.alloc(SIZE_LENGTH);
	fs.readSync(
		qar.fileDescriptor,
		footerSizeBuffer,
		0,
		SIZE_LENGTH,
		fileSize - SIZE_LENGTH
	);

	const footerSize = footerSizeBuffer.readDoubleBE();

	const footerStart = fileSize - footerSize - SIZE_LENGTH;

	const footerBuffer = Buffer.alloc(footerSize);
	fs.readSync(qar.fileDescriptor, footerBuffer, 0, footerSize, footerStart);

	return JSON.parse(
		compressors[qar.header.compression.name].decompress(footerBuffer).toString()
	) as FolderChildren;
}
