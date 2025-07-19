import supabase from "@src/database/supabase";
import type Player from "@src/lib/classes/Player";
import type { Tables, TablesInsert } from "@src/lib/types/supabase";

interface Item {
    id: number;
    quantity: number;
}

export async function getProducts(ids: number[] | null = []) {
    const query = supabase
        .from("products")
        .select("*")

    if (ids !== null) {
        query.in('id', ids)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
        throw error
    }

    return data
}

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

export async function addNewOrder(
    orderID: number,
    productID: number | null,
    userID: string,
    quantity: number | null,
    giftTo: string | null,
    amount: number,
    currency: string,
    paymentMethod: string = "Bank Transfer",
    address: string | null = null,
    phone: number | null = null,
    fee: number = 0
) {
    const { error } = await supabase
        .from("orders")
        .insert({
            id: orderID,
            userID: userID,
            state: "PENDING",
            quantity: quantity,
            productID: productID,
            giftTo: giftTo, amount: amount,
            currency: currency,
            paymentMethod: paymentMethod,
            address: address,
            phone: phone,
            fee: fee
        })

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

export async function updateStock(items: TablesInsert<"orderItems">[], products: Tables<"products">[]) {
    const sortedProducts = products.sort((a, b) => a.id - b.id);
    const sortedItems = items.sort((a, b) => a.productID - b.productID);

    for (let i = 0; i < sortedItems.length; i++) {
        const product = sortedProducts[i];
        const item = sortedItems[i];

        if (product.id !== item.productID) {
            throw new Error("Product ID mismatch");
        }

        if (product.stock === null) {
            continue
        }

        if (product.stock < item.quantity!) {
            throw new Error(`Insufficient stock for product ID ${product.id}`);
        }

        product.stock -= item.quantity!;
    }

    const { error } = await supabase
        .from("products")
        .upsert(sortedProducts);

    if (error) {
        throw error;
    }
}

export async function addOrderItems(
    buyer: Player,
    items: TablesInsert<"orderItems">[],
    address: string,
    phone: number,
    paymentMethod: "Bank Transfer" | "COD"
) {
    items = items.sort((a, b) => a.productID - b.productID);

    const ids: number[] = []
    const orderID = new Date().getTime();

    for (const i of items) {
        i.orderID = orderID
    }

    for (const i of items) {
        ids.push(i.productID)
    }

    const products = (await getProducts(ids)).sort((a, b) => a.id - b.id);
    let amount = 0, fee = 0;

    if (paymentMethod == 'COD') {
        fee = 25000
    }

    await updateStock(items, products)

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const product = products[i];

        if (product.price === null) {
            throw new Error(`Product ID ${product.id} has no price`);
        }

        amount += product.price * item.quantity!;
    }

    await addNewOrder(orderID, null, buyer.uid!, null, null, amount, 'VND', paymentMethod, address, phone, fee)

    const { error } = await supabase
        .from('orderItems')
        .insert(items)

    if (error) {
        throw error
    }
}