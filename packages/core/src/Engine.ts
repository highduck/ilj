import {GameView} from "./app/GameView";
import {Graphics} from "./graphics/Graphics";
import {Drawer} from "./drawer/Drawer";
import {Batcher} from "./drawer/Batcher";
import {Signal} from "./util/Signal";
import {InputState} from "./app/InputState";
import {Vec2} from "@highduck/math";
import {InteractiveManager} from "./scene1/ani/InteractiveManager";
import {DisplaySystem} from "./scene1/display/DisplaySystem";
import {Transform2D} from "./scene1/display/Transform2D";
import {Entity} from "./ecs";
import {AniFactory} from "./scene1/ani/AniFactory";
import {initCanvas} from "./util/initCanvas";
import {TextureResource} from "./graphics/Texture";
import {ProgramResource} from "./graphics/Program";
import {createEmptyTexture} from "./graphics/util/createEmptyTexture";
import {createProgram2D} from "./graphics/util/createProgram2D";
import {AudioMan} from "./scene1/AudioMan";
import {updateFonts} from "./rtfont/FontAtlas";
import {LayoutData} from "./scene1/extra/Layout";
import {CameraManager} from "./scene1/display/CameraManager";
import {Time, updateTimers} from "./app/Time";
import {Profiler} from "./profiler/Profiler";
import {updateLayout} from "./scene1/extra/LayoutSystem";
import {updateFastScripts} from "./scene1/extra/FastScript";
import {updateTargetFollow} from "./scene1/extra/TargetFollow";
import {updateButtons} from "./scene1/ani/ButtonSystem";
import {updateSlowMotion} from "./gcf/SlowMotion";
import {updateCameraShakers} from "./gcf/CameraShaker";
import {updateTweens} from "./gcf/Tween";
import {updateScrollArea} from "./gcf/ScrollArea";
import {updatePopupManagers} from "./gcf/popups/PopupManager";
import {updateMovieClips} from "./scene1/display/MovieClipSystem";
import {processEntityAge} from "./scene1/extra/EntityAge";
import {invalidateTransform} from "./scene1/systems/invalidateTransform";
import {updateTrails} from "./scene1/particles/TrailUpdateSystem";
import {updateParticleEmitters, updateParticleSystems} from "./scene1/particles/ParticleSystem";
import {destroyEntities} from "./scene1/extra/EntityDestroyer";
import {MouseCursor} from "./app/MouseCursor";

export interface InitConfig {
    canvas?: HTMLCanvasElement;
    width: number;
    height: number;
}

let rafHandle = -1;

function _raf(millis: number) {
    const engine = Engine.current;
    engine.profiler.beginGroup("Frame");
    rafHandle = requestAnimationFrame(_raf);
    engine.handleFrame(millis);
    engine.profiler.endGroup("Frame");
}

export class Engine {
    static current: Engine;

    readonly view: GameView;
    readonly cursor: MouseCursor;
    readonly graphics: Graphics;
    readonly batcher: Batcher;
    readonly drawer: Drawer;
    readonly input: InputState;
    readonly variables: object[] = [];

    readonly time = new Time();

    readonly onUpdate = new Signal<void>();
    readonly onRender = new Signal<void>();
    readonly onRenderFinish = new Signal<void>();
    readonly frameCompleted = new Signal<void>();

    // readonly root: Entity;
    readonly cameraManager: CameraManager;
    readonly displaySystem: DisplaySystem;
    readonly interactiveManager: InteractiveManager;
    readonly aniFactory: AniFactory;
    readonly audio: AudioMan;

    // DEBUG
    readonly profiler: Profiler;

    constructor(config: InitConfig) {
        Engine.current = this;

        const canvas = config.canvas ?? initCanvas('gameview');

        this.graphics = new Graphics(canvas);
        this.view = new GameView(
            canvas,
            new Vec2(config.width, config.height),
            Math.min(this.graphics.maxTextureSize, this.graphics.maxRenderBufferSize)
        );
        this.cursor = new MouseCursor(canvas);
        this.input = new InputState(canvas);
        this.input.dpr = this.view.dpr;

        TextureResource.reset("empty", createEmptyTexture(this.graphics));
        ProgramResource.reset("2d", createProgram2D(this.graphics));

        this.batcher = new Batcher(this.graphics);
        this.drawer = new Drawer(this.batcher);
        this.audio = new AudioMan();
        this.profiler = new Profiler(this.drawer);

        Entity.root.name = "Root";
        const tr = Entity.root.getOrCreate(Transform2D);
        tr.flagRect = true;

        this.interactiveManager = new InteractiveManager(this);
        this.displaySystem = new DisplaySystem(this);
        this.aniFactory = new AniFactory();
        this.cameraManager = new CameraManager();

        LayoutData.space.copyFrom(this.view.reference);

        requestAnimationFrame(_raf);
    }

    private renderFrame() {
        if (!this.view.visible) {
            return;
        }
        if (this.graphics.gl.isContextLost()) {
            console.warn("WebGL: context lost");
            return;
        }

        this.profiler.beginGroup("Render");

        const rc = this.view.drawable;
        this.graphics.framebufferWidth = rc.width | 0;
        this.graphics.framebufferHeight = rc.height | 0;
        this.graphics.begin();
        this.graphics.viewport();

        this.drawer.begin(rc);
        {
            this.onRender.emit();
            this.displaySystem.process();
            this.onRenderFinish.emit();
        }
        // ~~~ force draw
        this.batcher.flush();

        this.profiler.endGroup("Render");

        this.profiler.beginGroup("Profiler");

        if (this.profiler.enabled) {
            this.profiler.updateProfiler(this.time.raw);
            this.profiler.draw();
        }
        // ~~~ force draw
        this.batcher.flush();

        this.profiler.endGroup("Profiler");

        this.profiler.beginGroup("Post Render");
        this.drawer.end();
        /*#__NOINLINE__*/
        updateFonts();
        this.profiler.endGroup("Post Render");
    }

    handleFrame(millis: number) {
        this.profiler.beginGroup("Pre Update");

        this.time.updateTime(millis / 1000.0);
        updateTimers(this.time.delta);

        Entity.root.get(Transform2D).rect.copyFrom(this.view.drawable);

        this.input.dispatchInputEvents();
        this.interactiveManager.process();

        this.profiler.endGroup("Pre Update");

        this.profiler.beginGroup("Game Update");
        this.onUpdate.emit();
        this.profiler.endGroup("Game Update");

        this.profiler.beginGroup("Update");

        /*#__NOINLINE__*/
        updateTargetFollow();
        /*#__NOINLINE__*/
        updateButtons();
        /*#__NOINLINE__*/
        updateFastScripts();
        /*#__NOINLINE__*/
        updateSlowMotion();
        /*#__NOINLINE__*/
        updateCameraShakers();
        /*#__NOINLINE__*/
        updateTweens();
        /*#__NOINLINE__*/
        updateScrollArea();
        /*#__NOINLINE__*/
        updatePopupManagers();

        /*#__NOINLINE__*/
        updateMovieClips();
        /*#__NOINLINE__*/
        updateLayout();
        this.profiler.endGroup("Update");

        this.profiler.beginGroup("Late Update");

        // remove any entities
        /*#__NOINLINE__*/
        processEntityAge();
        /*#__NOINLINE__*/
        destroyEntities();

        /*#__NOINLINE__*/
        invalidateTransform();

        /*#__NOINLINE__*/
        updateTrails();
        /*#__NOINLINE__*/
        updateParticleEmitters();
        /*#__NOINLINE__*/
        updateParticleSystems();

        this.cameraManager.updateCameraStack();

        this.input.update(this.view.dpr);

        this.profiler.endGroup("Late Update");

        // Render
        this.renderFrame();
        this.frameCompleted.emit();
    }

    dispose() {
        // TODO:
        cancelAnimationFrame(rafHandle);
    }
}
