import {watch} from "../../index";

process.chdir('./testData');

test("Watch bundle", async (done) => {
    const result = await watch({
        inputMain: 'dist/index.js'
    });

    result.tscProcess.kill();
    result.watcher.close();

    done();
});
