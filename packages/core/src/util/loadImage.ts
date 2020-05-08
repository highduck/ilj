export async function loadImage(src: string): Promise<HTMLImageElement> {
    const image = new Image();
    const promise = new Promise<HTMLImageElement>((resolve) => {
        image.onload = () => {
            image.onload = null;
            resolve(image);
        };
    });
    image.src = src;
    return promise;
}

export async function loadSplitAlpha(src: string, maskSrc: string): Promise<HTMLCanvasElement> {
    const [image, mask] = await Promise.all([loadImage(src), loadImage(maskSrc)]);

    const canvas = document.createElement('canvas');
    canvas.width = mask.width;
    canvas.height = mask.height;
    const ctx = canvas.getContext('2d', {alpha: true});
    if (!ctx) {
        throw new Error('load images error');
    }
    ctx.drawImage(mask, 0, 0);
    const maskPixels = ctx.getImageData(0, 0, mask.width, mask.height);

    destroyImage(mask);

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const imagePixels = ctx.getImageData(0, 0, image.width, image.height);
    destroyImage(image);

    for (let i = 0; i < maskPixels.data.length; i += 4) {
        imagePixels.data[i + 3] = maskPixels.data[i];
    }
    ctx.putImageData(imagePixels, 0, 0);

    return canvas;
}

export function destroyImage(img: HTMLImageElement) {
    img.src = '';
    img.remove();
}

export function destroyCanvas(canvas: HTMLCanvasElement) {
    canvas.width = 0;
    canvas.height = 0;
    canvas.remove();
}