// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assert(condition: any | undefined): void {
    if (!!DEBUG) {
        if (!condition) {
            throw new Error("Debug mode assertion");
        }
    }
}