import asar from "asar";
import { baseline, bench, group, run } from "mitata";
import fs from "node:fs";
import path from "node:path";
import { make, open } from "../src/index.js";

const testASAR = path.resolve("bench", "test.asar");
const brotliQAR = path.resolve("bench", "brotli.qar");
const gzipQAR = path.resolve("bench", "gzip.qar");
const flateQAR = path.resolve("bench", "flate.qar");
const uncmpQAR = path.resolve("bench", "uncmp.qar");
const source = path.resolve("src");

console.log(source);

make(source, brotliQAR, {
	compression: { name: "brotli" },
});
make(source, gzipQAR, {
	compression: { name: "gzip" },
});
make(source, gzipQAR, {
	compression: { name: "flate" },
});
make(source, uncmpQAR, {
	compression: { name: "none" },
});

group("make archive", () => {
	baseline("asar", async () => {
		await asar.createPackage(source, testASAR);
	});
	bench("qar brotli", () => {
		make(source, brotliQAR, {
			compression: { name: "brotli" },
		});
	});
	bench("qar gzip", () => {
		make(source, gzipQAR, {
			compression: { name: "gzip" },
		});
	});
	bench("qar flate", () => {
		make(source, flateQAR, {
			compression: { name: "flate" },
		});
	});
	bench("qar none", () => {
		make(source, uncmpQAR, {
			compression: { name: "none" },
		});
	});
});

group("read one archive", () => {
	const brotli = open(brotliQAR);
	const gzip = open(gzipQAR);
	const flate = open(gzipQAR);
	const none = open(uncmpQAR);

	baseline("asar", async () => {
		asar.extractFile(testASAR, "index.ts");
	});
	bench("qar brotli", () => {
		brotli.readFileSync(["index.ts"]);
	});
	bench("qar gzip", () => {
		gzip.readFileSync(["index.ts"]);
	});
	bench("qar flate", () => {
		flate.readFileSync(["index.ts"]);
	});
	bench("qar none", () => {
		none.readFileSync(["index.ts"]);
	});
});

group("read full archive", () => {
	const brotli = open(brotliQAR);
	const gzip = open(gzipQAR);
	const flate = open(gzipQAR);
	const none = open(uncmpQAR);

	baseline("asar", async () => {
		const files = asar
			.listPackage(testASAR)
			.map((file) => file.replace(/\\/g, "/").replace(/^\//, ""))
			.filter((file) => file.endsWith(".ts"));

		for (const file of files ?? []) {
			asar.extractFile(testASAR, file);
		}
	});
	bench("qar brotli", () => {
		for (const file of brotli.files ?? []) {
			brotli.readFileSync(file);
		}
	});
	bench("qar gzip", () => {
		for (const file of gzip.files ?? []) {
			gzip.readFileSync(file);
		}
	});
	bench("qar flate", () => {
		for (const file of flate.files ?? []) {
			flate.readFileSync(file);
		}
	});
	bench("qar none", () => {
		for (const file of none.files ?? []) {
			none.readFileSync(file);
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
const brotliSize = fs.statSync(brotliQAR).size;
const gzipSize = fs.statSync(gzipQAR).size;
const flateSize = fs.statSync(gzipQAR).size;
const noneSize = fs.statSync(uncmpQAR).size;

console.log("ASAR Size:", asarSize.toLocaleString());
console.log("Brotli QAR Size:", brotliSize.toLocaleString());
console.log("GZip QAR Size:", gzipSize.toLocaleString());
console.log("Flate QAR Size:", flateSize.toLocaleString());
console.log("Uncompressed QAR Size:", noneSize.toLocaleString());
