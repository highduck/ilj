import {ImageRenderer, initCanvasKit} from "@highduck/exporter";
import path from "path";

export async function makeSplashIOS(filepath: string, dest: string) {
    await initCanvasKit();
    const splash = new ImageRenderer(filepath);
    const splashR = splash.resize(2732, 2732);
    for (const ff of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
        splashR.save(path.join(dest, 'App/App/Assets.xcassets/Splash.imageset', ff))
    }
    splash.dispose();
}

export async function makeIconIOS(filepath: string, dest: string) {
    await initCanvasKit();
    const icon = new ImageRenderer(filepath);
    const baseDir = 'App/App/Assets.xcassets/AppIcon.appiconset';
    const meta = [
        {file: 'AppIcon-20x20@1x.png', w: 20, h: 20},
        {file: 'AppIcon-20x20@2x.png', w: 40, h: 40},
        {file: 'AppIcon-20x20@2x-1.png', w: 40, h: 40},
        {file: 'AppIcon-20x20@3x.png', w: 60, h: 60},
        {file: 'AppIcon-29x29@1x.png', w: 29, h: 29},
        {file: 'AppIcon-29x29@2x.png', w: 58, h: 58},
        {file: 'AppIcon-29x29@2x-1.png', w: 58, h: 58},
        {file: 'AppIcon-29x29@3x.png', w: 87, h: 87},
        {file: 'AppIcon-40x40@1x.png', w: 40, h: 40},
        {file: 'AppIcon-40x40@2x.png', w: 80, h: 80},
        {file: 'AppIcon-40x40@2x-1.png', w: 80, h: 80},
        {file: 'AppIcon-40x40@3x.png', w: 120, h: 120},
        {file: 'AppIcon-60x60@2x.png', w: 120, h: 120},
        {file: 'AppIcon-60x60@3x.png', w: 180, h: 180},
        {file: 'AppIcon-76x76@1x.png', w: 76, h: 76},
        {file: 'AppIcon-76x76@2x.png', w: 152, h: 152},
        {file: 'AppIcon-83.5x83.5@2x.png', w: 167, h: 167},
        {file: 'AppIcon-512@2x.png', w: 1024, h: 1024}
    ];

    for (const iconMeta of meta) {
        icon.resize(iconMeta.w, iconMeta.h).save(path.join(dest, baseDir, iconMeta.file));
    }

    icon.dispose();
}