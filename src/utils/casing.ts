import camelize, { type Camelize } from 'camelize-ts'
import snakify from 'snakify-ts'

export type CamelizeDeep<T> = Camelize<T>

const WORDS_TO_KEEP = new Set([
    // PostgREST select/order keywords and count hints that should not be renamed.
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
    return snakify<string>(value) as string;
}

export function toCamelCase(value: string): string {
    return camelize<string>(value) as string;
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
    return snakify(value) as T;
}

export function camelizeDeep<T>(value: T): CamelizeDeep<T> {
    return camelize(value) as CamelizeDeep<T>;
}
