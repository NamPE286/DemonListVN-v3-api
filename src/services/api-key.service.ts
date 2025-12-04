import supabase from "@src/client/supabase";

export async function getAllAPIKey(uid: string) {
    const { data, error } = await supabase
        .from('APIKey')
        .select('*')
        .eq('uid', uid)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function createAPIKey(uid: string) {
    const { data, error } = await supabase
        .from('APIKey')
        .insert({ uid: uid })

    if (error) {
        throw new Error(error.message)
    }
}

export async function deleteAPIKey(uid: string, key: string) {
    const { error } = await supabase
        .from('APIKey')
        .delete()
        .match({ uid: uid, key: key })

    if (error) {
        throw new Error(error.message)
    }
}