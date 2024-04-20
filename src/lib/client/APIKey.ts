import supabase from "@src/database/supabase";

export async function createAPIKey(uid: string) {
    const { data, error } = await supabase
        .from('APIKey')
        .insert({ uid: uid })

    if (error) {
        throw error
    }
}

export async function deleteAPIKey(uid: string, key: string) {
    const { error } = await supabase
        .from('APIKey')
        .delete()
        .match({ uid: uid, key: key })

    if(error) {
        throw error
    }
}