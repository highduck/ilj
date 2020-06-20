// Unused!
//
// import * as fs from "fs";
// import {Stats} from "fs";
// import * as pth from "path";
//
// class _FileAttributes {
//
//     isDirectory = false;
//     isReadOnly = false;
//     isHidden = false;
//     isExecutable = false;
//     mTime = 0;
//     aTime = 0;
//
//     _permissions = 0;
//     _stat: undefined | Stats = undefined;
//
//     constructor(readonly path: string) {
//         if (!fs.existsSync(path)) {
//             console.warn("Invalid path: " + path);
//             return;
//         }
//         this._stat = fs.statSync(path);
//         this.isDirectory = this._stat.isDirectory();
//         this.mTime = +this._stat.mtime;
//         this.aTime = +this._stat.atime;
//         this.isExecutable = ((this._stat.mode & 0o777) & 0o100) !== 0;
//         this.isReadOnly = ((this._stat.mode & 0o777) & 0o200) === 0;
//         this.isHidden = pth.basename(path)[0] === ".";
//     }
//
//     decodeAttributes(val: any) {
//
//     }
//
//     encodeAttributes(val: any) {
//
//     }
//
//     toString() {
//         return `{
//     path: ${this.path},
//     isDirectory: ${this.isDirectory},
//     isReadOnly: ${this.isReadOnly},
//     isHidden: ${this.isHidden},
//     isExecutable: ${this.isExecutable},
//     mTime: ${this.mTime},
//     aTime: ${this.aTime}
// }`;
//     }
// }