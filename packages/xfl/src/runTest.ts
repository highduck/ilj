import {createAtlas, exportFlashAsset} from "./index";

async function runTest() {
    const atlasName = "main";
    const destDir = "output";
    const atlas = createAtlas(atlasName);
    await exportFlashAsset("Fizzy_shapes", "testData/pixiFlash/Fizzy_shapes", destDir, atlasName);
    // await exportFlashAsset("Fizzy", "testData/pixiFlash/Fizzy", destDir, atlasName);
    // await exportFlashAsset("Drawing", "testData/pixiFlash/Drawing", destDir, atlasName);
    // await exportFlashAsset("Masking", "testData/pixiFlash/Masking", destDir, atlasName);
    // await exportFlashAsset("Text", "testData/pixiFlash/Text", destDir, atlasName);
    // await exportFlashAsset("ColorEffects", "testData/pixiFlash/ColorEffects", destDir, atlasName);

    atlas.pack();
    atlas.save(destDir, 'png');
    atlas.dispose();
}

runTest().then();