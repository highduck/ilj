import {Engine} from "../../Engine";
import {loadJSON} from "../../util/load";
import {declTypeID} from "../../util/TypeID";
import {AssetRef, Resources} from "../../util/Resources";
import {AniJson, NodeJson} from "@highduck/anijson";

type LinkageRef = {
    library: Ani,
    ref: string
};

const LINKAGE_REGISTRY = new Map<string, LinkageRef>();

function registerLinkages(library: Ani, linkageMap: { [id: string]: string }) {
    const registry = LINKAGE_REGISTRY;
    for (const linkage of Object.keys(linkageMap)) {
        const path = linkageMap[linkage];
        if (registry.has(linkage)) {
            console.warn(`[Ani] Duplicated linkage: ${linkage}`);
        }
        registry.set(linkage, {library, ref: path});
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

    readonly lookup:{ [key: string]: NodeJson };
    backReference: AssetRef<Ani> | undefined;

    constructor(public json: AniJson) {
        this.lookup = json.library;
    }

    get(libraryName: string): NodeJson | undefined {
        return this.lookup[libraryName];
    }

    static async load(url: string): Promise<Ani> {
        const assetPath = Engine.current.assetsPath;
        const json = await loadJSON(assetPath + "/" + url + ".ani.json");
        return new Ani(json as AniJson);
    }
}