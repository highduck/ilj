export interface StringToken {
    kind: 0 | 1;
    value: string;
}

export function parseString(input: string): StringToken[] {
    const tokens: StringToken[] = [];

    let begin = input.indexOf('{{');
    let prev = 0;
    while (begin >= 0) {
        const end = input.indexOf('}}', begin + 2);
        if (end >= begin + 2) {
            if (begin > prev) {
                tokens.push({kind: 0, value: input.substring(prev, begin)});
            }
            if (begin + 2 < end) {
                tokens.push({kind: 1, value: input.substring(begin + 2, end)});
            }
            prev = end + 2;
        }
        begin = input.indexOf('{{', prev);
    }
    if (prev < input.length) {
        tokens.push({kind: 0, value: input.substring(prev)});
    }
    return tokens;
}

interface Dictionary<T> {
    [key: string]: T;
}

interface TokensMap extends Map<string, StringToken[]> {
}

const _store = {
    version: 0,
    locale: new Map<string, StringToken[]>(),
    variables: new Map<string, StringToken[]>()
};

function loadIntoStore(target: TokensMap, data: Dictionary<string>) {
    for (const key of Object.keys(data)) {
        target.set(key, parseString(data[key]));
    }
}

export function setLocale(base: any, data?: any) {
    _store.locale.clear();
    if (base) {
        loadIntoStore(_store.locale, base);
    }
    if (data && base !== data) {
        loadIntoStore(_store.locale, data);
    }
    ++_store.version;
}

const EMPTY_TOKENS: StringToken[] = [];

export function getStringTokens(key: string): StringToken[] {
    let r = _store.locale.get(key);
    if(r !== undefined) {
        return r;
    }
    r = _store.variables.get(key);
    if(r !== undefined) {
        return r;
    }
    return EMPTY_TOKENS;
}

export function renderString(tokens: StringToken[]): string {
    let result = '';
    for (const tk of tokens) {
        if (tk.kind === 0) {
            result += tk.value;
        } else if (tk.kind === 1) {
            result += renderString(getStringTokens(tk.value));
        }
    }
    return result;
}

export function getString(key: string): string {
    return renderString(getStringTokens(key));
}

export function getStringRepoVersion(): number {
    return _store.version;
}