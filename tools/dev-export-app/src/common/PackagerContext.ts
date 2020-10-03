import path from "path";
import {fileURLToPath} from "url";
import {TemplateContextOptions} from "./TemplateGenerator";

export class PackagerContext {
    readonly packagerPath = path.resolve(fileURLToPath(import.meta.url), '../../..');

    constructor(readonly options: TemplateContextOptions) {
    }
}