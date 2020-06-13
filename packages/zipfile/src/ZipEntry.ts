import {EntryHeader} from "./headers/EntryHeader";
import {decodeString, encodeString, readUInt16LE, readUInt32LE, readUInt64LE} from "./util/buffer";
import {crc32} from './util/crc32';
import {Constants} from "./util/Constants";
import {Errors} from "./util/Errors";
import {deflate, deflateAsync, inflate, inflateAsync} from "./util/MethodsPako";

const DIRECTORY_CONTENT_ERROR = "A directory cannot have content";

const SLASH = '/'.charCodeAt(0);

export class ZipEntry {

    readonly entryHeader = new EntryHeader();
    private _entryName = new Uint8Array(0);
    private _comment = new Uint8Array(0);
    private _extra = new Uint8Array(0);
    private _isDirectory = false;
    private uncompressedData = new Uint8Array(0);

    constructor(readonly input?: Uint8Array) {
    }

    get entryName(): string {
        return decodeString(this._entryName);
    }

    set entryName(v: string) {
        const data = encodeString(v);
        this._entryName = data;
        this.entryHeader.fileNameLength = data.length;
        this.updateDirectory(v);
    }

    get comment(): string {
        return decodeString(this._comment);
    }

    set comment(v: string) {
        const data = encodeString(v);
        this._comment = data;
        this.entryHeader.commentLength = data.length;
    }

    set attr(attr) {
        this.entryHeader.attr = attr;
    }

    get attr() {
        return this.entryHeader.attr;
    }

    get isDirectory() {
        return this._isDirectory
    }

    /////

    getCompressedDataFromZip() {
        if (this.input === undefined) {
            return new Uint8Array(0);
        }
        this.entryHeader.loadDataHeaderFromBinary(this.input);
        return this.input.slice(this.entryHeader.realDataOffset, this.entryHeader.realDataOffset + this.entryHeader.compressedSize)
    }

    decompress(): Uint8Array {
        if (this._isDirectory) {
            throw new Error(DIRECTORY_CONTENT_ERROR);
        }

        const compressedData = this.getCompressedDataFromZip();
        if (compressedData.length === 0) {
            // File is empty, nothing to decompress.
            return compressedData;
        }

        switch (this.entryHeader.method) {
            case Constants.STORED:
                if (!this.crc32OK(compressedData)) {
                    throw new Error(Errors.BAD_CRC);
                }
                //si added otherwise did not seem to return data.
                return compressedData;
            case Constants.DEFLATED: {
                const data = inflate(compressedData);
                if (!this.crc32OK(data)) {
                    console.warn(Errors.BAD_CRC + " " + decodeString(this._entryName));
                }
                return data;
            }
            default:
                throw new Error(Errors.UNKNOWN_METHOD);
        }
    }

    async decompressAsync(): Promise<Uint8Array> {
        if (this._isDirectory) {
            throw new Error(DIRECTORY_CONTENT_ERROR);
        }

        const compressedData = this.getCompressedDataFromZip();
        if (compressedData.length === 0) {
            // File is empty, nothing to decompress.
            return compressedData;
        }

        switch (this.entryHeader.method) {
            case Constants.STORED:
                if (!this.crc32OK(compressedData)) {
                    throw new Error(Errors.BAD_CRC);
                }
                //si added otherwise did not seem to return data.
                return compressedData;
            case Constants.DEFLATED: {
                const data = await inflateAsync(compressedData);
                if (!this.crc32OK(data)) {
                    console.warn(Errors.BAD_CRC + " " + decodeString(this._entryName));
                }
                return data;
            }
            default:
                throw new Error(Errors.UNKNOWN_METHOD);
        }
    }

    compress(): Uint8Array {
        if (this.uncompressedData.length === 0 && this.input !== undefined) {
            // no data set or the data wasn't changed to require re-compression
            return this.getCompressedDataFromZip();
        }

        if (this.uncompressedData.length !== 0 && !this._isDirectory) {
            // Local file header
            switch (this.entryHeader.method) {
                case Constants.STORED: {
                    this.entryHeader.compressedSize = this.entryHeader.size;
                    return this.uncompressedData;
                }
                case Constants.DEFLATED:
                default: {
                    const data = deflate(this.uncompressedData);
                    this.entryHeader.compressedSize = data.length;
                    return data;
                }
            }
        }
        return new Uint8Array(0);
    }

    async compressAsync(): Promise<Uint8Array> {
        if (this.uncompressedData.length === 0 && this.input !== undefined) {
            // no data set or the data wasn't changed to require re-compression
            return this.getCompressedDataFromZip();
        }

        if (this.uncompressedData.length > 0 && !this._isDirectory) {
            // Local file header
            switch (this.entryHeader.method) {
                case Constants.STORED: {
                    this.entryHeader.compressedSize = this.entryHeader.size;
                    return this.uncompressedData;
                }
                case Constants.DEFLATED:
                default: {
                    const data = await deflateAsync(this.uncompressedData!);
                    this.entryHeader.compressedSize = data.length;
                    return data;
                }
            }
        }
        return new Uint8Array(0);
    }

    getCompressedData(): Uint8Array {
        return this.compress();
    }

    getCompressedDataAsync() {
        return this.compressAsync();
    }

    setData(value: Uint8Array) {
        this.uncompressedData = value;
        if (!this._isDirectory && this.uncompressedData.length) {
            this.entryHeader.size = this.uncompressedData.length;
            this.entryHeader.method = Constants.DEFLATED;
            this.entryHeader.crc = crc32(this.uncompressedData);
            this.entryHeader.changed = true;
        } else {
            // folders and blank files should be stored
            this.entryHeader.method = Constants.STORED;
        }
    }

    getData(): Uint8Array {
        return this.entryHeader.changed ? this.uncompressedData : this.decompress();
    }

    getDataAsync(): Promise<Uint8Array> {
        if (this.entryHeader.changed && this.uncompressedData.length !== 0) {
            return Promise.resolve(this.uncompressedData);
        }
        return this.decompressAsync();
    }

    getHeaderData(): Uint8Array {
        const data = new Uint8Array(Constants.LOCHDR + this._entryName.length + this._extra.length);
        let offset = 0;
        this.entryHeader.writeDataHeader(data, offset);
        offset += Constants.LOCHDR;
        data.set(this._entryName, offset);
        offset += this._entryName.length;
        data.set(this._extra, offset);
        return data;
    }

    packHeader(): Uint8Array {
        const header = this.entryHeader.entryHeaderToBinary();
        // adds
        let offset = Constants.CENHDR;
        header.set(this._entryName, offset);
        offset += this._entryName.length;
        header.set(this._extra, offset);
        offset += this._extra.length;
        header.set(this._comment, offset);
        return header;
    }

    toObject() {
        return {
            fileName: decodeString(this._entryName),
            comment: decodeString(this._comment),
            isDirectory: this._isDirectory,
            header: this.entryHeader.toObject(),
            compressedData: this.input,
            data: this.uncompressedData
        };
    }

    private crc32OK(data: Uint8Array): boolean {
        // if bit 3 (0x08) of the general-purpose flags field is set, then the CRC-32 and file sizes are not known when the header is written
        if ((this.entryHeader.flags & 0x8) !== 0x8) {
            if (crc32(data) !== this.entryHeader.dataHeader.crc) {
                return false;
            }
        } else {
            // @TODO: load and check data descriptor header
            // The fields in the local header are filled with zero, and the CRC-32 and size are appended in a 12-byte structure
            // (optionally preceded by a 4-byte signature) immediately after the compressed data:
        }
        return true;
    }

    //Override header field values with values from the ZIP64 extra field
    private parseZip64ExtendedInformation(data: Uint8Array) {
        if (data.length >= Constants.EF_ZIP64_SCOMP) {
            const size = readUInt64LE(data, Constants.EF_ZIP64_SUNCOMP);
            if (this.entryHeader.size === Constants.EF_ZIP64_OR_32) {
                this.entryHeader.size = size;
            }
        }

        if (data.length >= Constants.EF_ZIP64_RHO) {
            const compressedSize = readUInt64LE(data, Constants.EF_ZIP64_SCOMP);
            if (this.entryHeader.compressedSize === Constants.EF_ZIP64_OR_32) {
                this.entryHeader.compressedSize = compressedSize;
            }
        }

        if (data.length >= Constants.EF_ZIP64_DSN) {
            const offset = readUInt64LE(data, Constants.EF_ZIP64_RHO);
            if (this.entryHeader.offset === Constants.EF_ZIP64_OR_32) {
                this.entryHeader.offset = offset;
            }
        }

        if (data.length >= Constants.EF_ZIP64_DSN + 4) {
            const diskNumStart = readUInt32LE(data, Constants.EF_ZIP64_DSN);
            if (this.entryHeader.diskNumStart === Constants.EF_ZIP64_OR_16) {
                this.entryHeader.diskNumStart = diskNumStart;
            }
        }
    }

    private updateDirectory(fileName: string) {
        const n = fileName.replace(/\\/g, '/');
        this._isDirectory = n.length > 0 && SLASH === n.charCodeAt(n.length - 1);
    }

    private parseExtra(data: Uint8Array) {
        let offset = 0;
        while (offset < data.length) {
            const signature = readUInt16LE(data, offset);
            offset += 2;
            const size = readUInt16LE(data, offset);
            offset += 2;
            const part = data.slice(offset, offset + size);
            offset += size;
            if (Constants.ID_ZIP64 === signature) {
                this.parseZip64ExtendedInformation(part);
            }
        }
    }

    parseEntryData(input: Uint8Array, offset: number) {
        this.entryHeader.loadFromBinary(input.slice(offset, offset += Constants.CENHDR));
        this._entryName = input.slice(offset, offset += this.entryHeader.fileNameLength);
        this._extra = input.slice(offset, offset += this.entryHeader.extraLength);
        this._comment = input.slice(offset, offset + this.entryHeader.commentLength);

        this.parseExtra(this._extra);
        this.updateDirectory(decodeString(this._entryName));
    }
}
