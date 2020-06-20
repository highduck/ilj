import {Rect, Vec2} from "@highduck/math";
import {Signal} from "../util/Signal";

export const enum Cursor {
    Arrow = "default",
    Button = "pointer",
}

/* GameView: creates graphics context, handle view resize, provide input events */
export class GameView {

    set cursor(v: Cursor) {
        this.canvas.style.cursor = v;
    }

    get cursor(): Cursor {
        return this.canvas.style.cursor as Cursor;
    }

    readonly canvas: HTMLCanvasElement;

    readonly onResize = new Signal<void>();

    // size properties

    // reference-designed size
    readonly reference = new Rect();
    // drawing back-buffer size
    readonly drawable = new Rect(0, 0, 1, 1);
    // virtual point size
    readonly client = new Rect(0, 0, 1, 1);

    // limit for x3, x4 displays
    dprLimit = 4;

    // drawing / virtual
    dpr = 1;

    // drawing / referenced
    contentScale = 1;

    // visibility
    private _visible = false;

    get visible(): boolean {
        return this._visible;
    }

    constructor(canvas: HTMLCanvasElement, size: Vec2,
                readonly maxBackBufferSize: number) {
        this.canvas = canvas;
        this.reference.width = size.x;
        this.reference.height = size.y;

        this.handleResize = this.handleResize.bind(this);
        this.handleVisibility = this.handleVisibility.bind(this);

        window.addEventListener('resize', this.handleResize, false);
        // window.addEventListener('orientationchange', this.handleResize, false);
        this.canvas.addEventListener('resize', this.handleResize, false);
        this.handleResize();

        document.addEventListener("visibilitychange", this.handleVisibility, false);
        this.handleVisibility();

        // justify size on screen mode changes
        // window.setInterval(this.handleResize, 1000);
    }

    handleVisibility() {
        this._visible = !document.hidden;
    }

    update(): boolean {
        const client = this.client;
        const drawable = this.drawable;
        const reference = this.reference;
        const container = this.canvas.parentElement as HTMLElement;

        let dpr = Math.min(this.dprLimit, window.devicePixelRatio);
        const rc = container.getBoundingClientRect();
        const containerWidth = rc.width;
        const containerHeight = rc.height;

        const aspect = reference.width / reference.height;
        let w = containerWidth;
        let h = containerHeight;
        let x = 0;
        let y = 0;

        if (reference.width > reference.height) {
            h = Math.min(h, w / aspect);
            y = (containerHeight - h) / 2;
        } else {
            w = Math.min(w, h * aspect);
            x = (containerWidth - w) / 2;
        }

        let drawableWidth = (w * dpr) | 0;
        let drawableHeight = (h * dpr) | 0;

        /// scale down start
        let scaleDown = 1;
        const maxSize = this.maxBackBufferSize;
        if (drawableWidth > maxSize) {
            scaleDown = maxSize / drawableWidth;
        }
        if (drawableHeight > maxSize) {
            scaleDown = Math.min(scaleDown, maxSize / drawableHeight);
        }

        if (scaleDown < 1) {
            dpr *= scaleDown;
            drawableWidth = Math.min(maxSize, (w * dpr) | 0);
            drawableHeight = Math.min(maxSize, (h * dpr) | 0);
        }

        /// scale down end

        let sizeChanged = false;

        if (this.canvas.width !== drawableWidth || this.canvas.height !== drawableHeight || dpr !== this.dpr) {

            drawable.width = drawableWidth;
            drawable.height = drawableHeight;
            client.width = w;
            client.height = h;
            this.dpr = dpr;

            this.applyCanvasSize();
            sizeChanged = true;
        }

        if (client.x !== x || client.y !== y) {
            client.x = x;
            client.y = y;
            this.applyCanvasOffset();
        }

        this.contentScale = reference.width < reference.height ?
            (drawable.width / reference.width) :
            (drawable.height / reference.height);

        return sizeChanged;
    }

    private handleResize() {
        // console.debug("handle resize");
        if (this.update()) {
            this.onResize.emit();
        }
    }

    private applyCanvasSize() {
        this.canvas.width = this.drawable.width;
        this.canvas.height = this.drawable.height;
        this.canvas.style.width = this.client.width + "px";
        this.canvas.style.height = this.client.height + "px";
        // console.debug("Resize Canvas Style attributes");
    }

    private applyCanvasOffset() {
        this.canvas.style.transform = `translate(${this.client.x}px,${this.client.y}px)`;
        this.canvas.style.willChange = 'transform';
        // console.debug("Update Canvas position");
    }
}
