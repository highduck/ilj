import {ImageRenderer, initCanvasKit} from "@highduck/exporter";
import path from "path";
import fs from "fs";

export async function makeSplashAndroid(filepath: string, dest: string) {
    await initCanvasKit();
    const splash = new ImageRenderer(filepath);
    splash.resize(1080, 1080).save(path.join(dest, 'drawable/splash.png'));
    splash.dispose();
}

export async function makeIconAndroid(filepath: string, dest: string) {
    await initCanvasKit();

    const icon = new ImageRenderer(filepath);

    const meta = [
        {dir: 'mipmap-hdpi', size: 72},
        {dir: 'mipmap-ldpi', size: 32},
        {dir: 'mipmap-mdpi', size: 48},
        {dir: 'mipmap-xhdpi', size: 96},
        {dir: 'mipmap-xxhdpi', size: 144},
        {dir: 'mipmap-xxxhdpi', size: 192}
    ];

    for (const iconMeta of meta) {
        fs.mkdirSync(path.join(dest, iconMeta.dir), {recursive: true});
        const size = iconMeta.size;
        const img = icon.resize(size, size);
        img.save(path.join(dest, iconMeta.dir, 'ic_launcher.png'));
        img.save(path.join(dest, iconMeta.dir, 'ic_launcher_foreground.png'));
        img.save(path.join(dest, iconMeta.dir, 'ic_launcher_round.png'));
    }

    icon.dispose();
}