import {readFileSync, writeFileSync} from "fs";
import path from "path";
import {AndroidSigningConfig, AndroidSigningConfigurations, AndroidProjectContext} from "./context";

export function setupSigning(ctx: AndroidProjectContext) {
    const keyPath = ctx.config.keys;
    if (!keyPath) {
        return;
    }

    const configPath = path.join(keyPath, 'android_signing.json');

    console.log("setup android signing keys");
    const configDir = path.dirname(configPath);
    const config = JSON.parse(readFileSync(configPath, 'utf8')) as AndroidSigningConfigurations;
    const appDir = path.join(ctx.genProjDir, 'app');
    {
        const filepath = path.join(appDir, 'build.gradle');
        let content = readFileSync(filepath, 'utf8');
        content = replaceSigningConfig(content, 'debug', configDir, appDir, config.debug);
        content = replaceSigningConfig(content, 'release', configDir, appDir, config.release);
        writeFileSync(filepath, content);
    }
}

function replaceSigningConfig(content: string,
                              mode: string,
                              basedir: string,
                              androidAppDir: string,
                              config?: AndroidSigningConfig): string {
    if (config) {
        const keyPathDebug = path.resolve(basedir, config.storeFilePath);
        content = content.replace(`/**{SIGNING_CONFIG: ${mode}}**/`,
            `${mode} {
    storeFile file('${path.relative(androidAppDir, keyPathDebug)}')
    storePassword '${config.storePassword}'
    keyAlias = '${config.keyAlias}'
    keyPassword '${config.keyPassword}'
}`);

        content = content.replace(`/**{SIGNING_ENABLE: ${mode}}**/`,
            `signingConfig signingConfigs.${mode}`);
    }
    return content;
}