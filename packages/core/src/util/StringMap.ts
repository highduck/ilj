export class StringMap<T> {

    readonly values: Array<T> = [];
    //readonly keys: Array<number> = [];
    readonly map: Map<string, number> = new Map();

    get size(): number {
        return this.values.length;
    }

    set(key: string, value: T) {
        const idx = this.map.get(key);
        if (idx === undefined) {
            this.map.set(key, this.values.length);
            // this.keys.push(key);
            this.values.push(value);
        }
    }

    get(key: string): T | undefined {
        const idx = this.map.get(key);
        if (idx !== undefined) {
            return this.values[idx];
        }
        return undefined;
    }

    // delete(key: string) {
    //     const idx = this.map.get(key);
    //     if (idx !== undefined) {
    //         const back = this.keys.length - 1;
    //         if (idx < back) {
    //             const backKey = this.keys[idx] = this.keys[back];
    //             this.values[idx] = this.values[back];
    //             this.map.set(backKey, idx);
    //         }
    //         this.keys.length = this.values.length = back;
    //         this.map.delete(key);
    //     }
    // }

    has(key: string): boolean {
        return this.map.has(key);
    }

    clear() {
        // this.keys.length = 0;
        this.values.length = 0;
        this.map.clear();
    }
}