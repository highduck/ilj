import {Constants} from "../util/Constants";
import {Errors} from "../util/Errors";
import {readBigUInt64LE, readUInt16LE, readUInt32LE, writeUInt16LE, writeUInt32LE} from "../util/buffer";

export class MainHeader {

    diskEntries = 0;
    totalEntries = 0;
    size = 0;
    offset = 0;
    commentLength = 0;

    constructor() {
    }

    get mainHeaderSize() {
        return Constants.ENDHDR + this.commentLength;
    }

    loadFromBinary(data: Uint8Array) {
        // data should be 22 bytes and start with "PK 05 06"
        // or be 56+ bytes and start with "PK 06 06" for Zip64
        if ((data.length !== Constants.ENDHDR || readUInt32LE(data, 0) !== Constants.ENDSIG) &&
            (data.length < Constants.ZIP64HDR || readUInt32LE(data, 0) !== Constants.ZIP64SIG)) {
            throw new Error(Errors.INVALID_END);
        }

        if (readUInt32LE(data, 0) === Constants.ENDSIG) {
            // number of entries on this volume
            this.diskEntries = readUInt16LE(data, Constants.ENDSUB);
            // total number of entries
            this.totalEntries = readUInt16LE(data, Constants.ENDTOT);
            // central directory size in bytes
            this.size = readUInt32LE(data, Constants.ENDSIZ);
            // offset of first CEN header
            this.offset = readUInt32LE(data, Constants.ENDOFF);
            // zip file comment length
            this.commentLength = readUInt16LE(data, Constants.ENDCOM);
        } else {
            // number of entries on this volume
            this.diskEntries = readBigUInt64LE(data, Constants.ZIP64SUB);
            // total number of entries
            this.totalEntries = readBigUInt64LE(data, Constants.ZIP64TOT);
            // central directory size in bytes
            this.size = readBigUInt64LE(data, Constants.ZIP64SIZE);
            // offset of first CEN header
            this.offset = readBigUInt64LE(data, Constants.ZIP64OFF);

            this.commentLength = 0;
        }
    }

    toBinary(): Uint8Array {
        const b = new Uint8Array(Constants.ENDHDR + this.commentLength);
        // "PK 05 06" signature
        writeUInt32LE(b, Constants.ENDSIG, 0);
        writeUInt32LE(b, 0, 4);
        // number of entries on this volume
        writeUInt16LE(b, this.diskEntries, Constants.ENDSUB);
        // total number of entries
        writeUInt16LE(b, this.totalEntries, Constants.ENDTOT);
        // central directory size in bytes
        writeUInt32LE(b, this.size, Constants.ENDSIZ);
        // offset of first CEN header
        writeUInt32LE(b, this.offset, Constants.ENDOFF);
        // zip file comment length
        writeUInt16LE(b, this.commentLength, Constants.ENDCOM);
        // fill comment memory with spaces so no garbage is left there
        b.fill(' '.charCodeAt(0), Constants.ENDHDR);

        return b;
    }

    toObject() {
        return {
            diskEntries: this.diskEntries,
            totalEntries: this.totalEntries,
            size: this.size,
            offset: '0x' + this.offset.toString(16).toUpperCase(),
            commentLength: '0x' + this.commentLength.toString(16).toUpperCase()
        };
    }
}