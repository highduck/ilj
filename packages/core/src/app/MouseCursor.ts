export const enum Cursor {
    Bypass = 0,
    Arrow = 1,
    Button = 2,
}

const cursorTypeValues = ["default", "default", "pointer"];

export class MouseCursor {

    private _cursor = Cursor.Arrow;

    constructor(private _canvas: HTMLCanvasElement) {
    }

    set(v: Cursor) {
        if (process.env.PLATFORM === 'web' && this._cursor !== Cursor.Bypass) {
            if (this._cursor !== v) {
                this._canvas.style.cursor = cursorTypeValues[v];
                this._cursor = v;
            }
        }
    }

    get(): Cursor {
        return this._cursor;
    }
}
