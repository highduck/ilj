import {Entry} from "./Entry";
import AdmZip from "adm-zip";

export class FLAEntry extends Entry {

    static fromZipBuffer(buffer: Uint8Array): FLAEntry {
        const zipFile = new AdmZip(new Buffer(buffer));
        return new FLAEntry("", zipFile);
    }

    zipFile: AdmZip;

    constructor(path: string, zipFile: AdmZip, root?: Entry) {
        super(path, root);
        this.zipFile = zipFile;
    }

    create(path: string, root: Entry): Entry {
        return new FLAEntry(path, this.zipFile, root);
    }

    text(): string {
        if (this._text === undefined) {
            const entry = this.zipFile.getEntry(this.path);
            this._text = entry.getData().toString('utf-8');
        }
        return this._text;
    }

    buffer(): Uint8Array {
        if (this._buffer === undefined) {
            const entry = this.zipFile.getEntry(this.path);
            this._buffer = new Uint8Array(entry.getData());
        }
        return this._buffer;
    }
}
