export class ObjectPool<T> {
    objects: T[] = [];
    count = 0;

    constructor(readonly ctor: { new(): T }, initialCount: number) {
        for (let i = 0; i < initialCount; ++i) {
            this.objects[this.count++] = new this.ctor();
        }
    }

    get(): T {
        return this.count > 0 ? this.objects[--this.count] : new this.ctor();
    }

    retain(obj: T) {
        this.objects[this.count++] = obj;
    }
}