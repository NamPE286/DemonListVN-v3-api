type Primitive = string | number | boolean | bigint | symbol | null | undefined | Date

export type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${P1}${Uppercase<P2>}${CamelCase<P3>}`
    : S

export type CamelizeDeep<T> =
    T extends Primitive ? T
    : T extends Array<infer U> ? Array<CamelizeDeep<U>>
    : T extends Record<string, unknown>
        ? { [K in keyof T as K extends string ? CamelCase<K> : K]: CamelizeDeep<T[K]> }
        : T

const WORDS_TO_KEEP = new Set([
    'asc',
    'desc',
    'nullsfirst',
    'nullslast',
    'inner',
    'left',
    'right',
    'full',
    'exact',
    'planned',
    'estimated'
]);

export function toSnakeCase(value: string): string {
    return value
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[-\s]+/g, '_')
        .toLowerCase();
}

export function toCamelCase(value: string): string {
    return value.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function snakeCaseExpression(value: string): string {
    return value.replace(/\b[A-Za-z][A-Za-z0-9_]*\b/g, (word) => {
        const lowerWord = word.toLowerCase();
        if (WORDS_TO_KEEP.has(lowerWord)) {
            return word;
        }

        return toSnakeCase(word);
    });
}

export function snakeCaseDeep<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map(item => snakeCaseDeep(item)) as T;
    }

    if (!value || typeof value !== 'object' || value instanceof Date) {
        return value;
    }

    const result: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
        result[toSnakeCase(key)] = snakeCaseDeep(nestedValue);
    }

    return result as T;
}

export function camelizeDeep<T>(value: T): CamelizeDeep<T> {
    if (Array.isArray(value)) {
        return value.map(item => camelizeDeep(item)) as CamelizeDeep<T>;
    }

    if (!value || typeof value !== 'object' || value instanceof Date) {
        return value as CamelizeDeep<T>;
    }

    const result: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
        result[toCamelCase(key)] = camelizeDeep(nestedValue);
    }

    return result as CamelizeDeep<T>;
}
