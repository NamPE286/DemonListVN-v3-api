import { createClient } from '@supabase/supabase-js'
import type { Database } from '@src/types/supabase'
import type { CamelizeDeep } from '@src/utils/casing'
import { camelizeDeep } from '@src/utils/casing'


type CamelizedQueryResult<T> = T extends { data: infer D }
    ? Omit<T, 'data'> & { data: CamelizeDeep<D> }
    : T

type CamelizedQueryBuilder<T> = Omit<T, 'then'> & {
    then<TResult1 = CamelizedQueryResult<Awaited<T>>, TResult2 = never>(
        onfulfilled?: ((value: CamelizedQueryResult<Awaited<T>>) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2>
}

const rawSupabase = createClient<Database>(process.env.SUPABASE_API_URL!, process.env.SUPABASE_API_KEY!)

type RawSupabaseClient = typeof rawSupabase
type ProxiedSupabaseClient = Omit<RawSupabaseClient, 'from' | 'rpc'> & {
    from: (...args: Parameters<RawSupabaseClient['from']>) => CamelizedQueryBuilder<ReturnType<RawSupabaseClient['from']>>
    rpc: (...args: Parameters<RawSupabaseClient['rpc']>) => CamelizedQueryBuilder<ReturnType<RawSupabaseClient['rpc']>>
}

function wrapQueryBuilder<T>(queryBuilder: T): CamelizedQueryBuilder<T> {
    if (!queryBuilder || typeof queryBuilder !== 'object') {
        return queryBuilder as CamelizedQueryBuilder<T>;
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
    }) as CamelizedQueryBuilder<T>;
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
}) as unknown as ProxiedSupabaseClient;

export default supabase
