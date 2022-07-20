export const VERSION = 1;
export const IDENTIFIER_LENGTH = 3;
export const HASH_LENGTH = 16;
export const IDENTIFIER_AND_HASH_LENGTH = IDENTIFIER_LENGTH + HASH_LENGTH;
export const SIZE_LENGTH = 8;
export const DEFAULT_CHUNK_SIZE = 64 * 1024 * 1024; // 64MB
export const QAR_IDENTIFIER = Buffer.from("QAR", "binary");
