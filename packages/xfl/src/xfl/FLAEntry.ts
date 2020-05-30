import {Entry} from "./Entry";
import {Zip} from '@eliasku/zipfile';

export class FLAEntry extends Entry {

    zipFile: Zip;

    constructor(path: string, zipFile: Zip, root?: Entry) {
        super(path, root);
        this.zipFile = zipFile;
    }

    create(path: string, root: Entry): Entry {
        return new FLAEntry(path, this.zipFile, root);
    }

    text(): string {
        if (this._text === undefined) {
            this._text = this.zipFile.readAsText(this.path);
        }
        return this._text;
    }

    buffer(): Uint8Array {
        if (this._buffer === undefined) {
            this._buffer = this.zipFile.readFile(this.path) ?? new Uint8Array(0);
        }
        return this._buffer;
    }
}
