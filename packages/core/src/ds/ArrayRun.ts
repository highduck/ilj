export class ArrayRun<T> {

    readonly values: T[] = [];
    size = 0;

    alloc(): T | undefined {
        return this.size < this.values.length ? this.values[this.size++] : undefined;
    }

    restart() {
        this.size = 0;
    }

    push(data: T) {
        this.values[this.size++] = data;
    }
}