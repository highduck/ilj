import {createAtlas, exportAtlases, exportFlashAsset} from "./index";

async function runTest() {
    const atlasName = "main";
    const destDir = "output";
    createAtlas(atlasName);
    await exportFlashAsset("test", "testData/test_fla", destDir, atlasName);
    exportAtlases(destDir);
}

runTest().then();