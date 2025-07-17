import supabase from "@src/database/supabase";
import type Player from "@src/lib/classes/Player";

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
        .select("*, products(*), coupons(*), players!giftTo(*, clans!id(*))")
        .eq("userID", userID)
        .order("created_at", { ascending: false })

    if (error) {
        throw error
    }

    return data
}

export async function getCoupon(code: string) {
    const { data, error } = await supabase
        .from('coupons')
        .select('*, products(*)')
        .eq('code', code)
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function redeem(code: string, player: Player) {
    const coupon = await getCoupon(code);
    const product = coupon.products

    if (product === null) {
        throw new Error("Coupon is for discount only");
    }

    delete (coupon as { products?: any }).products


    if (coupon.usageLeft == 0) {
        throw new Error("Coupon is out of usage")
    }

    if (new Date(coupon.created_at) > new Date()) {
        throw new Error("Coupon is expired")
    }

    let amount = product.price * coupon.quantity * (1 - coupon.percent) - coupon.deduct

    if (amount > 0) {
        return;
    }

    coupon.usageLeft--;

    const { error } = await supabase
        .from('coupons')
        .upsert(coupon)

    if (error) {
        throw error
    }

    await player.extendSupporter(coupon.quantity)
}