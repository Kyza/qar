import zlib from "node:zlib";

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
	gzip: {
		compress(buffer: Buffer, options?: zlib.ZlibOptions): Buffer {
			return zlib.gzipSync(buffer, options);
		},
		decompress(buffer: Buffer, options?: zlib.ZlibOptions): Buffer {
			return zlib.gunzipSync(buffer, options);
		},
	},
	flate: {
		compress(buffer: Buffer, options?: zlib.ZlibOptions): Buffer {
			return zlib.deflateSync(buffer, options);
		},
		decompress(buffer: Buffer, options?: zlib.ZlibOptions): Buffer {
			return zlib.inflateSync(buffer, options);
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
