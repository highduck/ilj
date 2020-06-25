import {readFileSync, writeFileSync} from "fs";
import path from "path";

import folderHash from "folder-hash";

const {hashElement} = folderHash;

interface BuildInfoJson {
    hash: string;
    production: boolean;
}

export interface BuildInfoCheck {
    changed: boolean;
    inputHash: string;
    production: boolean;
}

// TODO: keep hash and build mode in bundle.json as property
export async function checkBuildInfo(input: string, output: string, production: boolean): Promise<BuildInfoCheck> {
    const hashResult = await hashElement(input, {});
    const result: BuildInfoCheck = {
        changed: true,
        inputHash: hashResult.hash,
        production
    };

    try {
        const data = readFileSync(path.join(output, 'build-info.json'), 'utf8');
        const {hash, production} = JSON.parse(data);
        if (hash === result.inputHash &&
            production === result.production) {
            result.changed = false;
        }
    } catch {
    }
    return result;
}

export function saveBuildInfo(buildInfo: BuildInfoCheck, output: string) {
    writeFileSync(path.join(output, 'build-info.json'), JSON.stringify({
        hash: buildInfo.inputHash,
        production: buildInfo.production
    }));
}