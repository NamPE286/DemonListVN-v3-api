import supabase from "@src/database/supabase";
import Player from "@src/lib/classes/Player";

export async function getProductByID(id: number) {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq('id', id)
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function addNewOrder(orderID: number, productID: number, player: Player) {
    const { error } = await supabase
        .from("orders")
        .insert({ id: orderID, userID: player.uid!, state: "PENDING", quantity: 1, productID: productID })

    if (error) {
        throw error
    }
}

export async function changeOrderState(orderID: number, state: string) {
    const { error } = await supabase
        .from("orders")
        .update({ state: state })
        .eq("id", orderID)

    if (error) {
        throw error
    }
}