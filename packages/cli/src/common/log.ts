import chalk from "chalk";
import util from "util";

function pr(xs: any[], cf: chalk.ChalkFunction) {
    return xs.map((x) => cf(
        typeof x === 'string' ? x : util.inspect(x, {colors: true})
    ));
}

export default {
    debug: (...args: any[]) => console.log(...pr(args, chalk.cyan)),
    log: (...args: any[]) => console.log(...pr(args, chalk.blue)),
    info: (...args: any[]) => console.info(...pr(args, chalk.green)),
    warn: (...args: any[]) => console.warn(...pr(args, chalk.yellow.bold)),
    error: (...args: any[]) => console.error(...pr(args, chalk.red.bold)),
};