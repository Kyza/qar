import fs from "fs";
import { IDENTIFIER_LENGTH, QAR_IDENTIFIER } from "./constants";

export default function isQAR(path: string): boolean {
	const fd = fs.openSync(path, "r");

	// Here we can quickly read where the identifier of a QAR would be.
	// The first bytes in the file.
	// If they are not "QAR", then it is not a QAR.
	const buffer = Buffer.alloc(IDENTIFIER_LENGTH);
	fs.readSync(fd, buffer, 0, IDENTIFIER_LENGTH, 0);

	fs.closeSync(fd);

	return !buffer.compare(QAR_IDENTIFIER);
}
