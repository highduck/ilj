export class ObjectCoolArray<T extends object> {
    count = 0;
    list: T[] = [];

    constructor() {

    }

    clear() {
        this.count = 0;
    }

    push(v: T) {
        if (this.count < this.list.length) {
            this.list[this.count] = v;
            ++this.count;
        } else {
            this.list.push(v);
            ++this.count;
        }
    }

    back(): T {
        return this.get(this.count - 1);
    }

    private _checkIndex(i: number) {
        // if (i < 0 || i >= this.list.length || i >= this.count) {
        //     throw new Error('out of bounds');
        // }
    }

    get(i: number): T {
        this._checkIndex(i);
        return this.list[i];
    }

    remove(i: number) {
        this._checkIndex(i);
        this.list.splice(i, 1);
        --this.count;
    }

    setBack(element: T) {
        this.set(this.count - 1, element);
    }

    private set(i: number, element: T) {
        this._checkIndex(i);
        this.list[i] = element;
    }
}

export class F32Vector {
    count = 0;
    data: Float32Array;

    constructor(reserved: number) {
        this.data = new Float32Array(reserved);
    }

    clear() {
        this.count = 0;
    }

    _grow() {
        const data = this.data;
        this.data = new Float32Array(this.count << 1);
        this.data.set(data);
    }

    push(v: number) {
        if (this.count >= this.data.length) {
            this._grow();
        }
        this.data[this.count++] = v;
    }

    get(index: number): number {
        return this.data[index];
    }
}