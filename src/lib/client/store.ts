import supabase from "@src/database/supabase";

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

export async function addNewOrder(orderID: number, productID: number, userID: string, quantity: number, giftTo: string | null = null, amount: number, currency: string) {
    const { error } = await supabase
        .from("orders")
        .insert({ id: orderID, userID: userID, state: "PENDING", quantity: quantity, productID: productID, giftTo: giftTo, amount: amount, currency: currency })

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

export async function getOrders(userID: string) {
    const { data, error } = await supabase
        .from("orders")
        .select("*, products(*), coupons(*)")
        .eq("userID", userID)
        .order("created_at", { ascending: false })

    if (error) {
        throw error
    }

    return data
}