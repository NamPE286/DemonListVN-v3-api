import supabase from "@src/client/supabase";
import type { Tables, TablesInsert } from "@src/types/supabase";
import { sendNotification } from '@src/services/notification.service'
import { sendMessageToChannel } from '@src/services/discord.service';
import type { Response } from 'express';
import { handleProduct } from "@src/services/handle-product.service";
import { sepay } from "@src/client/sepay";
import type { SepayWebhookOrder } from "@src/types/sepay-webhook";
import { getClan, extendClanBoost } from "@src/services/clan.service";
import { getPlayer, extendPlayerSupporter } from "@src/services/player.service";

interface Item {
    id: number;
    quantity: number;
}

export async function getProducts(ids: number[] | null = [], includeHidden: boolean = false) {
    const query = supabase
        .from("products")
        .select("*")

    if (!includeHidden) {
        query.eq('hidden', false)
    }

    if (ids !== null) {
        query.in('id', ids)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
        throw new Error(error.message)
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
        throw new Error(error.message)
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
    fee: number = 0,
    recipientName: string | null = null,
    targetClanID: number | null = null,
    data: any = null

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
            fee: fee,
            recipientName: recipientName,
            targetClanID: targetClanID,
            data: data
        })

    if (error) {
        throw new Error(error.message)
    }
}

export async function changeOrderState(orderID: number, state: string) {
    const { error } = await supabase
        .from("orders")
        .update({ state: state })
        .eq("id", orderID)

    if (error) {
        throw new Error(error.message)
    }
}

export async function getOrders(userID: string) {
    // @ts-ignore
    const { data, error } = await supabase
        .from("orders")
        .select("*, products(*), coupons(*), players!giftTo(*, clans!id(*)), record_cards!orderID(*)")
        .eq("userID", userID)
        .order("created_at", { ascending: false })
        .returns<(Tables<"orders"> & { products: Tables<"products"> | null, coupons: Tables<"coupons"> | null, players: (Tables<"players"> & { clans: Tables<"clans"> | null }) | null })[]>()

    if (error) {
        throw new Error(error.message)
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
        throw new Error(error.message)
    }

    return data
}

export async function redeem(code: string, player: Tables<"players">) {
    const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("userID", player.uid!)
        .eq("address", code)
        .eq("paymentMethod", "Coupon")
        .limit(1);

    if (existingOrder && existingOrder.length > 0) {
        throw new Error("You have already redeemed this coupon");
    }

    const coupon = await getCoupon(code);
    const product = coupon.products

    if (product === null) {
        throw new Error("Coupon is for discount only");
    }

    if (coupon.productID == 3 && !player.clan) {
        throw new Error("Player is not in a clan")
    }

    delete (coupon as { products?: any }).products


    if (coupon.usageLeft == 0) {
        throw new Error("Coupon is out of usage")
    }

    if (new Date(coupon.validUntil) < new Date()) {
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
        throw new Error(error.message)
    }

    if (coupon.productID == 1) {
        await extendPlayerSupporter(player.uid!, coupon.quantity)
    }

    if (coupon.productID == 3) {
        await extendClanBoost(player.clan!, coupon.quantity)
    }

    if (coupon.productID == 4) {
        await extendPlayerSupporter(player.uid!, 0, coupon.quantity)
    }

    const orderID = new Date().getTime();
    await addNewOrder(
        orderID,
        coupon.productID,
        player.uid!,
        coupon.quantity,
        null,
        amount,
        'VND',
        'Coupon',
        code,
        null,
        0,
        null,
        coupon.productID == 3 ? player.clan : null
    );

    await changeOrderState(orderID, 'PAID');
}

export async function updateStock(items: TablesInsert<"orderItems">[], products: Tables<"products">[]) {
    const sortedProducts = [...new Map(products.map(products => [products.id, products])).values()]
        .sort((a, b) => a.id - b.id);
    const sortedItems = items.sort((a, b) => a.productID - b.productID);

    for (const item of sortedItems) {
        const product = sortedProducts.find(p => p.id === item.productID);

        if (!product) {
            throw new Error(`Product ID ${item.productID} not found`);
        }

        if (product.stock === null) {
            continue
        }

        if (product.stock < (item.quantity || 0)) {
            throw new Error(`Insufficient stock for product ID ${product.id}`);
        }

        if (product.maxQuantity && product.maxQuantity < (item.quantity || 0)) {
            throw new Error(`Quantity ${item.quantity} exceeds maximum allowed ${product.maxQuantity} for product ID ${product.id}`);
        }

        product.stock -= item.quantity!;
    }

    const { error } = await supabase
        .from("products")
        .upsert(sortedProducts);

    if (error) {
        throw new Error(error.message);
    }
}

export async function addOrderItems(
    buyer: Tables<"players">,
    recipientName: string,
    items: TablesInsert<"orderItems">[],
    address: string,
    phone: number,
    paymentMethod: "Bank Transfer" | "COD",
    pending: boolean = false
) {
    items = items.sort((a, b) => a.productID - b.productID);

    const ids: number[] = []
    const orderID = new Date().getTime();

    for (const i of items) {
        i.orderID = orderID
    }

    for (const i of items) {
        if (!ids.includes(i.productID)) ids.push(i.productID)
    }

    const products = (await getProducts(ids, true)).sort((a, b) => a.id - b.id);
    let amount = 0, fee = 25000;

    if (pending) {
        await updateStock(items, products)
    }

    for (const item of items) {
        const product = products.find(p => p.id === item.productID);

        if (!product || product.price === null) {
            throw new Error(`Product ID ${item.productID} has no price`);
        }

        amount += product.price * item.quantity!;
    }

    await addNewOrder(orderID, null, buyer.uid!, null, null, amount, 'VND', paymentMethod, address, phone, fee, recipientName)

    const { error } = await supabase
        .from('orderItems')
        .insert(items)

    if (error) {
        throw new Error(error.message)
    }

    return orderID
}

export async function getOrder(id: number) {
    const { data, error } = await supabase
        .from("orders")
        .select("*, orderItems(*, products(*)), products(*), coupons(*), players!giftTo(*, clans!id(*)), ownerPlayer:players!userID(name, clans!id(tag, tagBgColor, tagTextColor)), orderTracking(*), record_cards!orderID(*, levels(*))")
        .eq("id", id)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    if (data.orderTracking) {
        data.orderTracking.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    if (data.productID == 1) {
        data.orderItems.push({
            id: 1,
            productID: 1,
            orderID: data.id,
            quantity: data.quantity || 1,
            created_at: new Date().toISOString(),
            products: await getProductByID(1)
        });
    }

    if ((data as any).record_cards?.length) {
        const cards = (data as any).record_cards as { levelID: number; owner: string;[key: string]: any }[]
        const recordLookups = cards.map(rc =>
            supabase
                .from('records')
                .select('progress, userid, levelid')
                .eq('levelid', rc.levelID)
                .eq('userid', rc.owner)
                .single()
        )
        const results = await Promise.all(recordLookups)
        for (let i = 0; i < cards.length; i++) {
            cards[i].records = results[i].data ?? null
        }
    }

    return data;
}


export async function renewStock(order: Awaited<ReturnType<typeof getOrder>>) {
    const upsertData = []

    if (order.productID == 1) {
        return
    }

    for (const i of order.orderItems) {
        if (!i.products) {
            continue
        }

        if (i.products.stock === null || i.products.stock == undefined) {
            continue
        }

        i.products.stock += i.quantity

        upsertData.push(i.products)
    }

    var { error } = await supabase
        .from("products")
        .upsert(upsertData)

    if (error) {
        console.error("Failed to update products", error)
    }

    var { error } = await supabase
        .from('orderTracking')
        .insert({
            content: "Order cancelled",
            orderID: order.id
        })

    if (error) {
        console.error("Failed to update tracking", error)
    }
}



export async function handlePayment(id: number, sepayOrderData: SepayWebhookOrder) {
    const order = await getOrder(id);

    if (order.delivered) {
        return;
    }

    if (order.state == 'CANCELLED') {
        await sepay.order.cancel(String(id))

        return;
    }

    let paymentStatus: string;

    if (sepayOrderData.order_status === 'CAPTURED') {
        paymentStatus = 'PAID';
    } else if (sepayOrderData.order_status === 'CANCELLED') {
        paymentStatus = 'CANCELLED';
    } else if (sepayOrderData.order_status === 'AUTHENTICATION_NOT_NEEDED') {
        paymentStatus = 'PENDING';
    } else {
        paymentStatus = sepayOrderData.order_status;
    }

    if (order.state != 'EXPIRED' && paymentStatus == 'EXPIRED') {
        await renewStock(order)
    }

    if (order.state != 'PAID' && paymentStatus == 'PAID') {
        const products = []

        for (const i of order.orderItems) {
            if (!i.products) {
                continue
            }

            products.push(i.products)
            // @ts-ignore
            delete i.products
        }

        await updateStock(order.orderItems, products)
    }

    order.state = paymentStatus

    await changeOrderState(id, paymentStatus);

    if (paymentStatus == 'PENDING' || paymentStatus != "PAID") {
        return;
    }

    const buyer = await getPlayer(order.userID)
    const recipient = await getPlayer(order.giftTo ? order.giftTo : order.userID)

    if (!handleProduct.has(order.productID!)) {
        return
    }

    const { pre, post } = handleProduct.get(order.productID!)!

    await pre(buyer, recipient, order)
    await post(buyer, recipient, order)
}

export async function getAllOrders(filters: { state?: string, paymentMethod?: string, search?: string }) {
    let query = supabase
        .from("orders")
        .select("*, orderTracking(*), products(*), orderItems(*, products(*))")

    if (filters.state) {
        query = query.eq('state', filters.state)
    }

    if (filters.paymentMethod) {
        query = query.eq('paymentMethod', filters.paymentMethod)
    }

    if (filters.search) {
        const searchNum = parseInt(filters.search)
        if (!isNaN(searchNum)) {
            query = query.or(`recipientName.ilike.%${filters.search}%,id.eq.${searchNum}`)
        } else {
            query = query.ilike('recipientName', `%${filters.search}%`)
        }
    }

    const { data, error } = await query
        .order("created_at", { ascending: false })
        .order("created_at", { referencedTable: "orderTracking", ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getAllProducts() {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function upsertProduct(product: any) {
    const { data, error } = await supabase
        .from("products")
        .upsert(product)
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}