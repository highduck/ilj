import { ZipFile } from './ZipFile';
import { ZipEntry } from './ZipEntry';
import { decodeString, toU8s } from './util/buffer';

export class Zip {
  protected readonly _zip: ZipFile;

  constructor(input?: Uint8Array) {
    this._zip = new ZipFile(input);
  }

  /**
   * Extracts the given entry from the archive and returns the content as a Buffer object
   * @param entry String with the full path of the entry
   *
   * @return Buffer or Null in case of error
   */
  readFile(entry: string): Uint8Array | undefined {
    return this.getEntry(entry)?.getData();
  }

  /**
   * Asynchronous readFile
   * @param entry String with the full path of the entry
   *
   * @return Buffer or Null in case of error
   */
  readFileAsync(entry: string): Promise<Uint8Array> {
    const item = this.getEntry(entry);
    if (!item) {
      throw new Error('getEntry failed for:' + entry);
    }
    return item.getDataAsync();
  }

  /**
   * Extracts the given entry from the archive and returns the content as plain text in the given encoding
   * @param entry ZipEntry object or String with the full path of the entry
   * @param encoding Optional. If no encoding is specified utf8 is used
   *
   * @return String
   */
  readAsText(entry: string, encoding?: BufferEncoding): string {
    const data = this.readFile(entry);
    return data !== undefined ? decodeString(data, encoding) : '';
  }

  /**
   * Asynchronous readAsText
   * @param entry ZipEntry object or String with the full path of the entry
   * @param encoding Optional. If no encoding is specified utf8 is used
   *
   * @return String
   */
  async readAsTextAsync(entry: string, encoding?: BufferEncoding): Promise<string> {
    const data = await this.readFileAsync(entry);
    return decodeString(data, encoding);
  }

  /**
   * Remove the entry from the file or the entry and all it's nested directories and files if the given entry is a directory
   *
   * @param entry
   */
  deleteFile(entry: string) {
    // @TODO: test deleteFile
    this._zip.delete(entry);
  }

  /**
   * Sets a comment to the zip. The zip must be rewritten after adding the comment.
   */
  set comment(v: string) {
    // @TODO: test set comment
    this._zip.comment = v;
  }

  /**
   * Returns the zip comment
   */
  get comment() {
    return this._zip.comment;
  }

  /**
   * Adds a comment to a specified zipEntry. The zip must be rewritten after adding the comment
   * The comment cannot exceed 65535 characters in length
   */
  setFileComment(entry: string, comment: string) {
    const item = this._zip.get(entry);
    if (item) {
      item.comment = comment;
    }
  }

  /**
   * Returns the comment of the specified entry
   */
  getFileComment(entry: string): string {
    return this._zip.get(entry)?.comment ?? '';
  }

  /**
   * Updates the content of an existing entry inside the archive. The zip must be rewritten after updating the content
   *
   * @param entry
   * @param content
   */
  updateFile(entry: string, content: Uint8Array) {
    this._zip.get(entry)?.setData(content);
  }

  /**
   * Allows you to create a entry (file or directory) in the zip file.
   * If you want to create a directory the entryName must end in / and a null buffer should be provided.
   * Comment and attributes are optional
   *
   * @param entryName
   * @param content
   * @param comment
   * @param attr
   */
  addFile(entryName: string, content?: string | Uint8Array, comment = '', attr?: number) {
    const entry = new ZipEntry();
    entry.entryName = entryName;
    entry.comment = comment;

    if (attr === undefined) {
      if (entry.isDirectory) {
        // (permissions drwxr-xr-x) + (MS-DOS directory flag)
        attr = (0o40755 << 16) | 0x10;
      } else {
        // permissions -r-wr--r--
        attr = 0o644 << 16;
      }
    }

    content = content ?? new Uint8Array(0);
    entry.attr = attr;
    entry.setData(toU8s(content));
    this._zip.add(entry);
  }

  /**
   * Returns an array of ZipEntry objects representing the files and folders inside the archive
   *
   * @return Array
   */
  getEntries() {
    return this._zip.entries;
  }

  /**
   * Returns a ZipEntry object representing the file or folder specified by ``name``.
   */
  getEntry(name: string): ZipEntry | undefined {
    return this._zip.get(name);
  }

  getEntryCount() {
    return this._zip.getEntryCount();
  }

  forEach(callback: (e: ZipEntry) => void) {
    return this._zip.forEach(callback);
  }

  /**
   * Test the archive
   */
  test(): boolean {
    for (const entry of this._zip.entries) {
      try {
        if (entry.isDirectory) {
          continue;
        }
        entry.getData();
      } catch (err) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns the content of the entire zip file as a Uint8Array object
   */
  getZipData(): Uint8Array {
    return this._zip.compress();
  }

  //todo:
  //toBufferAsync(/**Function=*/onSuccess, /**Function=*/onFail, /**Function=*/onItemStart, /**Function=*/onItemEnd) {
  // this.valueOf = 2;
  // if (typeof onSuccess === "function") {
  //     _zip.toAsyncBuffer(onSuccess, onFail, onItemStart, onItemEnd);
  //     return null;
  // }
  //}
}
