import supabase from "@src/client/supabase"

const PERIOD_MS: Record<string, number> = {
    '7d': 7 * 86400000,
    '30d': 30 * 86400000,
    '90d': 90 * 86400000,
}

export async function getRevenueAnalytics(period: string) {
    let query = supabase
        .from("orders")
        .select("id, created_at, amount, fee, state, paymentMethod, productID, delivered, discount, currency, products(id, name, price)")
        .order("created_at", { ascending: true })
        .limit(10000)

    if (period !== 'all' && PERIOD_MS[period]) {
        const since = new Date(Date.now() - PERIOD_MS[period]).toISOString()
        query = query.gte('created_at', since)
    }

    const { data: orders, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    // Summary (PAID orders only)
    let totalRevenue = 0
    let orderCount = 0
    let totalFees = 0

    // Revenue over time
    const dailyMap = new Map<string, { revenue: number; orderCount: number }>()

    // Revenue by product
    const productMap = new Map<number | null, { productName: string; revenue: number; orderCount: number }>()

    // Revenue by payment method
    const methodMap = new Map<string, { revenue: number; orderCount: number }>()

    // Order status distribution (all orders)
    const statusMap = new Map<string, number>()

    for (const order of orders || []) {
        // Status distribution counts all orders
        statusMap.set(order.state, (statusMap.get(order.state) || 0) + 1)

        if (order.state !== 'PAID') continue

        const amount = Number(order.amount || 0)
        const fee = Number(order.fee || 0)

        totalRevenue += amount
        totalFees += fee
        orderCount++

        // Daily grouping
        const date = order.created_at.slice(0, 10) // YYYY-MM-DD
        const daily = dailyMap.get(date) || { revenue: 0, orderCount: 0 }
        daily.revenue += amount
        daily.orderCount++
        dailyMap.set(date, daily)

        // Product grouping
        const pid = order.productID
        const pName = (order.products as any)?.name || (pid === null ? 'Store Orders' : `Product #${pid}`)
        const prod = productMap.get(pid) || { productName: pName, revenue: 0, orderCount: 0 }
        prod.revenue += amount
        prod.orderCount++
        productMap.set(pid, prod)

        // Payment method grouping
        const method = order.paymentMethod || 'Unknown'
        const m = methodMap.get(method) || { revenue: 0, orderCount: 0 }
        m.revenue += amount
        m.orderCount++
        methodMap.set(method, m)
    }

    return {
        summary: {
            totalRevenue,
            orderCount,
            averageOrderValue: orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0,
            totalFees,
        },
        revenueOverTime: Array.from(dailyMap.entries())
            .map(([date, d]) => ({ date, revenue: d.revenue, orderCount: d.orderCount })),
        revenueByProduct: Array.from(productMap.entries())
            .map(([productID, d]) => ({ productID, ...d }))
            .sort((a, b) => b.revenue - a.revenue),
        revenueByPaymentMethod: Array.from(methodMap.entries())
            .map(([method, d]) => ({ method, ...d })),
        orderStatusDistribution: Array.from(statusMap.entries())
            .map(([state, count]) => ({ state, count })),
    }
}
