export class ArrayRun<T extends object> {

    size = 0;
    readonly values: T[] = [];

    alloc(): T | null {
        return this.size < this.values.length ? this.values[this.size++] : null;
    }

    restart() {
        this.size = 0;
    }

    push(data: T) {
        this.values[this.size++] = data;
    }
}