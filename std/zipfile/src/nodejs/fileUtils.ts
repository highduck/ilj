import * as fs from 'fs';
import * as path from 'path';

function mkdirSync(p: string) {
  const sep = path.sep;
  let resolvedPath = p.split(sep)[0];
  for (const name of p.split(sep)) {
    // extract last character from string
    if (!name || name.substr(-1, 1) === ':') {
      continue;
    }
    resolvedPath += sep + name;
    let stat;
    try {
      stat = fs.statSync(resolvedPath);
    } catch (e) {
      fs.mkdirSync(resolvedPath);
    }
    if (stat && stat.isFile()) {
      throw new Error(`There is a file in the way: ${resolvedPath}`);
    }
  }
}

function findSync(dir: string, pattern?: RegExp, recursive = false) {
  let files: string[] = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory() && recursive) {
      files = files.concat(findSync(fullPath, pattern, recursive));
    }
    if (!pattern || pattern.test(fullPath)) {
      files.push(path.normalize(fullPath) + (fs.statSync(fullPath).isDirectory() ? path.sep : ''));
    }
  }
  return files;
}

export function makeDir(p: string): void {
  mkdirSync(p);
}

export function writeFileTo(
  p: string,
  content: Uint8Array,
  overwrite: boolean,
  attr = 438,
): boolean {
  if (fs.existsSync(p)) {
    if (!overwrite) {
      return false; // cannot overwrite
    }

    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      return false;
    }
  }
  const folder = path.dirname(p);
  if (!fs.existsSync(folder)) {
    mkdirSync(folder);
  }

  let fd;
  try {
    fd = fs.openSync(p, 'w', 438); // 0666
  } catch (e) {
    fs.chmodSync(p, 438);
    fd = fs.openSync(p, 'w', 438);
  }
  if (fd) {
    let err = null;
    try {
      fs.writeSync(fd, content, 0, content.byteLength, 0);
    } catch (e) {
      err = e;
    } finally {
      fs.closeSync(fd);
    }
    if (err) {
      throw err;
    }
  }
  fs.chmodSync(p, attr);
  return true;
}

export function writeFileToAsync(
  p: string,
  content: Uint8Array,
  overwrite: boolean,
  attr: undefined | number,
): Promise<boolean> {
  return new Promise((resolve) => {
    const exists = fs.existsSync(p);
    if (exists && !overwrite) {
      resolve(false);
      return;
    }
    fs.stat(p, (err, stat): void => {
      if (exists && stat.isDirectory()) {
        resolve(false);
        return;
      }

      const folder = path.dirname(p);
      if (!fs.existsSync(folder)) {
        mkdirSync(folder);
      }

      fs.open(p, 'w', 438, (err, fd) => {
        if (err) {
          fs.chmod(p, 438, () => {
            fs.open(p, 'w', 438, (err, fd) => {
              fs.write(fd, content, 0, content.byteLength, 0, () => {
                fs.close(fd, () => {
                  fs.chmod(p, attr || 438, () => {
                    resolve(true);
                  });
                });
              });
            });
          });
        } else {
          if (fd) {
            fs.write(fd, content, 0, content.byteLength, 0, () => {
              fs.close(fd, () => {
                fs.chmod(p, attr || 438, () => {
                  resolve(true);
                });
              });
            });
          } else {
            fs.chmod(p, attr || 438, () => {
              resolve(true);
            });
          }
        }
      });
    });
  });
}

export function findFiles(p: string): string[] {
  return findSync(p, undefined, true);
}
