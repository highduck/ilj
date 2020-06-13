declare module '@rollup/plugin-babel' {
    import {Plugin} from 'rollup';

    export function babel(options?: any): Plugin;
}

declare module '@rollup/plugin-strip' {
    import {Plugin} from 'rollup';

    export default function (options?: {
        include?: RegExp | string
    }): Plugin;
}

declare module 'rollup-plugin-glslify' {
    import {Plugin} from 'rollup';

    export default function (options?: {
        include?: (RegExp | string)[]
    }): Plugin;
}

declare module 'rollup-plugin-visualizer' {
    import {Plugin} from 'rollup';

    export default function (options?: any): Plugin;
}

declare module 'rollup-plugin-size-snapshot' {
    import {Plugin} from 'rollup';

    export function sizeSnapshot(options?: any): Plugin;
}

declare module '@rollup/plugin-virtual' {
    import {Plugin} from 'rollup';

    export default function virtual(options?: any): Plugin;
}
