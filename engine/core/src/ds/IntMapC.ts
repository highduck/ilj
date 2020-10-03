// // class S16Vector {
// //     readonly buffer:Int16Array;
// //     length = 0;
// //     constructor(capacity:number) {
// //         this.buffer = new Int16Array(capacity);
// //         this.buffer.fill(-1);
// //     }
// // }
//
// class ConstArray<T> {
//     buffer: T[] = [];
//     length = 0;
//
//     constructor(init: T, capacity: number) {
//         for (let i = 0; i < capacity; ++i) {
//             this.buffer.push(init);
//         }
//     }
//
//     get(i: number) {
//         return this.buffer[i];
//     }
// }
//
// export class IntMapC<T extends object> {
//
//     readonly values = new ConstArray<T>(null, 1000);
//     readonly keys = new ConstArray<number>(0, 1000);
//     readonly map: Map<number, number> = new Map();
//
//     // get size(): number {
//     //     return this.keys.length;
//     // }
//
//     constructor() {
//     }
//
//     set(key: number, value: T) {
//         const k = key | 0;
//         if (this.map.has(k)) {
//             // const cc = this.map.get(key);
//             // if(!Number.isInteger(cc!) || cc! < 0 || cc! >= this.values.length) {
//             //     throw new Error('sss');
//             // }
//             this.values[this.map.get(k)!] = value;
//         } else {
//             const idx = this.values.length;
//             this.map.set(k, idx);
//             this.keys[idx] = k;
//             this.values[idx] = value;
//             ++this.size;
//         }
//     }
//
//     get(key: number): T | undefined {
//         const k = key | 0;
//         // const idx = this.map[key];
//         return this.map.has(k) ? this.values[this.map.get(k)! | 0] : undefined;
//         // const idx = this.map.get(key);
//         // return idx !== undefined ? this.values[idx] : undefined;
//     }
//
//     unsafe_get(key: number): T {
//         return this.values[this.map.get(key | 0)! | 0];
//     }
//
//     delete(key: number) {
//         // const idx = this.map[key];
//         const k = key | 0;
//         if (this.map.has(k)) {
//             const idx = this.map.get(k)!;
//             const back = --this.size;
//             if (idx < back) {
//                 const backKey = this.keys[back];
//                 this.keys[idx] = backKey;
//                 this.values[idx] = this.values[back];
//                 // this.map[backKey] = idx;
//                 this.map.set(backKey, idx);
//             }
//             // this.map[key] = undefined;
//             this.map.delete(k);
//         }
//     }
//
//     // very unsafe
//     getAndDelete(key: number): T {
//         const k = key | 0;
//         // const idx = this.map[key]!;
//         const idx = this.map.get(k)!;
//         const removed = this.values[idx]!;
//         const back = --this.size;
//         if (idx < back) {
//             const backKey = this.keys[back];
//             this.keys[idx] = backKey;
//             this.values[idx] = this.values[back];
//             // this.map[backKey] = idx;
//             this.map.set(backKey, idx);
//         }
//         // this.map[key] = undefined;
//         this.map.delete(k);
//         return removed;
//     }
//
//     has(key: number): boolean {
//         return this.map.has(key | 0);
//     }
//
//     clear() {
//         this.size = 0;
//         this.map.clear();
//     }
// }