async function loadUrl(url: string, type: 'arraybuffer' | 'text'): Promise<XMLHttpRequest> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = type;
        xhr.onload = () => {
            console.debug("xhr.onload " + xhr.readyState + " " + xhr.statusText + " " + xhr.status);
            if (xhr.readyState == 4 && (xhr.status == 0 || (xhr.status >= 200 && xhr.status < 300))) {
                resolve(xhr);
            } else {
                console.error("xhr.onerror: " + xhr.statusText);
                reject("xhr.onload rejected: " + xhr.statusText);
            }
        };
        xhr.onerror = (e) => {
            console.error("xhr.onerror: " + xhr.statusText);
            reject("XHR error: " + xhr.statusText);
        };
        xhr.open("GET", url, true);
        xhr.send();
    });
}

export async function loadBuffer(url: string): Promise<ArrayBuffer> {
    const xhr = await loadUrl(url, 'arraybuffer');
    return xhr.response as ArrayBuffer;
}

export async function loadJSON(url: string): Promise<object> {
    const xhr = await loadUrl(url, 'text');
    return JSON.parse(xhr.responseText);
}

export async function loadText(url: string): Promise<string> {
    const xhr = await loadUrl(url, 'text');
    return xhr.responseText;
}