import fs from "fs";
import path from "path";
import { isQAR, make, open } from "../src";
import makeEmbedArrayFromFolder from "../src/util/makeEmbedArrayFromFolder";

const qarFile = path.resolve("./test/test.qar");
const source = path.resolve("./src");

console.time("make in");
make(source, qarFile, {
	compression: { name: "brotli", chunkSize: Infinity },
});
console.timeEnd("make in");

console.time("open in");
const qar = open(qarFile);
console.timeEnd("open in");

console.log("isQAR", isQAR(qarFile));

console.log("getHash", qar.hash);

console.log("getHash", qar.realHash);

console.log("verifyIntegrity", qar.verifyIntegrity());

console.log("getHeader", qar.header);

console.log("getFooter", qar.footer);

console.log("readFileSync", qar.readFileSync("make.ts").toString());

// console.log("fs.readFileSync", fs.readFileSync(path.resolve("./src/make.ts")));

console.log("QAR Size:             ", qar.stats.size.toLocaleString());

let size = 0;
for (const { from } of makeEmbedArrayFromFolder(source)) {
	size += fs.statSync(from).size;
}

console.log("Original File(s) Size:", size.toLocaleString());

// Compare the original files with the files in the QAR.
// If they are the same, then the QAR format works.
for (const file of qar.files) {
	const fileLocal = file.join("/");
	const filePath = path.resolve(source, fileLocal);

	const fileContents = fs.readFileSync(filePath).toString();

	if (fileContents !== qar.readFileSync(fileLocal).toString()) {
		console.log("File", fileLocal, "does not match");
	} else {
		console.log("File", fileLocal, "matches");
	}
}

console.time("close in");
qar.close();
console.timeEnd("close in");
