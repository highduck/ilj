import { Constants } from '../util/Constants';
import { Errors } from '../util/Errors';
import { readUInt16LE, readUInt32LE, writeUInt16LE, writeUInt32LE } from '../util/buffer';

class DataHeader {
  // version needed to extract
  version = 0;
  // general purpose bit flag
  flags = 0;
  // compression method
  method = 0;
  // modification time (2 bytes time, 2 bytes date)
  time = 0;
  // uncompressed file crc-32 value
  crc = 0;
  // compressed size
  compressedSize = 0;
  // uncompressed size
  size = 0;
  // filename length
  fnameLen = 0;
  // extra field length
  extraLen = 0;

  loadFromBinary(data: Uint8Array) {
    // 30 bytes and should start with "PK\003\004"
    if (readUInt32LE(data, 0) !== Constants.LOCSIG) {
      throw new Error(Errors.INVALID_LOC);
    }

    // version needed to extract
    this.version = readUInt16LE(data, Constants.LOCVER);
    // general purpose bit flag
    this.flags = readUInt16LE(data, Constants.LOCFLG);
    // compression method
    this.method = readUInt16LE(data, Constants.LOCHOW);
    // modification time (2 bytes time, 2 bytes date)
    this.time = readUInt32LE(data, Constants.LOCTIM);
    // uncompressed file crc-32 value
    this.crc = readUInt32LE(data, Constants.LOCCRC);
    // compressed size
    this.compressedSize = readUInt32LE(data, Constants.LOCSIZ);
    // uncompressed size
    this.size = readUInt32LE(data, Constants.LOCLEN);
    // filename length
    this.fnameLen = readUInt16LE(data, Constants.LOCNAM);
    // extra field length
    this.extraLen = readUInt16LE(data, Constants.LOCEXT);
  }
}

export class EntryHeader {
  readonly dataHeader = new DataHeader();

  made = 0x0a;
  version = 0x0a;
  flags = 0;
  method = 0;
  time = dateToTime(new Date());
  crc = 0;
  compressedSize = 0;
  size = 0;
  fileNameLength = 0;
  extraLength = 0;
  commentLength = 0;
  diskNumStart = 0;
  inAttr = 0;
  attr = 0;
  offset = 0;

  // temp flag
  changed = false;

  get isEncrypted() {
    return (this.flags & 0x1) === 0x1;
  }

  get entryHeaderSize() {
    return Constants.CENHDR + this.fileNameLength + this.extraLength + this.commentLength;
  }

  get realDataOffset() {
    return this.offset + Constants.LOCHDR + this.dataHeader.fnameLen + this.dataHeader.extraLen;
  }

  loadDataHeaderFromBinary(input: Uint8Array) {
    const data = input.slice(this.offset, this.offset + Constants.LOCHDR);
    this.dataHeader.loadFromBinary(data);
  }

  loadFromBinary(data: Uint8Array) {
    // data should be 46 bytes and start with "PK 01 02"
    if (data.length !== Constants.CENHDR || readUInt32LE(data, 0) !== Constants.CENSIG) {
      throw new Error(Errors.INVALID_CEN);
    }
    // version made by
    this.made = readUInt16LE(data, Constants.CENVEM);
    // version needed to extract
    this.version = readUInt16LE(data, Constants.CENVER);
    // encrypt, decrypt flags
    this.flags = readUInt16LE(data, Constants.CENFLG);
    // compression method
    this.method = readUInt16LE(data, Constants.CENHOW);
    // modification time (2 bytes time, 2 bytes date)
    this.time = readUInt32LE(data, Constants.CENTIM);
    // uncompressed file crc-32 value
    this.crc = readUInt32LE(data, Constants.CENCRC);
    // compressed size
    this.compressedSize = readUInt32LE(data, Constants.CENSIZ);
    // uncompressed size
    this.size = readUInt32LE(data, Constants.CENLEN);
    // filename length
    this.fileNameLength = readUInt16LE(data, Constants.CENNAM);
    // extra field length
    this.extraLength = readUInt16LE(data, Constants.CENEXT);
    // file comment length
    this.commentLength = readUInt16LE(data, Constants.CENCOM);
    // volume number start
    this.diskNumStart = readUInt16LE(data, Constants.CENDSK);
    // internal file attributes
    this.inAttr = readUInt16LE(data, Constants.CENATT);
    // external file attributes
    this.attr = readUInt32LE(data, Constants.CENATX);
    // LOC header offset
    this.offset = readUInt32LE(data, Constants.CENOFF);
  }

  // your need Constants.LOCHDR size (LOC header size is 30 bytes) buffer space to write
  writeDataHeader(dest: Uint8Array, offset: number) {
    // "PK\003\004"
    writeUInt32LE(dest, Constants.LOCSIG, 0);
    // version needed to extract
    writeUInt16LE(dest, this.version, Constants.LOCVER);
    // general purpose bit flag
    writeUInt16LE(dest, this.flags, Constants.LOCFLG);
    // compression method
    writeUInt16LE(dest, this.method, Constants.LOCHOW);
    // modification time (2 bytes time, 2 bytes date)
    writeUInt32LE(dest, this.time, Constants.LOCTIM);
    // uncompressed file crc-32 value
    writeUInt32LE(dest, this.crc, Constants.LOCCRC);
    // compressed size
    writeUInt32LE(dest, this.compressedSize, Constants.LOCSIZ);
    // uncompressed size
    writeUInt32LE(dest, this.size, Constants.LOCLEN);
    // filename length
    writeUInt16LE(dest, this.fileNameLength, Constants.LOCNAM);
    // extra field length
    writeUInt16LE(dest, this.extraLength, Constants.LOCEXT);
  }

  entryHeaderToBinary(): Uint8Array {
    // CEN header size (46 bytes)
    const data = new Uint8Array(
      Constants.CENHDR + this.fileNameLength + this.extraLength + this.commentLength,
    );
    // "PK\001\002"
    writeUInt32LE(data, Constants.CENSIG, 0);
    // version made by
    writeUInt16LE(data, this.made, Constants.CENVEM);
    // version needed to extract
    writeUInt16LE(data, this.version, Constants.CENVER);
    // encrypt, decrypt flags
    writeUInt16LE(data, this.flags, Constants.CENFLG);
    // compression method
    writeUInt16LE(data, this.method, Constants.CENHOW);
    // modification time (2 bytes time, 2 bytes date)
    writeUInt32LE(data, this.time, Constants.CENTIM);
    // uncompressed file crc-32 value
    writeUInt32LE(data, this.crc, Constants.CENCRC);
    // compressed size
    writeUInt32LE(data, this.compressedSize, Constants.CENSIZ);
    // uncompressed size
    writeUInt32LE(data, this.size, Constants.CENLEN);
    // filename length
    writeUInt16LE(data, this.fileNameLength, Constants.CENNAM);
    // extra field length
    writeUInt16LE(data, this.extraLength, Constants.CENEXT);
    // file comment length
    writeUInt16LE(data, this.commentLength, Constants.CENCOM);
    // volume number start
    writeUInt16LE(data, this.diskNumStart, Constants.CENDSK);
    // internal file attributes
    writeUInt16LE(data, this.inAttr, Constants.CENATT);
    // external file attributes
    writeUInt32LE(data, this.attr, Constants.CENATX);
    // LOC header offset
    writeUInt32LE(data, this.offset, Constants.CENOFF);
    // fill all with
    data.fill(0x0, Constants.CENHDR);
    return data;
  }

  toObject() {
    return {
      made: this.made,
      version: this.version,
      flags: this.flags,
      method: methodToString(this.method),
      time: timeToDate(this.time),
      crc: '0x' + this.crc.toString(16).toUpperCase(),
      compressedSize: this.compressedSize,
      size: this.size,
      fileNameLength: this.fileNameLength,
      extraLength: this.extraLength,
      commentLength: this.commentLength,
      diskNumStart: this.diskNumStart,
      inAttr: this.inAttr,
      attr: this.attr,
      offset: this.offset,
      entryHeaderSize:
        Constants.CENHDR + this.fileNameLength + this.extraLength + this.commentLength,
    };
  }
}

function methodToString(method: number) {
  switch (method) {
    case Constants.STORED:
      return `STORED(${method})`;
    case Constants.DEFLATED:
      return `DEFLATED(${method})`;
    default:
      return `UNSUPPORTED(${method})`;
  }
}

function timeToDate(time: number): Date {
  return new Date(
    ((time >>> 25) & 0x7f) + 1980,
    ((time >>> 21) & 0x0f) - 1,
    (time >>> 16) & 0x1f,
    (time >>> 11) & 0x1f,
    (time >>> 5) & 0x3f,
    (time & 0x1f) << 1,
  );
}

function dateToTime(val: Date): number {
  const date = new Date(val);
  return (
    (((date.getFullYear() - 1980) & 0x7f) << 25) | // b09-16 years from 1980
    ((date.getMonth() + 1) << 21) | // b05-08 month
    (date.getDate() << 16) | // b00-04 hour
    // 2 bytes time
    (date.getHours() << 11) | // b11-15 hour
    (date.getMinutes() << 5) | // b05-10 minute
    (date.getSeconds() >>> 1)
  ); // b00-04 seconds divided by 2
}
