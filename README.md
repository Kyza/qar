# QAR - **Q**uark **Ar**chive

An archive inspired by ASAR meant for compression while keeping quick random access.

## Known Issues

- Missing streaming files from archive.
- Temporary performance issue with creating archives since last change.

## Benchmarks

QAR is generally faster than ASAR, but **ASAR has the *potential* to be the faster of the two** considering what it intends to support and how it was written.

On my machine, QAR's read speed with brotli compression is about 1.3 to 1.9x faster. Without compression, it is about 3 to 9x faster. Assuming this was implemented into Electron (don't get your hopes up lol), your code *could* load that much faster. QAR is also faster when creating archives, but most people won't care too much about that. It's all about the read speed!

Of course, your milage may vary so feel free to benchmark yourself and make more comprehensive benchmarks in the [benchmarks](./bench) folder.

## Identifier

The first 3 bytes are the identifier `QAR`. This is used to quickly "ensure" that the file is indeed a QAR archive.

## Checksum

The next 16 bytes are the MD5 checksum of the archive. This is used to verify that the archive is not corrupted. ASAR does include hashes for this purpose, but it includes one *for every single file* it contains and does not cover verifying the file structure.

## Header

The next 8 bytes are a little endian double representing the size of the header. The actual header follows directly afterwards.

The header type is [`QARHeader`](./src/types.ts).

## Files

The files are stored directly after the header in an uninterrupted line. They are compressed individually and in chunks. The compression method and chunk size is stored in the header.

### Compression

By default, Brotli compression is used in QAR since it has the best compression ratio and fastest speeds. Everything after the header aside from the footer length at the very end gets compressed when an archive is made. Each file--including the footer--is compressed separately and by default chunked in 64MB chunks to enable streaming.

There are four compression methods implemented:

- `brotli` (default)
- `gzip`
- `flate` (deflate/inflate)
- `none` (no compression)

You can add new compression methods by implementing it on the [`compressors.ts`](./src/compressors.ts) object.

Here's an example that implements ZSTD compression:

```js
import { make, compressors } from "qar";
import zstd from "zstd";

compressors.zstd = {
	compress(data: Buffer): Buffer {
		return zstd.compress(data);
	},
	decompress(data: Buffer): Buffer {
		return zstd.decompress(data);
	}
};

// From now on QAR is able to compress and decompress with ZSTD.

make(source, qarFile, {
	compression: { name: "zstd" },
});
```

Chunking is automatically handled by QAR to make it more simple for you to stream files from the archive.

### Chunk Size

The chunk size is used for reading the files in streams rather than all at once, so using a larger chunk size will use more memory but take up less disc space. The default chunk size is 64MB, 1,024 times the size `fs.createReadStream()` uses by default. Using `Infinity` as the chunk size will read the file in a single chunk, disabling streaming but using the least disc space possible. That is not recommended if you plan on storing large files.

### Symlinks

**Some support for symlinks exists, but it is untested.** Symlinks are endpoints in the file structure that point to other files or folders.

## Footer

After the files, the footer is stored at the end. After that, the length of the footer is saved in an 8 byte little endian double just like the header.

The structure of the footer is [`QARFooter`](./src/types.ts). Currently it may be subject to change.

