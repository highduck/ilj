import {execute} from "../common/utility";

import resolve from 'resolve';

const bin = resolve.sync("@capacitor/cli/bin/capacitor");

export function cap(...args: any[]) {
    execute(bin, args);
}