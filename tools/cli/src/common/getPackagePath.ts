import resolve from "resolve";
import {dirname, join} from "path";

export default function getPackagePath(id: string, from: string): string {
    return dirname(resolve.sync(join(id, 'package.json'), {basedir: from}));
}