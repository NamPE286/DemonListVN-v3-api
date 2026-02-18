import { createClient } from '@supabase/supabase-js'
import type { Database } from '@src/types/supabase'
import { camelizeDeep, snakeCaseDeep, snakeCaseExpression, toSnakeCase } from '@src/utils/casing'

const rawSupabase = createClient<Database>(process.env.SUPABASE_API_URL!, process.env.SUPABASE_API_KEY!)

function wrapQueryBuilder<T>(queryBuilder: T): T {
    if (!queryBuilder || typeof queryBuilder !== 'object') {
        return queryBuilder;
    }

    return new Proxy(queryBuilder as object, {
        get(target, prop, receiver) {
            if (prop === 'then') {
                return (onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
                    Promise.resolve(target).then((result: unknown) => {
                        if (!result || typeof result !== 'object' || !('data' in (result as object))) {
                            return onFulfilled ? onFulfilled(result) : result;
                        }

                        const transformedResult = {
                            ...(result as Record<string, unknown>),
                            data: camelizeDeep((result as { data: unknown }).data)
                        };

                        return onFulfilled ? onFulfilled(transformedResult) : transformedResult;
                    }, onRejected);
            }

            const original = Reflect.get(target, prop, receiver);
            if (typeof original !== 'function') {
                return original;
            }

            return (...args: unknown[]) => {
                let transformedArgs = args;

                if (typeof prop === 'string') {
                    if (prop === 'select') {
                        transformedArgs = args.map((value, index) => index === 0 && typeof value === 'string'
                            ? snakeCaseExpression(value)
                            : value);
                    } else if (prop === 'order' || prop === 'eq' || prop === 'neq' || prop === 'gt'
                        || prop === 'gte' || prop === 'lt' || prop === 'lte' || prop === 'like'
                        || prop === 'ilike' || prop === 'is' || prop === 'contains' || prop === 'containedBy'
                        || prop === 'overlaps' || prop === 'rangeGt' || prop === 'rangeGte'
                        || prop === 'rangeLt' || prop === 'rangeLte' || prop === 'textSearch'
                        || prop === 'in') {
                        transformedArgs = args.map((value, index) => {
                            if (index !== 0 || typeof value !== 'string') {
                                return value;
                            }

                            return snakeCaseExpression(value);
                        });
                    } else if (prop === 'match') {
                        transformedArgs = args.map((value, index) => index === 0 ? snakeCaseDeep(value) : value);
                    } else if (prop === 'insert' || prop === 'update' || prop === 'upsert') {
                        transformedArgs = args.map((value, index) => index === 0 ? snakeCaseDeep(value) : value);
                    }
                }

                const nextResult = original.apply(target, transformedArgs);
                return wrapQueryBuilder(nextResult);
            };
        }
    }) as T;
}

const supabase = new Proxy(rawSupabase, {
    get(target, prop, receiver) {
        if (prop === 'from') {
            return (table: string) => wrapQueryBuilder((target.from as (relation: string) => unknown)(toSnakeCase(table)));
        }

        if (prop === 'rpc') {
            return (fn: string, args?: object, options?: object) =>
                wrapQueryBuilder((target.rpc as (name: string, params?: object, rpcOptions?: object) => unknown)(
                    toSnakeCase(fn),
                    args ? snakeCaseDeep(args) : undefined,
                    options
                ));
        }

        const original = Reflect.get(target, prop, receiver);
        if (typeof original !== 'function') {
            return original;
        }

        return original.bind(target);
    }
});

export default supabase
