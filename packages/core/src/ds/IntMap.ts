export class IntMap<T> {

    readonly values: Array<T> = [];
    readonly keys: Array<number> = [];
    // readonly map: Map<number, number> = new Map();
    readonly map: Array<number | undefined> = [];

    get size(): number {
        return this.keys.length;
    }

    set(key: number, value: T) {
        let idx = this.map[key];
        if (idx === undefined) {
            idx = this.keys.length;
            this.map[key] = idx;
            this.keys[idx] = key;
        }
        this.values[idx] = value;
    }

    get(key: number): T | undefined {
        const idx = this.map[key];
        return idx !== undefined ? this.values[idx] : undefined;
    }

    delete(key: number) {
        const idx = this.map[key];
        if (idx !== undefined) {
            const back = this.keys.length - 1;
            if (idx < back) {
                const backKey = this.keys[idx] = this.keys[back];
                this.values[idx] = this.values[back];
                this.map[backKey] = idx;
            }
            this.keys.length = this.values.length = back;
            this.map[key] = undefined;
        }
    }

    has(key: number): boolean {
        return this.map[key] !== undefined;
    }

    clear() {
        this.keys.length = 0;
        this.values.length = 0;
        this.map.length = 0;
    }
}