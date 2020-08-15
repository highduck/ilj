import {PWAProjectContext} from "./context";
import {writeFileSync} from "fs";
import path from "path";

export function createWebManifest(ctx: PWAProjectContext) {
    const data = {
        name: ctx.config.appName,
        short_name: ctx.config.appName, // TODO: maybe alternative name?
        icons: [
            {
                src: "/icons/app-icon-192.png",
                sizes: "192x192",
                type: "image/png"
            },
            {
                src: "/icons/app-icon-512.png",
                sizes: "512x512",
                type: "image/png"
            }
        ],
        theme_color: "#ffffff",
        background_color: "#000000",
        display: "fullscreen",
        // TODO:
        // prefer_related_applications: true,
        // related_applications: [
        //     {
        //         platform: "play",
        //         url: "https://play.google.com/store/apps/details?id=i.have.to.flap",
        //         id: "i.have.to.flap"
        //     },
        //     {
        //         platform: "itunes",
        //         url: "https://itunes.apple.com/app/ihavetoflap/id1504152249"
        //     }
        // ]
    }

    writeFileSync(path.join(ctx.inputDirPub, 'site.webmanifest'), JSON.stringify(data), 'utf8');
}