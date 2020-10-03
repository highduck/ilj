import {Engine, getComponents, Interactive, Time, Transform2D, Transform2D_Data} from "..";
import {Recta, Vec2, integrateExp, lerp} from "@highduck/math";
import {Entity, EntityComponentType} from "../ecs";
import {cubicOut} from '@highduck/easing';

function calcAverage(values: number[]) {
    let sum = 0;
    const len = values.length;
    if (len !== 0) {
        for (let i = 0; i < len; ++i) {
            sum += values[i];
        }
        sum /= values.length;
    }
    return sum;
}

class VelocityTracker {

    readonly position = new Vec2();
    time = 0.0;

    readonly dx: number[] = [];
    readonly dy: number[] = [];
    readonly dt: number[] = [];

    samplesMax = 10;
    total = 0;

    constructor() {

    }

    calcVelocity(out: Vec2): Vec2 {
        const dt = calcAverage(this.dt);
        if (dt > 0) {
            out.x = calcAverage(this.dx) / dt;
            out.y = calcAverage(this.dy) / dt;
        } else {
            out.set(0, 0);
        }
        return out;
    }

    start(position: Vec2, time: number) {
        this.dx.length = 0;
        this.dy.length = 0;
        this.dt.length = 0;
        this.total = 0;
        this.position.copyFrom(position);
        this.time = time;
    }


    update(position: Vec2, time: number) {
        const dt = time - this.time;
        if (dt > 0) {
            const i = (this.total++) % this.samplesMax;
            this.dx[i] = position.x - this.position.x;
            this.dy[i] = position.y - this.position.y;
            this.dt[i] = dt;

            this.position.copyFrom(position);
            this.time = time;
        }
    }
}


export class ScrollArea_Data {
    constructor(readonly entity: Entity) {

    }

    readonly area = new Recta();
    readonly content = new Recta();

    readonly threshold = 10;

    readonly velocityTracker = new VelocityTracker();

    readonly velocity = new Vec2();
    velocityScaleFactor = 3;

    gridOffsetY = 0;
    gridSpaceY = 1;

    // private
    handleEnd() {
        if (this.down) {
            if (this.captured) {
                this.captured = false;
                Engine.current.interactiveManager.dragEntity = null;
                this.velocityTracker.calcVelocity(this.velocity).scale(this.velocityScaleFactor);
            } else {

            }
            this.down = false;
        }
    }

    readonly positionInitial = new Vec2();
    readonly positionInitialGlobal = new Vec2();
    readonly positionLast = new Vec2();
    readonly scrollStart = new Vec2();
    down = false;
    captured = false;

    initialized = false;

    initialize() {
        if (!this.initialized) {
            const interactive = this.entity.getOrCreate(Interactive);
            interactive.onDown.on(() => {
                this.down = true;
                this.scrollStart.copyFrom(this.entity.get(Transform2D).pivot);
                const pointer = this.entity.get(Interactive).pointer;
                this.positionInitialGlobal.copyFrom(pointer);
                Transform2D_Data.globalToParent(this.entity, pointer, this.positionInitial);

                this.velocityTracker.start(this.scrollStart, Engine.current.time.total);
            });
            interactive.onUp.on(() => this.handleEnd());
            this.initialized = true;
        }
    }

    dispose() {}
}

export const ScrollArea = new EntityComponentType(ScrollArea_Data);

const TEMP_RECT = new Recta();
const TEMP_VEC2 = new Vec2();

function limitRect(offset: Vec2, area: Recta, bounds: Recta, out: Vec2) {
    const rc = TEMP_RECT;
    rc.set(area.x + offset.x, area.y + offset.y, area.width, area.height);
    if (rc.x < bounds.x) {
        rc.x = bounds.x;
    }
    if (rc.right > bounds.right) {
        rc.right = bounds.right;
    }
    if (rc.y < bounds.y) {
        rc.y = bounds.y;
    }
    if (rc.bottom > bounds.bottom) {
        rc.bottom = bounds.bottom;
    }
    out.set(rc.x, rc.y);
}

export function updateScrollArea() {
    const engine = Engine.current;
    const input = engine.interactiveManager;
    const dt = Time.UI.dt;
    const components = getComponents(ScrollArea);
    for (let i = 0; i < components.length; ++i) {
        const scroll = components[i];
        const transform = scroll.entity.getOrCreate(Transform2D);
        if (!scroll.initialized) {
            scroll.initialize();
        }
        if (scroll.down) {
            const worldPosition = scroll.entity.get(Interactive).pointer;
            Transform2D_Data.globalToParent(scroll.entity, worldPosition, scroll.positionLast);

            if (scroll.captured) {
                const dx = scroll.positionLast.x - scroll.positionInitial.x;
                const dy = scroll.positionLast.y - scroll.positionInitial.y;
                const tx = scroll.scrollStart.x - dx;
                const ty = scroll.scrollStart.y - dy;

                TEMP_VEC2.set(tx, ty);
                limitRect(TEMP_VEC2, scroll.area, scroll.content, TEMP_VEC2);
                const overX = tx - TEMP_VEC2.x;
                const overY = (ty - TEMP_VEC2.y) / scroll.area.height;
                //console.log(ty, TEMP_VEC2.y, scroll.area.height);
                TEMP_VEC2.y += Math.sign(overY) * cubicOut(Math.min(1, Math.abs(overY))) * scroll.gridSpaceY / 2;
                //console.log(overY, cubicOut(overY), scroll.gridSpaceY / 2);
                //console.log(TEMP_VEC2.y);

                transform.pivot.lerp(TEMP_VEC2, integrateExp(0.2, dt));

                scroll.velocityTracker.update(TEMP_VEC2, engine.time.total);

            } else {
                if (worldPosition.distance(scroll.positionInitialGlobal) >= scroll.threshold) {
                    scroll.captured = true;
                    input.dragEntity = scroll.entity;
                }
            }
        } else if (scroll.velocity.length >= 3) {
            transform.pivot.addScale(scroll.velocity, dt);
            TEMP_VEC2.copyFrom(transform.pivot);
            limitRect(TEMP_VEC2, scroll.area, scroll.content, TEMP_VEC2);
            transform.pivot.lerp(TEMP_VEC2, integrateExp(0.5, dt));
            scroll.velocity.lerp(Vec2.ZERO, integrateExp(0.2, dt));
        } else {
            TEMP_VEC2.copyFrom(transform.pivot);
            TEMP_VEC2.y = Math.round(TEMP_VEC2.y / scroll.gridSpaceY) * scroll.gridSpaceY;
            limitRect(TEMP_VEC2, scroll.area, scroll.content, TEMP_VEC2);
            transform.pivot.y = lerp(transform.pivot.y, TEMP_VEC2.y, integrateExp(0.5, dt));
        }
    }
}