export function stringify(_key: string, value: any): string {
	switch (value) {
		case Infinity:
			return "Infinity";
		case -Infinity:
			return "-Infinity";
		default:
			return value;
	}
}

export function parse(_key: string, value: string): any {
	switch (value) {
		case "Infinity":
			return Infinity;
		case "-Infinity":
			return -Infinity;
		default:
			return value;
	}
}
