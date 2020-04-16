// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const assert = process.env.NODE_ENV === 'production' ? (): void => {
} : (condition: any): void => {
    if (!condition) {
        throw new Error("Debug mode assertion");
    }
};