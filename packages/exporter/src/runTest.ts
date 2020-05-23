import {createAtlas, exportFlashAsset} from "./index";

async function runTest() {
    const atlasName = "main";
    const destDir = "output";
    const atlas = createAtlas(atlasName);
    await exportFlashAsset("1", "testData/1", destDir, atlasName);
    atlas.trimSprites();
    atlas.addSpot();
    atlas.pack();
    atlas.save(destDir, 'png');
    atlas.dispose();
}

runTest().then();