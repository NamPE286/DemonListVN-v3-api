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

export async function getOrderByID(id: number) {
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq('id', id)
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function addNewOrder(orderID: number, productID: number, userID: string, quantity: number, giftTo: string | null = null) {
    const { error } = await supabase
        .from("orders")
        .insert({ id: orderID, userID: userID, state: "PENDING", quantity: quantity, productID: productID, giftTo: giftTo })

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