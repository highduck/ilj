import {AnimateDoc} from "./xfl/AnimateDoc";

async function runTest() {
    AnimateDoc.openFromPath('testData/test_fla');
    AnimateDoc.openFromPath('testData/tests');
}

runTest().then();