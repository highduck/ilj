import {Rect} from "@highduck/math";

export class SpriteImage {

    width: number;
    height: number;
    data: Uint8Array | undefined = undefined;

    constructor(w: number, h: number) {
        this.width = w;
        this.height = h;
    }

    dispose() {

    }
}

export const enum SpriteFlag {
    none = 0,
    rotated = 1,
    packed = 2
}

export class Sprite {

    name: string = "";

    // physical rect
    readonly rc = new Rect();

    // coords in atlas image
    readonly uv = new Rect();

    // flags in atlas image
    flags = SpriteFlag.none;

    // rect in source image
    readonly source = new Rect(); // integers

    // TODO: make dynamic (prev default 1)
    padding = 2;

    // reference image;
    image: undefined | SpriteImage = undefined;

    get isPacked() {
        return (this.flags & SpriteFlag.packed) !== 0;
    }

    get isRotated() {
        return (this.flags & SpriteFlag.rotated) !== 0;
    }

    enable(flag: SpriteFlag) {
        this.flags |= flag;
    }

    disable(flag: SpriteFlag) {
        this.flags &= ~flag;
    }

    serialize(io: any) {
        //io(name, rc, uv, flags);
    }
}

export class AtlasPage {
    width = 0;
    height = 0;
    sprites: Sprite[] = [];
    image_path: string = "";
    image: undefined | SpriteImage = undefined;

    serialize(io: any) {
        // io(size, image_path, sprites);
    }
}

export class AtlasResolution {
    sprites: Sprite[] = [];
    pages: AtlasPage[] = [];

    constructor(
        public index = 0,
        public scale = 1,
        public widthMax = 2048,
        public heightMax = 2048,
    ) {

    }

    serialize(io: any) {
        // io(pages);
    }
}

export class Atlas {
    name: string = "";
    resolutions: AtlasResolution[] = [];

    constructor() {
        for (let i = 0; i < 4; ++i) {
            this.resolutions.push(new AtlasResolution(i, i + 1));
        }
    }

    // explicit atlas_t(const atlas_decl_t& decl) {
    //     int i = 0;
    //     resolutions.reserve(decl.resolutions.size());
    //     for (const auto& resolution : decl.resolutions) {
    //         resolutions.emplace_back(resolution, i);
    //         ++i;
    //     }
    //     name = decl.name;
    // }

    dispose() {
        for (const res of this.resolutions) {
            for (const page of res.pages) {
                if (page.image !== undefined) {
                    page.image.dispose();
                    page.image = undefined;
                }
            }
        }
    }
}