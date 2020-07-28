// export class IntMap<T> {
//
//     readonly values: Array<T> = [];
//     readonly keys: Array<number> = [];
//     readonly map: Map<number, number> = new Map();
//
//     // readonly map: Array<number | undefined> = [];
//
//     get size(): number {
//         return this.keys.length;
//     }
//
//     set(key: number, value: T) {
//         // let idx = this.map[key];
//         let idx = this.map.get(key);
//         if (idx === undefined) {
//             idx = this.keys.length;
//             // this.map[key] = idx;
//             this.map.set(key, idx);
//             this.keys[idx] = key;
//         }
//         this.values[idx] = value;
//     }
//
//     get(key: number): T | undefined {
//         // const idx = this.map[key];
//         if (this.map.has(key)) {
//             return this.values[this.map.get(key)];
//         }
//         return undefined;
//
//         // const idx = this.map.get(key);
//         // return idx !== undefined ? this.values[idx] : undefined;
//     }
//
//     delete(key: number) {
//         // const idx = this.map[key];
//         const idx = this.map.get(key);
//         if (idx !== undefined) {
//             const back = this.keys.length - 1;
//             if (idx < back) {
//                 const backKey = this.keys[idx] = this.keys[back];
//                 this.values[idx] = this.values[back];
//                 // this.map[backKey] = idx;
//                 this.map.set(backKey, idx);
//             }
//             this.keys.length = this.values.length = back;
//             // this.map[key] = undefined;
//             this.map.delete(key);
//         }
//     }
//
//     // very unsafe
//     getAndDelete(key: number): T {
//         // const idx = this.map[key]!;
//         const idx = this.map.get(key)!;
//         const removed = this.values[idx]!;
//         const back = this.keys.length - 1;
//         if (idx < back) {
//             const backKey = this.keys[idx] = this.keys[back];
//             this.values[idx] = this.values[back];
//             // this.map[backKey] = idx;
//             this.map.set(backKey, idx);
//         }
//         this.keys.length = this.values.length = back;
//         // this.map[key] = undefined;
//         this.map.delete(key);
//         return removed;
//     }
//
//     has(key: number): boolean {
//         // return this.map[key] !== undefined;
//         return this.map.has(key);
//     }
//
//     clear() {
//         this.keys.length = 0;
//         this.values.length = 0;
//         // this.map.length = 0;
//         this.map.clear();
//     }
// }


export class IntMap<T> {

    readonly values: Array<T> = [];
    readonly keys: Array<number> = [0];
    readonly map: Map<number, number> = new Map();

    get size(): number {
        return this.keys.length;
    }

    constructor() {
        this.keys.length = 0;
        this.map.set(0, 0);
        this.map.delete(0);
    }

    set(key: number, value: T) {
        const k = key | 0;
        if (this.map.has(k)) {
            // const cc = this.map.get(key);
            // if(!Number.isInteger(cc!) || cc! < 0 || cc! >= this.values.length) {
            //     throw new Error('sss');
            // }
            this.values[this.map.get(k)!] = value;
        } else {
            const idx = this.keys.length;
            this.map.set(k, idx);
            this.keys.push(k);
            this.values.push(value);
        }
    }

    get(key: number): T | undefined {
        const k = key | 0;
        // const idx = this.map[key];
        return this.map.has(k) ? this.values[this.map.get(k)! | 0] : undefined;
        // const idx = this.map.get(key);
        // return idx !== undefined ? this.values[idx] : undefined;
    }

    unsafe_get(key: number): T {
        return this.values[this.map.get(key | 0)! | 0];
    }

    delete(key: number) {
        // const idx = this.map[key];
        const k = key | 0;
        if (this.map.has(k)) {
            const idx = this.map.get(k)! | 0;
            const back = this.keys.length - 1;
            if (idx < back) {
                const backKey = this.keys[idx] = this.keys[back] | 0;
                this.values[idx] = this.values[back];
                // this.map[backKey] = idx;
                this.map.set(backKey, idx);
            }
            this.keys.length = back;
            this.values.length = back;
            this.map.delete(k);
        }
    }

    // very unsafe
    getAndDelete(key: number): T {
        const k = key | 0;
        // const idx = this.map[key]!;
        const idx = this.map.get(k)! | 0;
        const removed = this.values[idx]!;
        const back = this.keys.length - 1;
        if (idx < back) {
            const backKey = this.keys[idx] = this.keys[back] | 0;
            this.values[idx] = this.values[back];
            // this.map[backKey] = idx;
            this.map.set(backKey, idx);
        }
        this.keys.length = back;
        this.values.length = back;
        this.map.delete(k);
        return removed;
    }

    has(key: number): boolean {
        // return this.map[key] !== undefined;
        return this.map.has(key | 0);
    }

    clear() {
        this.keys.length = 0;
        this.values.length = 0;
        // this.map.length = 0;
        this.map.clear();
    }
}