import {PackagerContext} from "./PackagerContext";
import {WebRedirectConfig} from "./app-config";
import * as path from 'path';
import * as fs from 'fs';

function generateWebRedirect(redirects?: WebRedirectConfig): string {
    let script = "";
    console.warn(redirects);
    if (redirects && (redirects.android || redirects.ios)) {
        script += `try{`;
        if (redirects.android) {
            script += `if(navigator.userAgent.toLowerCase().indexOf("android")>=0){window.location.href="${redirects.android.url}";}`
        }
        if (redirects.ios) {
            // TODO: check ios browser
            // let isIOS = /iPad|iPhone|iPod/.test(navigator.platform)
            //     || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
        }
        script += `}catch(_){}`;
    }
    return script;
}

function generateSentryWrapper(context: PackagerContext): string {
    let script = "";
    const sentryApiUrl = context.options.config.sentry
    if (sentryApiUrl && context.options.buildMode === 'production') {
        script += fs.readFileSync(path.join(context.packagerPath, 'templates/_common/sentry.min.js'), 'utf-8');
        const name = context.options.config.name;
        const target = context.options.target;
        const version = context.options.config.version;
        script += `Sentry.init({dsn:'${sentryApiUrl}',release:'${name}-${target}@${version}'});`
    }
    return script;
}

export function generateStartupScript(packager: PackagerContext): string {
    const options = packager.options;
    const config = options.config;
    let script = "";
    if (options.platform === 'web') {
        console.warn(config);
        script += generateWebRedirect(config.mobileRedirect);
    }
    script += generateSentryWrapper(packager);
    if(options.flags.indexOf('ILJ_WEBGL_DEBUG') >= 0) {
        script += fs.readFileSync(path.join(packager.packagerPath, 'templates/_common/webgl-debug.js'));
    }
    return script;
}