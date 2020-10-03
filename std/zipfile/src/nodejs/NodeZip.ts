import { Zip } from '../Zip';
import * as fs from 'fs';
import * as path from 'path';
import { findFiles, makeDir, writeFileTo } from './fileUtils';
import { ZipEntry } from '../ZipEntry';

const CANT_EXTRACT_FILE = 'Could not extract the file';
const CANT_OVERRIDE = 'Target file already exists';
const NO_ZIP = 'No zip file was loaded';
const NO_ENTRY = "Entry doesn't exist";
const DIRECTORY_CONTENT_ERROR = 'A directory cannot have content';
const FILE_NOT_FOUND = 'File not found: %s';
const INVALID_FILENAME = 'Invalid filename';

function sanitize(prefix: string, name: string) {
  prefix = path.resolve(path.normalize(prefix));
  const parts = name.split('/');
  for (let i = 0, l = parts.length; i < l; ++i) {
    const p = path.normalize(path.join(prefix, parts.slice(i, l).join(path.sep)));
    if (p.indexOf(prefix) === 0) {
      return p;
    }
  }
  return path.normalize(path.join(prefix, path.basename(name)));
}

export class NodeZip extends Zip {
  // load zip file
  static fromFile(filepath: string) {
    if (fs.existsSync(filepath)) {
      return new NodeZip(fs.readFileSync(filepath));
    }
    throw new Error(INVALID_FILENAME);
  }

  constructor(input?: Uint8Array) {
    super(input);
  }

  /**
   * Adds a file from the disk to the archive
   *
   * @param localPath File to add to zip
   * @param zipPath Optional path inside the zip
   * @param zipName Optional name for the file
   */
  addLocalFile(localPath: string, zipPath?: string, zipName?: string) {
    if (!fs.existsSync(localPath)) {
      throw new Error(FILE_NOT_FOUND.replace('%s', localPath));
    }
    if (zipPath) {
      zipPath = zipPath.split('\\').join('/');
      if (zipPath.charAt(zipPath.length - 1) !== '/') {
        zipPath += '/';
      }
    } else {
      zipPath = '';
    }
    const p = localPath.split('\\').join('/').split('/').pop();
    if (zipName) {
      this.addFile(zipPath + zipName, fs.readFileSync(localPath), '', 0);
    } else {
      this.addFile(zipPath + p, fs.readFileSync(localPath), '', 0);
    }
  }

  /**
   * Adds a local directory and all its nested files and directories to the archive
   *
   * @param localPath
   * @param zipPath optional path inside zip
   * @param filter optional RegExp or Function if files match will
   *               be included.
   */
  addLocalFolder(localPath: string, zipPath?: string, filter?: RegExp | ((p?: string) => boolean)) {
    let filterFn: (filename: string) => boolean;
    if (filter === undefined) {
      filterFn = () => true;
    } else if (filter instanceof RegExp) {
      const re = filter;
      filterFn = (filename) => re.test(filename);
    } else {
      filterFn = filter;
    }

    if (zipPath) {
      zipPath = zipPath.split('\\').join('/');
      if (zipPath.charAt(zipPath.length - 1) !== '/') {
        zipPath += '/';
      }
    } else {
      zipPath = '';
    }
    // normalize the path first
    localPath = path.normalize(localPath);
    localPath = localPath.split('\\').join('/'); //windows fix
    if (localPath.charAt(localPath.length - 1) !== '/') localPath += '/';

    if (!fs.existsSync(localPath)) {
      throw new Error(FILE_NOT_FOUND.replace('%s', localPath));
    }

    const items = findFiles(localPath);
    for (const path of items) {
      //windows fix
      let p = path.split('\\').join('/');
      p = p.replace(new RegExp(localPath.replace(/(\(|\))/g, '\\$1'), 'i'), '');
      if (filterFn(p)) {
        if (p.charAt(p.length - 1) !== '/') {
          this.addFile(zipPath + p, fs.readFileSync(path), '', 0);
        } else {
          this.addFile(zipPath + p, Buffer.alloc(0), '', 0);
        }
      }
    }
  }

  /**
   * Asynchronous addLocalFile
   * @param localPath
   * @param callback
   * @param zipPath optional path inside zip
   * @param filter optional RegExp or Function if files match will
   *               be included.
   */
  // addLocalFolderAsync(localPath: string, /*Function*/callback:, /*String*/zipPath, /*RegExp|Function*/filter) {
  //     if (filter === undefined) {
  //         filter = function () {
  //             return true;
  //         };
  //     } else if (filter instanceof RegExp) {
  //         filter = function (filter) {
  //             return function (filename) {
  //                 return filter.test(filename);
  //             }
  //         }(filter);
  //     }
  //
  //     if (zipPath) {
  //         zipPath = zipPath.split("\\").join("/");
  //         if (zipPath.charAt(zipPath.length - 1) !== "/") {
  //             zipPath += "/";
  //         }
  //     } else {
  //         zipPath = "";
  //     }
  //     // normalize the path first
  //     localPath = pth.normalize(localPath);
  //     localPath = localPath.split("\\").join("/"); //windows fix
  //     if (localPath.charAt(localPath.length - 1) !== "/")
  //         localPath += "/";
  //
  //     var self = this;
  //     fs.open(localPath, 'r', function (err, fd) {
  //         if (err && err.code === 'ENOENT') {
  //             callback(undefined, Utils.Errors.FILE_NOT_FOUND.replace("%s", localPath));
  //         } else if (err) {
  //             callback(undefined, err);
  //         } else {
  //             var items = findFiles(localPath);
  //             var i = -1;
  //
  //             var next = function () {
  //                 i += 1;
  //                 if (i < items.length) {
  //                     var p = items[i].split("\\").join("/").replace(new RegExp(localPath.replace(/(\(|\))/g, '\\$1'), 'i'), ""); //windows fix
  //                     p = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '') // accent fix
  //                     if (filter(p)) {
  //                         if (p.charAt(p.length - 1) !== "/") {
  //                             fs.readFile(items[i], function (err, data) {
  //                                 if (err) {
  //                                     callback(undefined, err);
  //                                 } else {
  //                                     self.addFile(zipPath + p, data, '', 0);
  //                                     next();
  //                                 }
  //                             })
  //                         } else {
  //                             self.addFile(zipPath + p, Buffer.alloc(0), "", 0);
  //                             next();
  //                         }
  //                     } else {
  //                         next();
  //                     }
  //
  //                 } else {
  //                     callback(true, undefined);
  //                 }
  //             }
  //
  //             next();
  //         }
  //     });
  // }

  /**
   * Extracts the given entry to the given targetPath
   * If the entry is a directory inside the archive, the entire directory and it's subdirectories will be extracted
   *
   * @param entry ZipEntry object or String with the full path of the entry
   * @param targetPath Target folder where to write the file
   * @param maintainEntryPath If maintainEntryPath is true and the entry is inside a folder, the entry folder
   *                          will be created in targetPath as well. Default is TRUE
   * @param overwrite If the file already exists at the target path, the file will be overwritten if this is true.
   *                  Default is FALSE
   *
   * @return Boolean
   */
  extractEntryTo(
    entry: string | ZipEntry,
    targetPath: string,
    maintainEntryPath = true,
    overwrite = false,
  ) {
    const item = typeof entry === 'string' ? this.getEntry(entry) : entry;
    if (!item) {
      throw new Error(NO_ENTRY);
    }

    const entryName = item.entryName;
    const target = sanitize(targetPath, maintainEntryPath ? entryName : path.basename(entryName));

    if (item.isDirectory) {
      //target = path.resolve(target, "..");
      for (const child of this._zip.getChildren(item)) {
        if (child.isDirectory) {
          continue;
        }
        const content = child.getData();
        if (!content) {
          throw new Error(CANT_EXTRACT_FILE);
        }
        const childName = sanitize(
          targetPath,
          maintainEntryPath ? child.entryName : path.basename(child.entryName),
        );
        writeFileTo(childName, content, overwrite);
      }
      return true;
    }

    const content = item.getData();
    if (!content) {
      throw new Error(CANT_EXTRACT_FILE);
    }

    if (fs.existsSync(target) && !overwrite) {
      throw new Error(CANT_OVERRIDE);
    }

    writeFileTo(target, content, overwrite);
    return true;
  }

  /**
   * Extracts the entire archive to the given location
   *
   * @param targetPath Target location
   * @param overwrite If the file already exists at the target path, the file will be overwriten if this is true.
   *                  Default is FALSE
   */
  extractAllTo(targetPath: string, overwrite = false) {
    if (!this._zip) {
      throw new Error(NO_ZIP);
    }
    for (const e of this._zip.entries) {
      const entryName = sanitize(targetPath, e.entryName);
      if (e.isDirectory) {
        makeDir(entryName);
        continue;
      }
      const content = e.getData();
      if (!content) {
        throw new Error(CANT_EXTRACT_FILE);
      }
      writeFileTo(entryName, content, overwrite);
      try {
        fs.utimesSync(entryName, e.entryHeader.time, e.entryHeader.time);
      } catch (err) {
        throw new Error(CANT_EXTRACT_FILE);
      }
    }
  }

  /**
   * Asynchronous extractAllTo
   *
   * @param targetPath Target location
   * @param overwrite If the file already exists at the target path, the file will be overwritten if this is true.
   *                  Default is FALSE
   * @param callback
   */
  // async extractAllToAsync(targetPath:string, overwrite:boolean):Promise<undefined> {
  //     overwrite = overwrite || false;
  //     if (!this._zip) {
  //         throw new Error(errors.NO_ZIP);
  //     }
  //
  //     const entries = this._zip.entries;
  //     let i = entries.length;
  //     entries.forEach((entry)=> {
  //         if (i <= 0) {
  //             // Had an error already
  //             return;
  //         }
  //
  //         const entryName = path.normalize(entry.entryName);
  //
  //         if (entry.isDirectory) {
  //             makeDir(sanitize(targetPath, entryName));
  //             if (--i === 0) {
  //                 callback(undefined);
  //             }
  //             return;
  //         }
  //         entry.getDataAsync(function (content, err) {
  //             if (i <= 0) return;
  //             if (err) {
  //                 callback(new Error(err));
  //                 return;
  //             }
  //             if (!content) {
  //                 i = 0;
  //                 callback(new Error(Utils.Errors.CANT_EXTRACT_FILE));
  //                 return;
  //             }
  //
  //             Utils.writeFileToAsync(sanitize(targetPath, entryName), content, overwrite, function (succ) {
  //                 try {
  //                     fs.utimesSync(pth.resolve(targetPath, entryName), entry.header.time, entry.header.time);
  //                 } catch (err) {
  //                     callback(new Error('Unable to set utimes'));
  //                 }
  //                 if (i <= 0) return;
  //                 if (!succ) {
  //                     i = 0;
  //                     callback(new Error('Unable to write'));
  //                     return;
  //                 }
  //                 if (--i === 0)
  //                     callback(undefined);
  //             });
  //         });
  //     })
  // }
  /**
   * Writes the newly created zip file to disk at the specified location or if a zip was opened and no ``targetFileName`` is provided, it will overwrite the opened zip
   *
   * @param targetFileName
   */
  writeZip(targetFileName: string) {
    const zipData = this._zip.compress();
    const ok = writeFileTo(targetFileName, zipData, true);
    if (!ok) {
      throw new Error('failed');
    }
  }
}
