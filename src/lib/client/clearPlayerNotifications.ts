import supabase from "@src/database/supabase"

export async function clearPlayerNotifications(uid: string) {
    var { error } = await supabase
        .from('notifications')
        .delete()
        .eq('to', uid)

    if (error) {
        throw error
    }
}
