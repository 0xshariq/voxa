// Voxa version constant
// Voxa version constant, dynamically loaded from package.json
import { readFileSync } from "fs";
import { join } from "path";

let version = "unknown";
try {
	const pkg = JSON.parse(
		readFileSync(
			join(__dirname, "../../package.json"),
			"utf-8"
		)
	);
	version = pkg.version || version;
} catch (err) {
	// fallback to unknown
}

export const VOXA_VERSION = version;
