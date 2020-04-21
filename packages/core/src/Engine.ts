import {GameView} from "./app/GameView";
import {Graphics} from "./graphics/Graphics";
import {Drawer} from "./drawer/Drawer";
import {Batcher} from "./drawer/Batcher";
import {FrameTime} from "./app/FrameTime";
import {FrameRateMeter} from "./app/FrameRateMeter";
import {Signal} from "./util/Signal";
import {Resources} from "./util/Resources";
import {World} from "./ecs/World";
import {InputState} from "./app/InputState";
import {Rect, Vec2} from "@highduck/math";
import {InteractiveManager} from "./scene1/ani/InteractiveManager";
import {DisplaySystem, invalidateTransform} from "./scene1/display/DisplaySystem";
import {Transform2D} from "./scene1/display/Transform2D";
import {ButtonSystem} from "./scene1/ani/ButtonSystem";
import {Entity} from "./ecs/Entity";
import {updateMovieClips} from "./scene1/display/MovieClipSystem";
import {SceneTimeSystem} from "./scene1/ani/SceneTimeSystem";
import {ParticleSystem} from "./scene1/particles/ParticleSystem";
import {Constructor, ConstructorWithID, getTypeID} from "./util/TypeID";
import {AniFactory} from "./scene1/ani/AniFactory";
import {TrailUpdateSystem} from "./scene1/particles/TrailUpdateSystem";
import {TargetFollowUpdate} from "./scene1/extra/TargetFollow";
import {initCanvas} from "./util/initCanvas";
import {Texture} from "./graphics/Texture";
import {Program} from "./graphics/Program";
import {createEmptyTexture} from "./graphics/util/createEmptyTexture";
import {createProgram2D} from "./graphics/util/createProgram2D";
import {AudioMan} from "./scene1/AudioMan";
import {processEntityAge} from "./scene1/extra/EntityAge";
import {CameraOrderSystem} from "./scene1/display/CameraOrderSystem";
import {updateFastScripts} from "./scene1/extra/FastScript";
import {updateDynamicFonts} from "./rtfont/DynamicFontAtlas";
import {Layout} from "./scene1/extra/Layout";
import {updateLayout} from "./scene1/extra/LayoutSystem";

export interface InitConfig {
    canvas?: HTMLCanvasElement;
    width?: number;
    height?: number;
}

const DEFAULT_WIDTH = 768;
const DEFAULT_HEIGHT = 1024;

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

    readonly time = new FrameTime();
    readonly fps = new FrameRateMeter();

    readonly onUpdate = new Signal<number>();
    readonly onRender = new Signal<Readonly<Rect>>();
    readonly onRenderFinish = new Signal<Readonly<Rect>>();
    readonly frameCompleted = new Signal<void>();

    readonly world: World;
    readonly root: Entity;
    readonly cameraOrderSystem: CameraOrderSystem;
    readonly displaySystem: DisplaySystem;
    readonly interactiveManager: InteractiveManager;
    readonly buttonSystem: ButtonSystem;
    readonly trailUpdateSystem: TrailUpdateSystem;
    readonly particleSystem: ParticleSystem;
    readonly aniFactory: AniFactory;
    readonly audio: AudioMan;

    constructor(config: InitConfig = {}) {
        Engine.setCurrentContext(this);

        if (config.canvas === undefined) {
            config.canvas = initCanvas();
        }
        if (config.width === undefined) {
            config.width = DEFAULT_WIDTH;
        }
        if (config.height === undefined) {
            config.height = DEFAULT_HEIGHT;
        }

        this.graphics = new Graphics(config.canvas);
        this.view = new GameView(
            config.canvas,
            new Vec2(config.width, config.height),
            Math.min(this.graphics.maxTextureSize, this.graphics.maxRenderBufferSize)
        );
        this.input = new InputState(this.view.canvas);
        this.input.dpr = this.view.dpr;
        this.view.onResize.on(() => {
            console.debug("GameView Resize event");
            this.input.dpr = this.view.dpr;
        });

        Resources.reset(Texture, "empty", createEmptyTexture(this.graphics));
        Resources.reset(Program, "2d", createProgram2D(this.graphics));

        this.batcher = new Batcher(this.graphics);
        this.drawer = new Drawer(this.batcher);
        this.audio = new AudioMan(this);

        this.world = new World(this);
        this.root = this.world.root;
        this.root.name = "Root";
        this.root.set(Transform2D);
        this.interactiveManager = new InteractiveManager(this);
        this.input.onMouse.on(ev => this.interactiveManager.handleMouseEvent(ev));
        this.input.onTouch.on(ev => this.interactiveManager.handleTouchEvent(ev));
        this.input.onKeyboard.on(ev => this.interactiveManager.handleKeyboardEvent(ev));
        this.displaySystem = new DisplaySystem(this);
        this.buttonSystem = new ButtonSystem(this);
        this.trailUpdateSystem = new TrailUpdateSystem(this);
        this.particleSystem = new ParticleSystem(this);
        this.aniFactory = new AniFactory(this);
        this.cameraOrderSystem = new CameraOrderSystem(this);

        Layout.space.copyFrom(this.view.reference);
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
                this.requireNextFrame();
            }
        }
    }

    get running(): boolean {
        return this._running;
    }

    requireNextFrame() {
        requestAnimationFrame((time: number) => {
            this.handleFrame(time);
        });
    }

    // used for editor
    readonly _step = () => {
        if (this.running) {
            this.stop();
        }
        this.requireNextFrame();
    };

    private renderFrame() {
        if (!this.view.visible) {
            return;
        }
        if (this.graphics.gl.isContextLost()) {
            console.warn("WebGL: context lost");
            return;
        }
        const rc = this.view.drawable;
        this.graphics.currentFramebufferRect.copyFrom(rc);
        this.graphics.begin();
        this.graphics.viewport();

        this.root.get(Transform2D).rect.copyFrom(rc);
        this.drawer.begin(rc);
        {
            this.onRender.emit(rc);
            invalidateTransform(this);
            this.displaySystem.process();
            this.onRenderFinish.emit(rc);
        }
        this.drawer.end();

        updateDynamicFonts();

        //this.graphics.end();
    }

    handleFrame(millis: number) {
        this.time.update(millis / 1000.0);
        this.fps.update(this.time.raw);
        this.root.getOrCreate(Transform2D).rect.copyFrom(this.view.drawable);

        this.cameraOrderSystem.process();
        this.interactiveManager.process();
        SceneTimeSystem(this);
        TargetFollowUpdate(this);
        this.buttonSystem.process();

        updateFastScripts();
        this.onUpdate.emit(this.time.delta);

        updateMovieClips();
        this.trailUpdateSystem.process();
        this.particleSystem.process();

        updateLayout(this);

        // Render
        this.renderFrame();

        // Late Update
        processEntityAge();
        this.input.update();
        this.frameCompleted.emit();

        // handle frame;
        if (this._running) {
            this.requireNextFrame();
        }
    }

    // locator
    readonly services = new Map<number, object>();

    register(instance: object) {
        this.services.set(getTypeID(instance.constructor as ConstructorWithID), instance);
    }

    resolve<T extends object>(ctor: Constructor<T>): T {
        const id = getTypeID(ctor);
        const obj = this.services.get(id);
        if (obj !== undefined) {
            return obj as T;
        }
        throw `${id} not found`;
    }

    private static setCurrentContext(engine: Engine) {
        Engine.current = engine;
        (window as EngineHolder).ilj_shared_engine = engine;
    }

    private static findSharedContext(): Engine | undefined {
        for (const o of [opener as OptionalEngineHolder, window as OptionalEngineHolder]) {
            if (o != null && o.ilj_shared_engine != null) {
                return o.ilj_shared_engine;
            }
        }
        return undefined;
    }

    static restore(): boolean {
        const maybeEngine = Engine.findSharedContext();
        if (maybeEngine !== undefined) {
            Engine.setCurrentContext(maybeEngine);
            return true;
        }
        return false;
    }
}

interface EngineHolder {
    ilj_shared_engine?: Engine | null | undefined;
}

type OptionalEngineHolder = EngineHolder | undefined | null;
