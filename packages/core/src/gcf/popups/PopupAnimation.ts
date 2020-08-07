import {backOut, cubicOut, quadOut, saturate} from "@highduck/math";
import {Entity, Transform2D} from "../..";

export const PopupAnimation_Open = (entity: Entity, progress: number) => {
    const t = saturate(progress);
    const scale = backOut(t);
    const fly = cubicOut(t);
    const transform = entity.getOrCreate(Transform2D);
    transform.position.y = 100.0 * (1 - fly);
    transform.scale.set(scale, scale);
};

export const PopupAnimation_Close = (entity: Entity, progress: number) => {
    const t = saturate(1.0 - progress);
    const scale = backOut(t);
    const fly = cubicOut(t);
    const transform = entity.getOrCreate(Transform2D);
    transform.position.y = -100.0 * (1 - fly);
    transform.scale.set(scale, scale);
};

export const PopupAnimation_Background_Open = (entity: Entity, progress: number) => {
    const t = saturate(progress);
    entity.getOrCreate(Transform2D).alpha = quadOut(t);
};

export const PopupAnimation_Background_Close = (entity: Entity, progress: number) => {
    const t = saturate(1.0 - progress);
    entity.getOrCreate(Transform2D).alpha = quadOut(t);
};

export class PopupAnimation {
    openDelay = 0.1;
    openDuration = 0.4;
    closeDelay = 0.1;
    closeDuration = 0.4;
    open = PopupAnimation_Open;
    close = PopupAnimation_Close;
    backgroundOpen = PopupAnimation_Background_Open;
    backgroundClose = PopupAnimation_Background_Close;
}