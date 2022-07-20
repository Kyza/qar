import zlib from "zlib";

const compressors: Record<
	string,
	{
		compress(buffer: Buffer, options?: any): Buffer;
		decompress(buffer: Buffer, options?: any): Buffer;
	}
> = {
	brotli: {
		compress(buffer: Buffer, options?: zlib.BrotliOptions): Buffer {
			options ??= {};
			options.params ??= {};
			options.params[zlib.constants.BROTLI_PARAM_QUALITY] ??= 9;

			return zlib.brotliCompressSync(buffer, options);
		},
		decompress(buffer: Buffer, options?: zlib.BrotliOptions): Buffer {
			return zlib.brotliDecompressSync(buffer, options);
		},
	},
	// GZip is untested but Copilot made it so it's totally not my fault if it's slow or doesn't work.
	gzip: {
		compress(buffer: Buffer, options?: zlib.ZlibOptions): Buffer {
			return zlib.gzipSync(buffer, options);
		},
		decompress(buffer: Buffer, options?: zlib.ZlibOptions): Buffer {
			return zlib.gunzipSync(buffer, options);
		},
	},
	none: {
		compress(buffer: Buffer): Buffer {
			return buffer;
		},
		decompress(buffer: Buffer): Buffer {
			return buffer;
		},
	},
};

export default compressors;
