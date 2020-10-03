import path from "path";
import {fileURLToPath} from "url";

export function getPackagerPath() {
    return path.resolve(fileURLToPath(import.meta.url), '../../..');
}