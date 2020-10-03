import {buildTypeScript} from "../tsc/build";
import {buildRollup} from "../rollup/build";
import {fillDefaultOptionsRollup} from "../rollup/fillDefaultOptionsRollup";
import {fillDefaultOptionsTypeScript} from "../tsc/fillDefaultOptionsTypeScript";
import * as path from 'path';
import * as fs from 'fs';

process.chdir('./testData');
const cwd = process.cwd();

test("Build bundle from TypeScript", async (done) => {
    await buildTypeScript(fillDefaultOptionsTypeScript({
        tsconfig: './tsconfig.project.json',
        verbose: true,
        force: true
    }));

    let file = await fs.promises.readFile(path.join(cwd, 'dist/index.js'), 'utf-8');
    expect(file).toContain(`console.log("OK")`);
    expect(file).toContain(`result: "OK"`);


    await buildRollup(fillDefaultOptionsRollup({
        inputMain: 'dist/index.js'
    }));

    file = await fs.promises.readFile(path.join(cwd, 'www/modules/index.js'), 'utf-8');
    expect(file).toContain(`console.log("OK")`);
    expect(file).toContain(`result: "OK"`);

    done();
});
