export const enum StringTokenKind {
    Value = 0,
    Key = 1
}

export class StringTokenArray {
    static EMPTY = new StringTokenArray();

    kinds: StringTokenKind[] = [StringTokenKind.Value];
    values: string[] = [''];
    count = 0;
}

export function parseString(input: string, out: StringTokenArray) {
    out.count = 0;

    let i = 0;
    let begin = input.indexOf('{{');
    let prev = 0;
    while (begin >= 0) {
        const end = input.indexOf('}}', begin + 2);
        if (end >= begin + 2) {
            if (begin > prev) {
                out.kinds[i] = StringTokenKind.Value;
                out.values[i] = input.substring(prev, begin);
            }
            if (begin + 2 < end) {
                out.kinds[i] = StringTokenKind.Key;
                out.values[i] = input.substring(begin + 2, end);
            }
            ++out.count;
            prev = end + 2;
        }
        begin = input.indexOf('{{', prev);
    }
    if (prev < input.length) {
        out.kinds[out.count] = StringTokenKind.Value;
        out.values[out.count] = input.substring(prev);
        ++out.count;
    }
}

interface Dictionary<T> {
    [key: string]: T;
}

type TokensMap = Map<string, StringTokenArray>;

const _store = {
    version: 0,
    locale: new Map() as TokensMap,
    variables: new Map() as TokensMap
};

function loadIntoStore(target: TokensMap, data: Dictionary<string>) {
    for (const key of Object.keys(data)) {
        const v = new StringTokenArray();
        parseString(data[key], v)
        target.set(key, v);
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

export function getStringTokens(key: string): StringTokenArray {
    let r = _store.locale.get(key);
    if (r !== undefined) {
        return r;
    }
    r = _store.variables.get(key);
    if (r !== undefined) {
        return r;
    }
    return StringTokenArray.EMPTY;
}

export function renderString(tokens: StringTokenArray): string {
    let result = '';
    for (let i = 0, e = tokens.count; i < e; ++i) {
        const kind = tokens.kinds[i];
        const value = tokens.values[i];
        if (kind === StringTokenKind.Value) {
            result += value;
        } else if (kind === 1) {
            result += renderString(getStringTokens(value));
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