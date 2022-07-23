import fs from "fs";
import {
	DEFAULT_CHUNK_SIZE,
	HASH_LENGTH,
	IDENTIFIER_AND_HASH_LENGTH,
	IDENTIFIER_LENGTH,
	QAR_IDENTIFIER,
	SIZE_LENGTH,
	VERSION,
} from "./constants";
import { compressors, getHash } from "./index";
import { QAR } from "./open";
import {
	DeepPartial,
	EmbedArray,
	FileType,
	FolderChildren,
	QARHeader,
} from "./types";
import { stringify } from "./util/jsonReplacers";
import makeEmbedArrayFromFolder from "./util/makeEmbedArrayFromFolder";
import { readFileChunks } from "./util/readFileChunks";
import setFileInStructure from "./util/setFileInFolderRoot";

export default function makeQAR(
	folderOrFiles: string | EmbedArray,
	output: string,
	options?: DeepPartial<QARHeader>
) {
	options ??= {};
	options.version = VERSION;
	options.compression ??= {};
	options.compression.name ??= "brotli";
	options.compression.options ??= {};
	options.compression.chunkSize ??= DEFAULT_CHUNK_SIZE;

	if (typeof folderOrFiles === "string") {
		folderOrFiles = makeEmbedArrayFromFolder(folderOrFiles);
	}

	if (fs.existsSync(output)) {
		fs.truncateSync(output, 0);
	}

	const qarFD = fs.openSync(output, "w");

	// Write the identifier.
	fs.writeSync(qarFD, QAR_IDENTIFIER, 0, IDENTIFIER_LENGTH, 0);

	// Save the header.
	const headerBuffer = Buffer.from(
		JSON.stringify(
			{ version: VERSION, ...options },
			// Add support for Infinity and -Infinity.
			stringify
		)
	);
	// Write the size before it.
	const headerSizeBuffer = Buffer.alloc(SIZE_LENGTH);
	headerSizeBuffer.writeDoubleLE(headerBuffer.length);
	fs.writeSync(
		qarFD,
		headerSizeBuffer,
		0,
		SIZE_LENGTH,
		IDENTIFIER_AND_HASH_LENGTH
	);

	// Write the header.
	fs.writeSync(
		qarFD,
		headerBuffer,
		0,
		headerBuffer.length,
		IDENTIFIER_AND_HASH_LENGTH + SIZE_LENGTH
	);

	const fileStructure: FolderChildren = {};

	// Write the files.
	let position = IDENTIFIER_AND_HASH_LENGTH + SIZE_LENGTH + headerBuffer.length;
	// Loop over every file in the files array.
	// The first element in each tuple is the path to the file on disc.
	// The second element is the path to the file in the QAR.
	for (const { type, from, to } of (folderOrFiles as EmbedArray) ?? []) {
		switch (type ?? FileType.FILE) {
			case FileType.FILE:
				const startPosition = position;

				// Read out chunks from the file and compress them.
				const fromFD = fs.openSync(from, "r");
				const fromSize = fs.fstatSync(fromFD).size;

				const chunks: number[] = [];

				readFileChunks(
					fromFD,
					(buffer) => {
						// TODO: Support other compression methods.
						const compressedBuffer = compressors[
							options.compression.name
						].compress(buffer, options.compression.options);

						chunks.push(compressedBuffer.length);

						fs.writeSync(
							qarFD,
							compressedBuffer,
							0,
							compressedBuffer.length,
							position
						);

						position += compressedBuffer.length;
					},
					{
						chunkSize:
							// Ensure Infinity doesn't get passed to the alloc in the readFileChunks function.
							options.compression.chunkSize === Infinity
								? fromSize
								: options.compression.chunkSize,
					}
				);

				// Add the file to the file structure.
				setFileInStructure(fileStructure, to, {
					type: FileType.FILE,
					offset: startPosition,
					length: position - startPosition,
					size: fromSize,
					chunks,
				});
				fs.closeSync(fromFD);
				break;
			case FileType.SYMLINK:
				// Add the symlink to the file structure.
				setFileInStructure(fileStructure, to, {
					type: FileType.SYMLINK,
					target: to,
				});
				break;
			default:
				throw new Error(`Unknown file type: ${type}`);
		}
	}

	// Write the file structure in.
	const fileStructureBuffer = Buffer.from(JSON.stringify(fileStructure));
	// Compress it.
	const compressedFileStructureBuffer = compressors[
		options.compression.name
	].compress(fileStructureBuffer, options.compression.options);
	// Write it.
	fs.writeSync(
		qarFD,
		compressedFileStructureBuffer,
		0,
		compressedFileStructureBuffer.length,
		position
	);
	position += compressedFileStructureBuffer.length;

	// Write the size to the very end.
	const sizeBuffer = Buffer.alloc(SIZE_LENGTH);
	sizeBuffer.writeDoubleLE(compressedFileStructureBuffer.length);
	fs.writeSync(qarFD, sizeBuffer, 0, SIZE_LENGTH, position);

	// All the data has been populated so it can be hashed and written.
	fs.writeSync(
		qarFD,
		getHash({ fileDescriptor: qarFD, path: output } as QAR, true),
		0,
		HASH_LENGTH,
		IDENTIFIER_LENGTH
	);

	fs.closeSync(qarFD);
}
