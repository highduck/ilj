import {loadFlashArchive} from "./xfl/loadFlashArchive";
import {FlashFile} from './xfl/FlashFile';
import {FlashDocExporter} from "./exporter/FlashDocExporter";
import {Atlas} from "./spritepack/SpritePack";
import {loadCanvasContext} from "./rasterizer/CanvasKitHelpers";
import fs from "fs";
import path from "path";
import {encode} from 'fast-png';

export * from './xfl/FlashFile';

function isDir(p: string) {
    return fs.existsSync(p) && fs.lstatSync(p).isDirectory();
}

function makeDirs(p: string) {
    if (!isDir(p)) {
        fs.mkdirSync(p, {recursive: true});
    }
}

async function main() {
    const ck = await loadCanvasContext();
    console.warn("CANVASKIT-WASM loaded!");

    const name = 'test_fla';
    const e = loadFlashArchive('testData/' + name);
    if (e !== undefined) {
        const ff = new FlashFile(e);
        const fe = new FlashDocExporter(ff);
        fe.buildLibrary();
        const mainAtlas = new Atlas();
        // mainAtlas.resolutions = [
        //     new AtlasResolution(0, 4)
        // ];
        fe.buildSprites(mainAtlas);

        const destDir = 'output/' + name;
        makeDirs(destDir);
        for (const res of mainAtlas.resolutions) {
            const output = path.join(destDir, `images/x${res.scale}`);
            for (const spr of res.sprites) {
                if (spr.image !== undefined && spr.image.data !== undefined) {
                    console.log(spr.name + " " + spr.image.width + " " + spr.image.height);
                    const dest = path.join(output, spr.name + ".png");
                    makeDirs(path.dirname(dest));
                    const png = encode({
                        width: spr.image.width,
                        height: spr.image.height,
                        data: spr.image.data,
                        depth: 8,
                        channels: 4
                    });
                    fs.writeFileSync(dest, png);
                }
            }
        }

        // save test scene
        fs.writeFileSync(
            path.join(destDir, name + '.ani.json'),
            JSON.stringify(fe.exportLibrary().serialize())
        );
        //


        ////
//     make_dirs(data.output);
//     working_dir_t::with(data.output, [&] {
//         EK_DEBUG << "Export Flash asset: " << current_working_directory();
// //        spritepack::export_atlas(temp_atlas);
//         auto sg_data = fe.export_library();
//
//         // binary export
//         // output_memory_stream out{100};
//         // IO io{out};
//         // io(sg_data);
//         // ek::save(out, name_ + ".sg");
//
//         // json export
//         ek::save(to_json_str(sg_data), path_t{name_ + ".ani.json"});
//     });
//
//     data.meta("atlas", name_);
//     data.meta("scene", name_);
    }
}


main().then();