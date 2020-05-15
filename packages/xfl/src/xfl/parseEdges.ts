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
function parseFixedFloat24_8(str: string): number {
    const parts = str.split('.');
    let i = parseInt(parts[0], 16) << 8;
    if (parts.length > 1) {
        let sf = parts[1];
        while (sf.length < 2) {
            sf += '0';
        }
        i = i | parseInt(sf, 16);
    }
    if ((i & 0x80000000) !== 0) {
        i = (-(~i)) - 1;
    }
    return i / (1 << 8);
}

function parseValue(str: string): number {
    if (str.length === 0) {
        return 0.0;
    }
    if (str[0] === '#') {
        return parseFixedFloat24_8(str.substr(1));
    }
    // default floating point format
    return parseFloat(str);
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

export function parseEdges(data: string, outCommands: number[], outValues: number[]) {
    for (let i = 0; i < data.length; ++i) {
        const c = data.charCodeAt(i);
        if (WHITESPACE.indexOf(c) >= 0) {
            continue;
        }
        const cmd = CMD.indexOf(c);
        if (cmd >= 0) {
            outCommands.push(cmd);
        } else {
            const len = getValueLength(data, i);
            const twips = parseValue(data.substr(i, len))
            outValues.push(twips / 20);
            i += len - 1;
        }
    }
}