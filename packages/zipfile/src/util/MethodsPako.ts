import pako from 'pako';

export function deflate(buffer: Uint8Array): Uint8Array {
    return pako.deflateRaw(buffer);
}

export function deflateAsync(buffer: Uint8Array): Promise<Uint8Array> {
    return Promise.resolve(deflate(buffer));
}

export function inflate(buffer: Uint8Array): Uint8Array {
    return pako.inflateRaw(buffer);
}

export function inflateAsync(buffer: Uint8Array): Promise<Uint8Array> {
    return Promise.resolve(inflate(buffer));
}