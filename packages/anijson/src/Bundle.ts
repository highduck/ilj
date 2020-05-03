export interface Bundle {
    id?: string,
    items?: BundleItem[];
}

export const enum BundleItemType {
    Atlas = 'atlas',
    Ani = 'ani',
    Audio = 'audio',
    Font = 'font'
}

export type BundleItem = BundleBaseItem | BundleFontItem;

export interface BundleBaseItem {
    id: string,
    type: BundleItemType,
    lazy?: boolean, // depends on type
    priority?: number,
    path?: string,
}

export interface BundleFontItem extends BundleBaseItem {
    // id: string,
    type: BundleItemType.Font,
    // lazy?: boolean,
    // priority?: number,

    size: number,
    // path?: string,
}