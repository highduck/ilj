import {GameView} from "./app/GameView";
import {Graphics} from "./graphics/Graphics";
import {Drawer} from "./drawer/Drawer";
import {Batcher} from "./drawer/Batcher";
import {Signal} from "./util/Signal";
import {InputState} from "./app/InputState";
import {Rect, Vec2} from "@highduck/math";
import {InteractiveManager} from "./scene1/ani/InteractiveManager";
import {DisplaySystem} from "./scene1/display/DisplaySystem";
import {Transform2D} from "./scene1/display/Transform2D";
import {updateButtons} from "./scene1/ani/ButtonSystem";
import {ECS_getUsedCount, Entity} from "./ecs/Entity";
import {updateMovieClips} from "./scene1/display/MovieClipSystem";
import {updateParticleEmitters, updateParticleSystems} from "./scene1/particles/ParticleSystem";
import {AniFactory} from "./scene1/ani/AniFactory";
import {updateTrails} from "./scene1/particles/TrailUpdateSystem";
import {updateTargetFollow} from "./scene1/extra/TargetFollow";
import {initCanvas} from "./util/initCanvas";
import {TextureResource} from "./graphics/Texture";
import {ProgramResource} from "./graphics/Program";
import {createEmptyTexture} from "./graphics/util/createEmptyTexture";
import {createProgram2D} from "./graphics/util/createProgram2D";
import {AudioMan} from "./scene1/AudioMan";
import {processEntityAge} from "./scene1/extra/EntityAge";
import {updateFastScripts} from "./scene1/extra/FastScript";
import {updateFonts} from "./rtfont/FontAtlas";
import {LayoutData} from "./scene1/extra/Layout";
import {updateLayout} from "./scene1/extra/LayoutSystem";
import {awaitDocument} from "./util/awaitDocument";
import {invalidateTransform} from "./scene1/systems/invalidateTransform";
import {CameraManager} from "./scene1/display/CameraManager";
import {Time} from "./app/Time";
import {updateSlowMotion} from "./gcf/SlowMotion";
import {updateCameraShakers} from "./gcf/CameraShaker";
import {updateTweens} from "./gcf/Tween";
import {updateScrollArea} from "./gcf/ScrollArea";
import {updatePopupManagers} from "./gcf/PopupManager";
import {Profiler} from "./profiler/Profiler";

export interface InitConfig {
    canvas?: HTMLCanvasElement;
    width: number;
    height: number;
}

export class Engine {
    static current: Engine;

    readonly view: GameView;
    readonly graphics: Graphics;
    readonly batcher: Batcher;
    readonly drawer: Drawer;
    readonly input: InputState;
    readonly assetsPath: string = "assets";
    readonly variables: object[] = [];

    _running = false;

    readonly time = new Time();

    readonly onUpdate = new Signal<number>();
    readonly onRender = new Signal<Readonly<Rect>>();
    readonly onRenderFinish = new Signal<Readonly<Rect>>();
    readonly frameCompleted = new Signal<void>();

    // readonly root: Entity;
    readonly cameraManager: CameraManager;
    readonly displaySystem: DisplaySystem;
    readonly interactiveManager: InteractiveManager;
    readonly aniFactory: AniFactory;
    readonly audio: AudioMan;

    // DEBUG
    readonly profiler = new Profiler();

    constructor(config: InitConfig) {
        Engine.current = this;

        this.handleFrame = this.handleFrame.bind(this);

        if (config.canvas === undefined) {
            config.canvas = initCanvas();
        }

        this.graphics = new Graphics(config.canvas);
        this.view = new GameView(
            config.canvas,
            new Vec2(config.width, config.height),
            Math.min(this.graphics.maxTextureSize, this.graphics.maxRenderBufferSize)
        );
        this.input = new InputState(this.view.canvas);
        this.input.dpr = this.view.dpr;

        TextureResource.reset("empty", createEmptyTexture(this.graphics));
        ProgramResource.reset("2d", createProgram2D(this.graphics));

        this.batcher = new Batcher(this.graphics);
        this.drawer = new Drawer(this.batcher);
        this.audio = new AudioMan(this);

        Entity.root.name = "Root";
        Entity.root.getOrCreate(Transform2D);
        this.interactiveManager = new InteractiveManager(this);
        this.displaySystem = new DisplaySystem(this);
        this.aniFactory = new AniFactory();
        this.cameraManager = new CameraManager();

        LayoutData.space.copyFrom(this.view.reference);
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
        this.graphics.currentFramebufferRect.copyFrom(rc);
        this.graphics.begin();
        this.graphics.viewport();

        Entity.root.get(Transform2D).rect.copyFrom(rc);
        this.drawer.begin(rc);
        {
            this.onRender.emit(rc);
            this.displaySystem.process();
            this.onRenderFinish.emit(rc);
        }
        // ~~~ force draw
        this.batcher.flush();

        this.profiler.endGroup("Render");

        this.profiler.beginGroup("Profiler");

        if (this.profiler.enabled) {
            this.profiler.getGraph('FPS').threshold = 30;
            this.profiler.getGraph('Frame').threshold = (1.0 / 60.0) * 1000 * 1000;
            // this.profiler.getGraph('entities').threshold = 1000;
            // this.profiler.getGraph('tris').threshold = 2000;
            // this.profiler.getGraph('dc').threshold = 25;

            this.profiler.setFrameGraphValue('FPS', this.time.fps.frame);
            // this.profiler.setFrameGraphValue('elapsed', this.time.raw);
            // this.profiler.setFrameGraphValue('tris', this.graphics.triangles);
            // this.profiler.setFrameGraphValue('dc', this.graphics.drawCalls);
            this.profiler.setFrameGraphValue('entities', ECS_getUsedCount());
            // this.profiler.setFrameGraphValue('RAF skipped', this.RAFSkipped);
            this.profiler.draw(this.drawer);
        }
        // ~~~ force draw
        this.batcher.flush();

        this.profiler.endGroup("Profiler");

        this.drawer.end();

        this.profiler.beginGroup("updateFonts");
        updateFonts();
        this.profiler.endGroup("updateFonts");

        //this.graphics.end();
    }

    handleFrame(millis: number) {
        this.profiler.beginGroup("Frame");

        if (this._running) {
            requestAnimationFrame(this.handleFrame);
        }

        this.profiler.beginGroup("Pre Update");

        this.time.updateTime(millis / 1000.0);
        if (process.env.NODE_ENV === 'development' || this.profiler.enabled) {
            this.time.fps.calcFPS(this.time.raw);
        }

        Entity.root.getOrCreate(Transform2D).rect.copyFrom(this.view.drawable);

        this.interactiveManager.process();

        this.profiler.endGroup("Pre Update");

        this.profiler.beginGroup("Game Update");
        this.onUpdate.emit(this.time.delta);
        this.profiler.endGroup("Game Update");

        this.profiler.beginGroup("Update");

        updateTargetFollow();
        updateButtons();
        updateFastScripts();
        updateSlowMotion();
        updateCameraShakers();
        updateTweens();
        updateScrollArea();
        updatePopupManagers();

        updateMovieClips();
        updateLayout();
        this.profiler.endGroup("Update");

        this.profiler.beginGroup("Late Update");

        // remove any entities
        processEntityAge();

        invalidateTransform();

        updateTrails();
        updateParticleEmitters();
        updateParticleSystems();

        this.cameraManager.updateCameraStack();

        this.input.update(this.view.dpr);

        this.profiler.endGroup("Late Update");

        // Render
        this.renderFrame();
        this.frameCompleted.emit();

        // Late Update
        // this.profiler.beginGroup("Late Update");

        // this.profiler.endGroup("Late Update");

        this.profiler.endGroup("Frame");
    }

    start() {
        this.running = true;
    }

    stop() {
        this.running = false;
    }

    set running(v: boolean) {
        if (this._running !== v) {
            this._running = v;
            if (v) {
                requestAnimationFrame(this.handleFrame);
            }
        }
    }

    get running(): boolean {
        return this._running;
    }

    // used for editor
    _step() {
        if (this.running) {
            this.stop();
        }
        requestAnimationFrame(this.handleFrame);
    }

    static async init(config: InitConfig) {
        await awaitDocument();
        const engine = new Engine(config);
        engine.start();
        return engine;
    }
}
