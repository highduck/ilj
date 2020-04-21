import {Disposable} from "./Disposable";

export type Listener<T> = (event: T) => void;

/** passes through events as they happen. You will not get events from before you start listening */
export class Signal<T> {

    private readonly listeners: Listener<T>[] = [];
    private onceListeners: Listener<T>[] = [];

    clear() {
        this.listeners.length = 0;
        this.onceListeners.length = 0;
    }

    on(listener: Listener<T>): Disposable {
        this.listeners.push(listener);
        return {
            dispose: (): void => this.off(listener)
        };
    }

    once(listener: Listener<T>): void {
        this.onceListeners.push(listener);
    }

    off(listener: Listener<T>): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    emit(event: T): void {
        /** Update any general listeners */
        for (const listener of this.listeners) {
            listener(event);
        }

        /** Clear the `once` queue */
        if (this.onceListeners.length > 0) {
            const toCall = this.onceListeners;
            this.onceListeners = [];
            for (const listener of toCall) {
                listener(event);
            }
        }
    }

    pipe(te: Signal<T>): Disposable {
        return this.on((e): void => te.emit(e));
    }
}
