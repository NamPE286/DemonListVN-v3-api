import { createClient } from '@supabase/supabase-js'
import type { Database } from '@src/types/supabase'
import type { CamelizeDeep } from '@src/utils/casing'
import { camelizeDeep } from '@src/utils/casing'

type CamelizedQueryResult<T> = T extends { data: infer D }
    ? Omit<T, 'data'> & { data: CamelizeDeep<D> }
    : T

const rawSupabase = createClient<Database>(process.env.SUPABASE_API_URL!, process.env.SUPABASE_API_KEY!)

function wrapQueryBuilder<T>(queryBuilder: T): T {
    if (!queryBuilder || typeof queryBuilder !== 'object') {
        return queryBuilder;
    }

    return new Proxy(queryBuilder as object, {
        get(target, prop, receiver) {
            if (prop === 'then') {
                return (onFulfilled?: (value: CamelizedQueryResult<Awaited<T>>) => unknown, onRejected?: (reason: unknown) => unknown) =>
                    Promise.resolve(target).then((result: unknown) => {
                        if (!result || typeof result !== 'object' || !('data' in result)) {
                            return onFulfilled ? onFulfilled(result as CamelizedQueryResult<Awaited<T>>) : result;
                        }

                        const transformedResult = {
                            ...(result as Record<string, unknown>),
                            data: camelizeDeep((result as { data: unknown }).data)
                        } as CamelizedQueryResult<Awaited<T>>;

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
        const original = Reflect.get(target, prop, receiver);

        if (prop === 'from' || prop === 'rpc') {
            if (typeof original === 'function') {
                return (...args: unknown[]) => wrapQueryBuilder(original.apply(target, args));
            }
        }

        if (typeof original !== 'function') {
            return original;
        }

        return original.bind(target);
    }
});

export default supabase
