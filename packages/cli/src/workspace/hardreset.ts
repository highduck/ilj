import {execute} from "../common/utility";

function sh(cmd: string) {
    const args = cmd.split(' ');
    const bin = args.shift();
    if (bin !== undefined) {
        execute(bin, args);
    }
}

sh('yarn workspaces foreach -v -i -p run clean');
sh('yarn cache clean --all');
sh('yarn rimraf ./**/node_modules/');
sh('yarn');
