const WHITESPACE = [
    '\n'.charCodeAt(0),
    '\r'.charCodeAt(0),
    ' '.charCodeAt(0),
    '\t'.charCodeAt(0)
];

const CMD = [
    '!'.charCodeAt(0),
    '|'.charCodeAt(0),
    '/'.charCodeAt(0),
    '['.charCodeAt(0),
    ']'.charCodeAt(0),
    'S'.charCodeAt(0)
];

export const enum EdgeSelectionBit {
    FillStyle0 = 1,
    FillStyle1 = 2,
    Stroke = 4
}

/**
 explanation:
    https://stackoverflow.com/questions/4077200/whats-the-meaning-of-the-non-numerical-values-in-the-xfls-edge-definition
 */

function readDoubleHex(str: string): number {
    if (str[0] === '#') {
        const parts = str.substr(1).split('.');
        let m = parts[0];
        if (parts.length === 1) {
            m += "00";
        } else {
            const x = parts[1];
            m += x;
            if (x.length === 0) {
                m += "00";
            } else if (x.length === 1) {
                m += "0";
            }
        }
        let hex = parseInt(m, 16);
        if ((hex & 0x80000000) !== 0) {
            hex = -(~hex) - 1;
        }
        return hex / 255.0;
    }

    // default floating point format
    return parseFloat(str);
}

function readTwips(str: string): number {
    return readDoubleHex(str) / 20.0;
}

function getValueLength(str: string, start: number): number {
    let len = 0;
    for (let i = start; i < str.length; ++i) {
        if (WHITESPACE.indexOf(str.charCodeAt(i)) >= 0 ||
            CMD.indexOf(str.charCodeAt(i)) >= 0) {
            break;
        }
        ++len;
    }
    return len;
}

export function parseEdges(data: string, out_commands: Array<number>, out_values: Array<number>) {
    if (!data) {
        return;
    }

    for (let i = 0; i < data.length; ++i) {
        const c = data.charCodeAt(i);
        if (WHITESPACE.indexOf(c) >= 0) {
            continue;
        }
        const cmd = CMD.indexOf(c);
        if (cmd >= 0) {
            out_commands.push(cmd);
        } else {
            const len = getValueLength(data, i);
            out_values.push(readTwips(data.substr(i, len)));
            i += len - 1;
        }
    }
}