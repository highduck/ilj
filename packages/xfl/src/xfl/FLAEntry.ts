import fs from "fs";
import {Entry} from "./Entry";
import AdmZip from "adm-zip";

export class FLAEntry extends Entry {

    static fromZip(zipFilePath: string): FLAEntry {
        console.log("reading fla file content: " + zipFilePath);
        const buffer = fs.readFileSync(zipFilePath);
        console.log("fla file content size: " + buffer.length);
        const zipFile = new AdmZip(buffer);
        const rootFla = new FLAEntry("", zipFile);
        console.log('entries: ' + zipFile.getEntries().length);
        return rootFla;
    }

    zipFile: AdmZip;

    constructor(path: string, zipFile: AdmZip, root?: Entry) {
        super(path, root);
        this.zipFile = zipFile;
    }

    create(path: string, root: Entry): Entry {
        return new FLAEntry(path, this.zipFile, root);
    }

    content(): string {
        if (this._content === undefined) {
            const entry = this.zipFile.getEntry(this.path);
            this._content = entry.getData().toString('utf-8');
        }
        return this._content;
    }

    buffer(): Uint8Array {
        if (this._buffer === undefined) {
            const entry = this.zipFile.getEntry(this.path);
            this._buffer = new Uint8Array(entry.getData().buffer);
        }
        return this._buffer;
    }
}
