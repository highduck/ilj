import {createAtlas, exportFlashAsset} from "./export/Export";

async function runTest() {
    const atlasName = "main";
    const destDir = "output";
    const atlas = createAtlas(atlasName);
    await exportFlashAsset("1", "testData/1", destDir, atlasName, 1);
    atlas.trimSprites();
    atlas.addSpot();
    atlas.pack();
    atlas.save(destDir, 'png');
    atlas.dispose();
}

runTest().then();