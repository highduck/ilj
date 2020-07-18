import {Entity} from "../../ecs/Entity";
import {Transform2D, Transform2D_Data} from "./Transform2D";
import {Display2D} from "./Display2D";
import {Color4, Matrix2D, Matrix4, Rect, transformRectMatrix2D} from "@highduck/math";
import {CheckFlag} from "../../drawer/DrawingState";
import {Engine} from "../../Engine";
import {drawCameraDebugGizmos} from "../debug/SceneDebug";
import {Camera2D} from "./Camera2D";
import {Bounds2D} from "./Bounds2D";
import {TypeOfComponent} from "../../ecs/Component";

const TEMP_RECT = new Rect();

const transformMap = Transform2D.map;
const cullingMap = Bounds2D.map;
const displayMap = Display2D.map;

export class DisplaySystem {

    activeLayers = 0x1;
    drawer = this.engine.drawer;
    state = this.engine.drawer.state;
    readonly _tmpProj = new Matrix4();

    static _currentCamera: TypeOfComponent<typeof Camera2D>;

    constructor(readonly engine: Engine) {
    }

    process() {
        const engine = this.engine;
        const drawer = engine.drawer;
        const activeCameras = engine.cameraManager.activeCameras;

        drawer.state
            .saveTransform()
            .saveMVP()
            .saveScissors();
        this._tmpProj.copyFrom(drawer.state.mvp);

        for (let i = 0; i < activeCameras.length; ++i) {
            const camera = activeCameras[i];

            // set current
            DisplaySystem._currentCamera = camera;

            // apply scissors
            drawer.state.setScissors(camera.screenRect);

            // apply MVP
            Matrix4.multiply4x4by3x2(this._tmpProj.data, camera.inverseMatrix, drawer.state.mvp.data);
            drawer.state.checkFlags |= CheckFlag.MVP;

            // if (camera.clearColorEnabled) {
            //     drawer.invalidateForce();
            //     engine.graphics.clear(camera.clearColor);
            // }
            drawer.state.colorMultiplier.copyFrom(Color4.ONE);
            drawer.state.colorOffset.copyFrom(Color4.ZERO);
            drawer.state.matrix.copyFrom(Matrix2D.IDENTITY);

            if (camera.clearColorEnabled) {
                // drawer.state.setTexture(drawer.state.defaultTexture);
                // drawer.state.setTextureRegion(drawer.state.defaultTexture);
                drawer.state.setEmptyTexture();
                drawer.quadColor(camera.worldRect.x, camera.worldRect.y,
                    camera.worldRect.width, camera.worldRect.height,
                    camera.clearColor.argb32);
            }

            this.draw(camera.root, Transform2D_Data.IDENTITY);

            if (process.env.NODE_ENV === 'development') {
                drawCameraDebugGizmos(camera);
            }

            drawer.batcher.flush();
            // drawer.batcher.state.invalidate();
        }

        drawer.state
            .restoreScissors()
            .restoreMVP()
            .restoreTransform();
    }

    draw(e: Entity, parentTransform: Transform2D_Data) {
        if (!e.visible || (e.layerMask & this.activeLayers) === 0) {
            return;
        }

        const entityIndex = e.index;
        const transform = transformMap.get(entityIndex);
        if (transform !== undefined) {
            if (transform.colorMultiplier.a <= 0) {
                return;
            }
            parentTransform = transform;
        }

        const bounds = cullingMap.get(entityIndex);
        if (bounds !== undefined && DisplaySystem._currentCamera.occlusionEnabled) {
            const worldRect = TEMP_RECT;
            /*#__NOINLINE__*/
            transformRectMatrix2D(bounds, parentTransform.worldMatrix, worldRect);
            const cameraRect = DisplaySystem._currentCamera.worldRect;
            if (worldRect.right <= cameraRect.x || worldRect.x >= cameraRect.right ||
                worldRect.bottom <= cameraRect.y || worldRect.y >= cameraRect.bottom) {
                return;
            }
        }

        const scissors = transform !== undefined && transform.scissors !== undefined;
        if (scissors) {
            transform!.getScreenScissors(DisplaySystem._currentCamera.inverseMatrix, transform!.worldMatrix, TEMP_RECT);
            this.state.pushScissors(TEMP_RECT);
        }

        const display = displayMap.get(entityIndex);
        if (display !== undefined) {
            this.state.matrix.copyFrom(parentTransform.worldMatrix);
            this.state.colorMultiplier.copyFrom(parentTransform.worldColorMultiplier);
            this.state.colorOffset.copyFrom(parentTransform.worldColorOffset);

            display.draw(this.drawer);
        }

        let child = e.childFirst;
        while (child !== undefined) {
            this.draw(child, parentTransform);
            child = child.siblingNext;
        }

        if (scissors) {
            this.state.restoreScissors();
        }
    }
}
