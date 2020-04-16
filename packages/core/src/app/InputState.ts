import {Signal} from "../util/Signal";

export class AppMouseEvent {
    constructor(public type: string = "",
                public x: number = 0,
                public y: number = 0,
                public wheel: number = 0,
                public button: number = 0) {
    }
}

export class AppTouchEvent {
    constructor(public type: string = "",
                public id: number = 0,
                public x: number = 0,
                public y: number = 0) {
    }
}

export class AppKeyboardEvent {
    constructor(public type: string = "",
                public code: string = "",
                public key: string = "",
                public repeat = false) {
    }
}

const TMP_MOUSE_EVENT = new AppMouseEvent();
const TMP_TOUCH_EVENT = new AppTouchEvent();
const TMP_KEYBOARD_EVENT = new AppKeyboardEvent();

export class InputState {

    dpr = 1;

    readonly onMouse = new Signal<AppMouseEvent>();
    readonly onTouch = new Signal<AppTouchEvent>();
    readonly onKeyboard = new Signal<AppKeyboardEvent>();

    private readonly keyState = new Set<string>();
    private readonly keyDown = new Set<string>();
    private readonly keyUp = new Set<string>();

    touchDown = false;
    touchUp = false;

    mouseState = false;
    mouseDown = false;
    mouseUp = false;

    constructor(private readonly canvas: HTMLCanvasElement) {
        const add = canvas.addEventListener;
        const mouse = (e: MouseEvent) => this.handleMouse(e);
        add("mousedown", mouse);
        add("mouseup", mouse);
        add("mousemove", mouse);
        add("mouseleave", mouse);
        add("mouseenter", mouse);
        add("mouseover", mouse);
        add("wheel", mouse);

        const touch = (e: TouchEvent) => this.handleTouch(e);
        add("touchstart", touch, false);
        add("touchmove", touch, false);
        add("touchend", touch, false);
        add("touchcancel", touch, false);

        const doc = document.addEventListener;
        const key = (e: KeyboardEvent) => this.handleKeyboard(e);
        doc("keypress", key);
        doc("keydown", key);
        doc("keyup", key);

        const ignoreEvent = (e: Event) => {
            const t = e.target;
            if (t === canvas || t === canvas.parentNode) {
                e.preventDefault();
                return false;
            }
            return true;
        };

        // document.body.addEventListener('touchstart', function(e) {
        //     if (e && e.preventDefault) { e.preventDefault(); }
        //     if (e && e.stopPropagation) { e.stopPropagation(); }
        //     return false;
        // }, false);
        // document.body.addEventListener('touchmove', function(e) {
        //     if (e && e.preventDefault) { e.preventDefault(); }
        //     if (e && e.stopPropagation) { e.stopPropagation(); }
        //     return false;
        // }, false);
        window.addEventListener('contextmenu', ignoreEvent, false);
        add('click', ignoreEvent, false);
    }

    update() {
        this.keyDown.clear();
        this.keyUp.clear();
        this.touchDown = false;
        this.touchUp = false;
        this.mouseDown = false;
        this.mouseUp = false;
    }

    isKeyPressed(key: string): boolean {
        return this.keyState.has(key);
    }

    isKeyDown(key: string): boolean {
        return this.keyDown.has(key);
    }

    isKeyUp(key: string): boolean {
        return this.keyUp.has(key);
    }

    get isPointerDown(): boolean {
        return this.touchDown || this.mouseDown;
    }

    get isPointerUp() {
        return this.touchUp || this.mouseUp;
    }

    resetKeys() {
        this.keyState.clear();
    }

    private handleMouse(e: MouseEvent) {
        const t = e.target;
        if (!this.mouseState && t !== this.canvas && t !== this.canvas.parentNode) {
            return false;
        }
        //e.preventDefault();
        if (e.type === 'mousedown') {
            this.mouseState = true;
            this.mouseDown = true;
        } else if (e.type === 'mouseup') {
            this.mouseState = false;
            this.mouseUp = true;
        }

        const rect = this.canvas.getBoundingClientRect();
        const event = TMP_MOUSE_EVENT;
        event.type = e.type;
        event.x = this.dpr * (e.clientX - rect.left);
        event.y = this.dpr * (e.clientY - rect.top);
        event.button = e.button;
        event.wheel = e instanceof WheelEvent ? (e as WheelEvent).deltaY : 0;
        this.onMouse.emit(event);
    }

    private handleTouch(e: TouchEvent) {
        const t = e.target;
        if (t !== this.canvas && t !== this.canvas.parentNode) {
            return false;
        }
        // stop emulated mouse events
        e.preventDefault();

        if (e.type === 'touchstart') {
            this.touchDown = true;
        } else if (e.type === 'touchend' || e.type === 'touchcancel') {
            this.touchUp = true;
        }

        const event = TMP_TOUCH_EVENT;
        event.type = e.type;
        const rect = this.canvas.getBoundingClientRect();
        for (let i = 0; i < e.changedTouches.length; ++i) {
            const touch = e.changedTouches[i];
            event.id = touch.identifier;
            event.x = this.dpr * (touch.clientX - rect.left);
            event.y = this.dpr * (touch.clientY - rect.top);
            this.onTouch.emit(event);
        }
    }

    private handleKeyboard(e: KeyboardEvent) {
        switch (e.type) {
            case "keydown":
                if (!e.repeat) {
                    this.keyDown.add(e.code);
                    this.keyState.add(e.code);
                }
                break;
            case "keyup":
                this.keyUp.add(e.code);
                this.keyState.delete(e.code);
                break;
        }

        const event = TMP_KEYBOARD_EVENT;
        event.type = e.type;
        event.code = e.code;
        event.key = e.key;
        event.repeat = e.repeat;
        if (document.activeElement === this.canvas) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
        this.onKeyboard.emit(event);
    }

}
