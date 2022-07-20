# QAR - **Q**uark **Ar**chive

An archive inspired by ASAR meant for compression while keeping quick random access.

<img src="./qar.png" />

## Known Issues

- Missing streaming files from archive.
- Temporary performance issue with creating archives since last change.

## Benchmarks

QAR is generally faster than ASAR, but **ASAR has the *potential* to be the faster of the two** considering what it intends to support and how it was written.

On my machine, QAR's read speed with brotli compression is about 1.3 to 1.9x faster. Without compression, it is about 3 to 9x faster. Assuming this was implemented into Electron (don't get your hopes up lol), your code *could* load that much faster. QAR is also faster when creating archives, but most people won't care too much about that. It's all about the read speed!

Of course, your milage may vary so feel free to benchmark yourself and make more comprehensive benchmarks in the [benchmarks](./bench) folder.

## Identifier

The first 3 bytes are the identifier `QAR`.

## Checksum

The next 16 bytes are the checksum of the archive.

This is used to verify that the archive is not corrupted.

## Header

The next 8 bytes are a double-precision floating point number representing the size of the header. The actual header follows directly afterwards.

The header type is [`QARHeader`](./src/types.ts).

## Files

The files are stored directly after the header in an uninterrupted line. They are compressed individually and in chunks. The compression method and chunk size is stored in the header.

### Compression

Explaination coming soon.

You can add new compression methods by implementing it in the [`compressors.ts`](./src/compressors.ts) file.

### Chunk Size

The chunk size is used for reading the files in streams rather than all at once, so using a larger chunk size will use more memory but take up less disc space. The default chunk size is 64MB, 1,024 times the size `fs.createReadStream()` uses by default. Using `Infinity` as the chunk size will read the file in a single chunk, disabling streaming but using the least disc space possible. That is not recommended if you plan on storing large files.

### Symlinks

**Some support for symlinks exists, but it is untested.** Symlinks are endpoints in the file structure that point to other files or folders.

## Footer

After the files, the footer is stored at the end. After that, the length of the footer is saved in 8 bytes similar to with the header.

The structure of the footer is [`QARFooter`](./src/types.ts). Currently it may be subject to change.

