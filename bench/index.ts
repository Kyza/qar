import asar from "asar";
import fs from "fs";
import { baseline, bench, group, run } from "mitata";
import path from "path";
import { make, open } from "../src";

const testASAR = path.resolve("bench", "test.asar");
const testQAR = path.resolve("bench", "test.qar");
const source = path.resolve("src");

make(source, testQAR, {
	compression: { name: "brotli" },
});

group("make archive", () => {
	bench("asar", async () => {
		await asar.createPackage(source, testASAR);
	});
	baseline("qar", () => {
		make(source, testQAR, {
			compression: { name: "brotli" },
		});
	});
});

group("read one archive", () => {
	const qar = open(testQAR);

	bench("asar", async () => {
		asar.extractFile(testASAR, "make.ts");
	});
	baseline("qar", () => {
		qar.readFileSync(["make.ts"]);
	});
});

group("read full archive", () => {
	const qar = open(testQAR);

	bench("asar", async () => {
		const files = asar
			.listPackage(testASAR)
			.map((file) => file.replace(/\\/g, "/").replace(/^\//, ""))
			.filter((file) => file.endsWith(".ts"));

		for (const file of files ?? []) {
			asar.extractFile(testASAR, file);
		}
	});
	baseline("qar", () => {
		for (const file of qar.files ?? []) {
			qar.readFileSync(file);
		}
	});
});

await run({
	avg: true, // enable/disable avg column (default: true)
	json: false, // enable/disable json output (default: false)
	colors: true, // enable/disable colors (default: true)
	min_max: true, // enable/disable min/max column (default: true)
	collect: false, // enable/disable collecting returned values into an array during the benchmark (default: false)
	percentiles: true, // enable/disable percentiles column (default: true)
});

console.log();

// Calculate the size of each archive and compare them.
const asarSize = fs.statSync(testASAR).size;
const qarSize = fs.statSync(testQAR).size;

console.log("ASAR Size:", asarSize.toLocaleString());
console.log("QAR Size: ", qarSize.toLocaleString());
