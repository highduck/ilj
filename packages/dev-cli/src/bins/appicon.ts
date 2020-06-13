import {execute} from "../common/utility";

import resolve from 'resolve';

const bin = resolve.sync("app-icon/bin/app-icon.js");

export function appicon(...args: any[]) {
    execute(bin, args);
}