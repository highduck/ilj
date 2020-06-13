import {buildTypeScript, compileBundle} from '../dist/index.js';

(async () => {
    buildTypeScript({
        configPath: './tsconfig.esm.json',
        verbose: true,
        force: true
    });

    const module = await import('./dist/index.js');
    if (module?.default?.result === 'OK') {
        console.log("OK");

        await compileBundle({
            inputMain: 'dist/index.js'
        });

        const ss = await import('./www/modules/index.js');
        console.log(ss);

    } else {
        console.error("test output mismatch", module);
    }
})();