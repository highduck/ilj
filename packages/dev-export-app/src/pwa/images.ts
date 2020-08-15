import {ImageRenderer, initCanvasKit} from "@highduck/exporter";
import path from "path";
import {mkdirSync, readFileSync, writeFileSync} from "fs";
import IcoLibrary from "@fiahfy/ico";

const {Ico, IcoImage} = IcoLibrary;

export async function makeIconPWA(filepath: string, dest: string) {
    await initCanvasKit();

    const icon = new ImageRenderer(filepath);
    const baseDir = 'icons';
    const meta = [
        {file: 'app-icon-16.png', size: 16},
        {file: 'app-icon-32.png', size: 32},
        {file: 'app-icon-48.png', size: 48},
        {file: 'app-icon-180.png', size: 180},
        {file: 'app-icon-192.png', size: 192},
        {file: 'app-icon-512.png', size: 512}
    ];

    mkdirSync(path.join(dest, baseDir), {recursive: true});

    for (const iconMeta of meta) {
        const size = iconMeta.size;
        icon.resize(size, size).save(path.join(dest, baseDir, iconMeta.file));
    }
    {
        const ico = new Ico();
        for (const img of [
            "app-icon-16.png",
            "app-icon-32.png",
            "app-icon-48.png",
        ]) {
            const buf = new Buffer(readFileSync(path.join(dest, baseDir, img)));
            ico.append(IcoImage.fromPNG(buf));
        }
        writeFileSync(path.join(dest, 'favicon.ico'), ico.data);
    }

    icon.dispose();
}