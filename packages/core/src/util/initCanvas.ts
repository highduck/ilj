function resetStyle(el: HTMLElement | null) {
    if (el != null) {
        const style = el.style;
        style.padding = '0'; // '0 !important'
        style.margin = '0'; // '0 !important'
        // style.border = '0 !important';
        // style.boxSizing = 'border-box';
    }
}

export function initCanvas(name = "gameview", parent?: HTMLElement | null): HTMLCanvasElement {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    resetStyle(container);

    const canvas = document.createElement('canvas');
    canvas.id = name;
    canvas.contentEditable = 'false';
    canvas.style.touchAction = 'none';
    canvas.style.webkitTapHighlightColor = 'transparent';
    canvas.style.webkitUserSelect = 'none';
    // canvas.style.msUserSelect = 'none';
    canvas.style.userSelect = 'none';

    // canvas.style.imageRendering = 'optimizeSpeed';
    canvas.style.imageRendering = '-moz-crisp-edges';
    canvas.style.imageRendering = '-o-crisp-edges';
    canvas.style.imageRendering = '-webkit-optimize-contrast';
    canvas.style.imageRendering = 'optimize-contrast';
    canvas.style.imageRendering = 'crisp-edges';
    // canvas.style.imageRendering = 'pixelated';

    // deprecated
    // canvas.style.webkitUserModify = '';
    resetStyle(canvas);
    // -webkit-tap-highlight-color: transparent;
    // -webkit-user-select: none;
    // -moz-user-select: none;
    // -ms-user-select: none;
    // user-select: none;
    container.appendChild(canvas);

    if (parent !== null) {
        if (parent === undefined) {
            parent = document.body;
        }
        parent.appendChild(container);
    }
    return canvas;
}