import {createAtlas, exportAtlases, exportFlashAsset} from "./index";

async function runTest() {
    const atlasName = "main";
    const destDir = "output";
    createAtlas(atlasName);
    await exportFlashAsset("parrot", "testData/parrot", destDir, atlasName);
    exportAtlases(destDir);
}

runTest().then();