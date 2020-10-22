import { PlatformType } from "@highduck/build-config";
import path from "path";
import {fileURLToPath} from "url";
import {IljAppConfig} from "./app-config";

export interface PackagerContextOptions {
    config: IljAppConfig;
    flags: string[];
    buildMode: 'production' | 'development';
    target: string;
    platform: PlatformType;
}

export class PackagerContext {
    readonly packagerPath = path.resolve(fileURLToPath(import.meta.url), '../../..');

    constructor(readonly options: PackagerContextOptions) {
    }
}