import asar from "asar";
import fs from "fs";
import { baseline, bench, group, run } from "mitata";
import path from "path";
import { make, open } from "../src";

const testASAR = path.resolve("bench", "test.asar");
// const zstdQAR = path.resolve("bench", "zstd.qar");
const brotliQAR = path.resolve("bench", "brotli.qar");
const uncmpQAR = path.resolve("bench", "uncmp.qar");
const source = path.resolve("src");

make(source, brotliQAR, {
	compression: { name: "brotli" },
});
// make(source, zstdQAR, {
// 	compression: { name: "zstd" },
// });
make(source, uncmpQAR, {
	compression: { name: "none" },
});

group("make archive", () => {
	baseline("asar", async () => {
		await asar.createPackage(source, testASAR);
	});
	// bench("qar zstd", () => {
	// 	make(source, zstdQAR, {
	// 		compression: { name: "zstd" },
	// 	});
	// });
	bench("qar brotli", () => {
		make(source, brotliQAR, {
			compression: { name: "brotli" },
		});
	});
	bench("qar none", () => {
		make(source, uncmpQAR, {
			compression: { name: "none" },
		});
	});
});

group("read one archive", () => {
	// const zstd = open(zstdQAR);
	const brotli = open(brotliQAR);
	const none = open(uncmpQAR);

	baseline("asar", async () => {
		asar.extractFile(testASAR, "index.ts");
	});
	// bench("qar zstd", () => {
	// 	zstd.readFileSync(["index.ts"]);
	// });
	bench("qar brotli", () => {
		brotli.readFileSync(["index.ts"]);
	});
	bench("qar none", () => {
		none.readFileSync(["index.ts"]);
	});
});

group("read full archive", () => {
	// const zstd = open(zstdQAR);
	const brotli = open(brotliQAR);
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
	// bench("qar zstd", () => {
	// 	for (const file of zstd.files ?? []) {
	// 		zstd.readFileSync(file);
	// 	}
	// });
	bench("qar brotli", () => {
		for (const file of brotli.files ?? []) {
			brotli.readFileSync(file);
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
// const zstdSize = fs.statSync(zstdQAR).size;
const noneSize = fs.statSync(uncmpQAR).size;

console.log("ASAR Size:", asarSize.toLocaleString());
console.log("Brotli QAR Size:", brotliSize.toLocaleString());
// console.log("Zstd QAR Size:", zstdSize.toLocaleString());
console.log("Uncompressed QAR Size:", noneSize.toLocaleString());
