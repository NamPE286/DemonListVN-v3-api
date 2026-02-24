import { createClient } from '@supabase/supabase-js'
import type { Database } from '@src/types/supabase'
import { camelizeDeep } from '@src/utils/casing'

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
                const nextResult = original.apply(target, args);
                return wrapQueryBuilder(nextResult);
            };
        }
    }) as T;
}

const supabase = new Proxy(rawSupabase, {
    get(target, prop, receiver) {
        if (prop === 'from') {
            return (table: string) => wrapQueryBuilder((target.from as (relation: string) => unknown)(table));
        }

        if (prop === 'rpc') {
            return (fn: string, args?: object, options?: object) =>
                wrapQueryBuilder((target.rpc as (name: string, params?: object, rpcOptions?: object) => unknown)(
                    fn,
                    args,
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
