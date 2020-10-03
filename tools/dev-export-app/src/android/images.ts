import {ImageRenderer, initCanvasKit} from "@highduck/exporter";
import path from "path";
import fs from "fs";
import {AdaptiveIconConfig} from "..";

interface ResolutionDensity {
    id: string;
    scale: number;
}

const densityTable:ResolutionDensity[] = [
    {id: 'ldpi', scale: 0.75},
    {id: 'mdpi', scale: 1.00},
    {id: 'hdpi', scale: 1.50},
    {id: 'xhdpi', scale: 2.0},
    {id: 'xxhdpi', scale: 3.0},
    {id: 'xxxhdpi', scale: 4.0}
];
// };
/* Android density resolutions
36x36 (0.75x) for low-density (ldpi)
48x48 (1.0x baseline) for medium-density (mdpi)
72x72 (1.5x) for high-density (hdpi)
96x96 (2.0x) for extra-high-density (xhdpi)
144x144 (3.0x) for extra-extra-high-density (xxhdpi)
192x192 (4.0x) for extra-extra-extra-high-density (xxxhdpi)
 */

export async function makeSplashAndroid(filepath: string, dest: string) {
    await initCanvasKit();
    const splash = new ImageRenderer(filepath);
    splash.resize(1080, 1080).save(path.join(dest, 'drawable/splash.png'));
    splash.dispose();
}

export async function makeIconAndroid(filepath: string, dest: string) {
    await initCanvasKit();

    const icon = new ImageRenderer(filepath);
    const dpSize = 48;

    for (const density of densityTable) {
        const dir = `mipmap-${density.id}`;
        const size = Math.trunc(dpSize * density.scale);
        fs.mkdirSync(path.join(dest, dir), {recursive: true});
        const img = icon.resize(size, size);
        img.save(path.join(dest, dir, 'ic_launcher.png'));
    }

    icon.dispose();
}

export async function makeAdaptiveIconAndroid(adaptiveIcon: AdaptiveIconConfig, dest: string) {
    await initCanvasKit();

    const icon = new ImageRenderer(adaptiveIcon.foreground);
    const dpSize = 108;

    for (const density of densityTable) {
        const dir = `mipmap-${density.id}`;
        const size = Math.trunc(dpSize * density.scale);
        fs.mkdirSync(path.join(dest, dir), {recursive: true});
        const img = icon.resize(size, size);
        img.save(path.join(dest, dir, 'ic_launcher_foreground.png'));
    }

    icon.dispose();

    fs.mkdirSync(path.join(dest, 'mipmap-anydpi-v26'), {recursive: true});
    fs.writeFileSync(path.join(dest, 'mipmap-anydpi-v26', 'ic_launcher.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`);

    fs.mkdirSync(path.join(dest, 'values'), {recursive: true});
    fs.writeFileSync(path.join(dest, 'values', 'ic_launcher_background.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${adaptiveIcon.backgroundColor}</color>
</resources>`);
}