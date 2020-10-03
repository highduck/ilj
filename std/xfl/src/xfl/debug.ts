export function logDebug(...args: any[]) {
    console.info(...args);
}

export function logWarning(...args: any[]) {
    console.warn(...args);
}

export function logError(...args: any[]) {
    console.error(...args);
}

export function logAssert(val: any, message?: string, ...data: any[]) {
    console.assert(val, message, ...data);
}