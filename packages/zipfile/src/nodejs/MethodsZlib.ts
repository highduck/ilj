import * as zlib from 'zlib';

function getChunkSize(buffer: ArrayBufferView): number {
    return (Math.trunc(buffer.byteLength / 1024) + 1) * 1024;
}

export function deflate(buffer: Uint8Array): Buffer {
    return zlib.deflateRawSync(buffer, {
        chunkSize: getChunkSize(buffer)
    });
}

export function deflateAsync(buffer: Uint8Array): Promise<Uint8Array> {
    return new Promise((resolve) => {
        const tmp = zlib.createDeflateRaw({
            chunkSize: getChunkSize(buffer)
        });
        const parts: Uint8Array[] = [];
        let total = 0;
        tmp.on('data', (data: any) => {
            const part = new Uint8Array(data);
            parts.push(part);
            total += part.length;
        });
        tmp.on('end', () => {
            const buf = new Uint8Array(total);
            let written = 0;
            for (const part of parts) {
                buf.set(part, written);
                written += part.length;
            }
            resolve(buf);
        });
        tmp.end(buffer);
    });
}

export function inflate(buffer: Uint8Array): Uint8Array {
    return zlib.inflateRawSync(buffer);
}

export function inflateAsync(buffer: Uint8Array): Promise<Uint8Array> {
    return new Promise((resolve) => {
        const tmp = zlib.createInflateRaw();
        const parts: Uint8Array[] = [];
        let total = 0;
        tmp.on('data', (data: any) => {
            const part = new Uint8Array(data);
            parts.push(part);
            total += part.length;
        });
        tmp.on('end', () => {
            const buf = new Uint8Array(total);
            let written = 0;
            for (const part of parts) {
                buf.set(part, written);
                written += part.length;
            }
            resolve(buf);
        });
        tmp.end(buffer);
    });
}