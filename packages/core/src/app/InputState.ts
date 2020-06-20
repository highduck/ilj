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

type MouseEventKeys = "mousedown" | "mouseup" | "mousemove" | "mouseleave" | "mouseenter" | "mouseover" | "wheel";
type TouchEventKeys = "touchstart" | "touchmove" | "touchend" | "touchcancel";
type KeyboardEventKeys = "keypress" | "keydown" | "keyup";

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
        this.onMouseEvent = this.onMouseEvent.bind(this);
        const mouseEvents: MouseEventKeys[] = ["mousedown", "mouseup", "mousemove", "mouseleave", "mouseenter", "mouseover", "wheel"];
        for (let i = 0; i < mouseEvents.length; ++i) {
            canvas.addEventListener(mouseEvents[i], this.onMouseEvent);
        }

        this.onTouchEvent = this.onTouchEvent.bind(this);
        const touchEvents: TouchEventKeys[] = ["touchstart", "touchmove", "touchend", "touchcancel"];
        for (let i = 0; i < touchEvents.length; ++i) {
            canvas.addEventListener(touchEvents[i], this.onTouchEvent);
        }

        this.onKeyEvent = this.onKeyEvent.bind(this);
        const keyEvents: KeyboardEventKeys[] = ["keypress", "keydown", "keyup"];
        for (let i = 0; i < keyEvents.length; ++i) {
            // TODO: check document vs window?
            document.addEventListener(keyEvents[i], this.onKeyEvent);
        }

        this.cancelEvent = this.cancelEvent.bind(this);
        window.addEventListener('contextmenu', this.cancelEvent, false);
        canvas.addEventListener('click', this.cancelEvent, false);
    }

    update(newDpr: number) {
        this.keyDown.clear();
        this.keyUp.clear();
        this.touchDown = false;
        this.touchUp = false;
        this.mouseDown = false;
        this.mouseUp = false;
        this.dpr = newDpr;
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

    private onMouseEvent(e: MouseEvent) {
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

        return true;
    }

    private onTouchEvent(e: TouchEvent) {
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

        return true;
    }

    private onKeyEvent(e: KeyboardEvent) {
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

    private cancelEvent(e: Event) {
        const t = e.target;
        if (t === this.canvas || t === this.canvas.parentNode) {
            e.preventDefault();
            return false;
        }
        return true;
    }
}
