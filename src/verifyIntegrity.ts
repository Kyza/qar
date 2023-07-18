import { QAR } from "./types.js";

export default function verifyIntegrity(qar: QAR): boolean {
	// Compare the expected hash with the real hash.
	return !qar.hash.compare(qar.realHash);
}
