import {AniJson, LinkagesMap, NodeJson} from "./AniJson";
import {Engine} from "../../Engine";
import {loadJSON} from "../../util/load";
import {declTypeID} from "../../util/TypeID";
import {AssetRef, Resources} from "../../util/Resources";

type LinkageRef = {
    library: Ani,
    path: string
};

const LINKAGE_REGISTRY = new Map<string, LinkageRef>();

function registerLinkages(library: Ani, linkagesMap: LinkagesMap) {
    const registry = LINKAGE_REGISTRY;
    for (const linkage of Object.keys(linkagesMap)) {
        const path = linkagesMap[linkage];
        if (path !== undefined) {
            if (registry.has(linkage)) {
                console.warn(`[Ani] Duplicated linkage: ${linkage}`);
            }
            registry.set(linkage, {library, path});
        }
    }
}

export function findLinkageRef(linkage: string): LinkageRef | undefined {
    return LINKAGE_REGISTRY.get(linkage);
}

export function registerAniLibrary(name: string, ani: Ani): AssetRef<Ani> {
    const ref = Resources.reset(Ani, name, ani);
    ani.backReference = ref;
    registerLinkages(ani, ani.json.linkages);
    return ref;
}

export class Ani {
    static TYPE_ID = declTypeID();

    readonly refLookup = new Map<string, NodeJson>();
    backReference: AssetRef<Ani> | undefined;

    constructor(public engine: Engine, public json: AniJson) {
        if (this.json.library.children) {
            for (const child of this.json.library.children) {
                if (child.ref) {
                    this.refLookup.set(child.ref, child);
                }
            }
        }
    }

    get(libraryName: string): NodeJson | undefined {
        return this.refLookup.get(libraryName);
    }

    static async load(engine: Engine, url: string): Promise<Ani> {
        const json = await loadJSON(engine.assetsPath + "/" + url + ".ani.json");
        return new Ani(engine, json as AniJson);
    }
}