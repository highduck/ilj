export class IntMap<T> {

    readonly values: Array<T> = [];
    readonly keys: Array<number> = [];
    readonly map: Map<number, number> = new Map();

    get size(): number {
        return this.keys.length;
    }

    set(key: number, value: T) {
        const idx = this.map.get(key);
        if (idx === undefined) {
            this.map.set(key, this.keys.length);
            this.keys.push(key);
            this.values.push(value);
        }
    }

    get(key: number): T | undefined {
        const idx = this.map.get(key);
        return idx !== undefined ? this.values[idx] : undefined;
    }

    delete(key: number) {
        const idx = this.map.get(key);
        if (idx !== undefined) {
            const back = this.keys.length - 1;
            if (idx < back) {
                const backKey = this.keys[idx] = this.keys[back];
                this.values[idx] = this.values[back];
                this.map.set(backKey, idx);
            }
            this.keys.length = this.values.length = back;
            this.map.delete(key);
        }
    }

    has(key: number): boolean {
        return this.map.has(key);
    }

    clear() {
        this.keys.length = 0;
        this.values.length = 0;
        this.map.clear();
    }
}