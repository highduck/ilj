import {MainHeader} from "./headers/MainHeader";
import {Constants} from "./util/Constants";
import {decodeString, encodeString, readBigUInt64LE, readUInt32LE} from "./util/buffer";
import {ZipEntry} from "./ZipEntry";

const INVALID_FORMAT = "Invalid or unsupported zip format. No END header found";

export class ZipFile {

    private readonly _input: Uint8Array;

    private readonly _header = new MainHeader();
    private _comment = new Uint8Array(0);

    private _list: ZipEntry[] = [];
    private _lookup: { [key: string]: ZipEntry } = {};
    private _entriesLoaded = false;

    constructor(input?: Uint8Array) {
        if (input !== undefined) {
            // from memory buffer
            this._input = new Uint8Array(input);
            this.readMainHeader();
        } else {
            // new file
            this._entriesLoaded = true;
            this._input = new Uint8Array(0);
        }
    }

    get comment(): string {
        return decodeString(this._comment);
    }

    set comment(v: string) {
        this.commentData = encodeString(v);
    }

    /**
     * Returns an array of ZipEntry objects existent in the current opened archive
     * @return Array
     */
    get entries(): ZipEntry[] {
        if (!this._entriesLoaded) {
            this.readEntries();
        }
        return this._list;
    }

    set commentData(data: Uint8Array) {
        this._comment = data;
        this._header.commentLength = data.length;
    }

    getEntryCount(): number {
        if (!this._entriesLoaded) {
            return this._header.totalEntries;
        }

        return this._list.length;
    }

    forEach(callback: (e: ZipEntry) => void) {
        if (!this._entriesLoaded) {
            this.iterateEntries(callback);
            return;
        }

        for (const e of this._list) {
            callback(e);
        }
    }

    /**
     * Returns a reference to the entry with the given name or null if entry is inexistent
     *
     * @param entryName
     * @return ZipEntry
     */
    get(entryName: string): ZipEntry | undefined {
        if (!this._entriesLoaded) {
            this.readEntries();
        }
        return this._lookup[entryName];
    }

    /**
     * Adds the given entry to the entry list
     *
     * @param entry
     */
    add(entry: ZipEntry) {
        if (!this._entriesLoaded) {
            this.readEntries();
        }
        this._list.push(entry);
        this._lookup[entry.entryName] = entry;
        this._header.totalEntries = this._header.diskEntries = this._list.length;
    }

    /**
     * Removes the entry with the given name from the entry list.
     *
     * If the entry is a directory, then all nested files and directories will be removed
     * @param entryName
     */
    delete(entryName: string) {
        if (!this._entriesLoaded) {
            this.readEntries();
        }
        const entry = this._lookup[entryName];
        if (entry && entry.isDirectory) {
            for (const child of this.getChildren(entry)) {
                if (child.entryName !== entryName) {
                    this.delete(child.entryName)
                }
            }
        }
        this._list.splice(this._list.indexOf(entry), 1);
        delete this._lookup[entryName];
        this._header.totalEntries = this._header.diskEntries = this._list.length;
    }

    /**
     *  Iterates and returns all nested files and directories of the given entry
     *
     * @param entry
     * @return Array
     */
    getChildren(entry: ZipEntry): ZipEntry[] {
        if (!this._entriesLoaded) {
            this.readEntries();
        }
        const list: ZipEntry[] = [];
        if (entry.isDirectory) {
            const name = entry.entryName;
            const len = name.length;
            for (const e of this._list) {
                if (e.entryName.substr(0, len) === name) {
                    list.push(e);
                }
            }
        }
        return list;
    }

    /**
     * Returns the zip file data
     */
    compress(): Uint8Array {
        if (!this._entriesLoaded) {
            this.readEntries();
        }
        this._list.sort(compareName);

        let totalSize = 0;
        const dataBlock: Uint8Array[] = [];
        const entryHeaders: Uint8Array[] = [];
        let dindex = 0;

        this._header.size = 0;
        this._header.offset = 0;

        for (const entry of this._list) {
            // compress data and set local and entry header accordingly. Reason why is called first
            const compressedData = entry.getCompressedData();
            entry.entryHeader.offset = dindex;
            const dataHeader = entry.getHeaderData();
            const dataLength = dataHeader.length + compressedData.length;

            dindex += dataLength;

            dataBlock.push(dataHeader);
            dataBlock.push(compressedData);

            const entryHeader = entry.packHeader();
            entryHeaders.push(entryHeader);
            this._header.size += entryHeader.length;
            totalSize += dataLength + entryHeader.length;
        }

        // also includes zip file comment length
        totalSize += this._header.mainHeaderSize;

        // point to end of data and beginning of central directory first record
        this._header.offset = dindex;

        dindex = 0;
        const outBuffer = new Uint8Array(totalSize);
        for (const content of dataBlock) {
            // write data blocks
            outBuffer.set(content, dindex);
            dindex += content.length;
        }
        for (const content of entryHeaders) {
            // write central directory entries
            outBuffer.set(content, dindex);
            dindex += content.length;
        }

        const mh = this._header.toBinary();
        if (this._comment.length) {
            // add zip file comment
            mh.set(this._comment, Constants.ENDHDR);
        }

        // write main header
        outBuffer.set(mh, dindex);

        return outBuffer
    }

    compressAsync(onSuccess: (buffer: Uint8Array) => void,
                  onFail: (err: any) => void,
                  onItemStart: (name: string) => void,
                  onItemEnd: (name: string) => void) {
        if (!this._entriesLoaded) {
            this.readEntries();
        }
        this._list.sort(compareName);

        let totalSize = 0;
        const dataBlock: Uint8Array[] = [];
        const entryHeaders: Uint8Array[] = [];
        let dindex = 0;

        this._header.size = 0;
        this._header.offset = 0;

        let compressEntry: (entryList: ZipEntry[]) => void;
        compressEntry = (entryList: ZipEntry[]) => {
            if (entryList.length) {
                const entry = entryList.pop()!;
                const name = entry.entryName;
                if (onItemStart) {
                    onItemStart(name);
                }
                entry.getCompressedDataAsync().then((compressedData) => {
                    if (onItemEnd) {
                        onItemEnd(name);
                    }

                    entry.entryHeader.offset = dindex;
                    // data header
                    const dataHeader = entry.getHeaderData();
                    const dataLength = dataHeader.length + compressedData.length;

                    dindex += dataLength;

                    dataBlock.push(dataHeader);
                    dataBlock.push(compressedData);

                    const entryHeader = entry.packHeader();
                    entryHeaders.push(entryHeader);
                    this._header.size += entryHeader.length;
                    totalSize += dataLength + entryHeader.length;

                    if (this._list.length) {
                        compressEntry(entryList);
                    } else {
                        // also includes zip file comment length
                        totalSize += this._header.mainHeaderSize;

                        // point to end of data and beginning of central directory first record
                        this._header.offset = dindex;

                        dindex = 0;
                        const outBuffer = new Uint8Array(totalSize);
                        for (const content of dataBlock) {
                            // write data blocks
                            outBuffer.set(content, dindex);
                            dindex += content.length;
                        }
                        for (const content of entryHeaders) {
                            // write central directory entries
                            outBuffer.set(content, dindex);
                            dindex += content.length;
                        }

                        const mh = this._header.toBinary();
                        if (this._comment) {
                            // add zip file comment
                            mh.set(this._comment, Constants.ENDHDR);
                        }

                        // write main header
                        outBuffer.set(mh, dindex);

                        onSuccess(outBuffer);
                    }
                });
            }
        }
        compressEntry(this._list);
    }

    private iterateEntries(callback: (entry: ZipEntry) => void) {
        // total number of entries
        const totalEntries = this._header.diskEntries;
        // offset of first CEN header
        let offset = this._header.offset;
        for (let i = 0; i < totalEntries; i++) {
            const entry = new ZipEntry(this._input);
            entry.parseEntryData(this._input, offset);
            offset += entry.entryHeader.entryHeaderSize;
            callback(entry);
        }
    }

    private readEntries() {
        this._entriesLoaded = true;
        this._lookup = {};
        this._list = [];
        // offset of first CEN header
        let offset = this._header.offset;
        // total number of entries
        for (let i = 0; i < this._header.diskEntries; ++i) {
            const entry = new ZipEntry(this._input);
            entry.parseEntryData(this._input, offset);
            offset += entry.entryHeader.entryHeaderSize;
            this._list.push(entry);
            this._lookup[entry.entryName] = entry;
        }
    }

    private readMainHeader() {
        let i = this._input.length - Constants.ENDHDR; // END header size
        const max = Math.max(0, i - 0xFFFF); // 0xFFFF is the max zip file comment length
        let n = max;
        let endStart = this._input.length;
        let endOffset = -1; // Start offset of the END header
        let commentEnd = 0;

        for (; i >= n; --i) {
            // quick check that the byte is 'P'
            if (this._input[i] !== 0x50) {
                continue;
            }
            if (readUInt32LE(this._input, i) === Constants.ENDSIG) { // "PK\005\006"
                endOffset = i;
                commentEnd = i;
                endStart = i + Constants.ENDHDR;
                // We already found a regular signature, let's look just a bit further to check if there's any zip64 signature
                n = i - Constants.END64HDR;
                continue;
            }

            if (readUInt32LE(this._input, i) === Constants.END64SIG) {
                // Found a zip64 signature, let's continue reading the whole zip64 record
                n = max;
                continue;
            }

            if (readUInt32LE(this._input, i) == Constants.ZIP64SIG) {
                // Found the zip64 record, let's determine it's size
                endOffset = i;
                endStart = i + readBigUInt64LE(this._input, i + Constants.ZIP64SIZE) + Constants.ZIP64LEAD;
                break;
            }
        }

        if (!~endOffset) {
            throw new Error(INVALID_FORMAT);
        }

        this._header.loadFromBinary(this._input.slice(endOffset, endStart));
        if (this._header.commentLength) {
            this._comment = this._input.slice(commentEnd + Constants.ENDHDR);
        }
        // readEntries();
    }
}

function compareName(a: ZipEntry, b: ZipEntry) {
    const nameA = a.entryName.toLowerCase();
    const nameB = b.entryName.toLowerCase();
    return nameA < nameB ? -1 : (nameA > nameB ? 1 : 0);
}