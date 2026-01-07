const User = require("../models/userModel");
const Dish = require("../models/dishModel");
const Order = require("../models/orderModel");

exports.getDashboardStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalMenu = await Dish.countDocuments();

        // Helper to get current and previous date ranges
        const getDateRanges = (timeframe) => {
            const now = new Date();
            const start = new Date();
            start.setHours(0, 0, 0, 0);

            switch (timeframe) {
                case 'today': {
                    // Current: Today
                    // Previous: Yesterday
                    const prevStart = new Date(start);
                    prevStart.setDate(start.getDate() - 1);
                    const prevEnd = new Date(start);

                    return {
                        current: { $gte: start },
                        previous: { $gte: prevStart, $lt: prevEnd }
                    };
                }
                case 'yesterday': {
                    // Current: Yesterday
                    // Previous: Day before yesterday
                    const currStart = new Date(start);
                    currStart.setDate(start.getDate() - 1);
                    const currEnd = new Date(start);

                    const prevStart = new Date(currStart);
                    prevStart.setDate(currStart.getDate() - 1);

                    return {
                        current: { $gte: currStart, $lt: currEnd },
                        previous: { $gte: prevStart, $lt: currStart }
                    };
                }
                case 'last_7_days': {
                    // Current: Last 7 days
                    // Previous: 7 days before that
                    const currStart = new Date(start);
                    currStart.setDate(start.getDate() - 6);

                    const prevStart = new Date(currStart);
                    prevStart.setDate(currStart.getDate() - 7);

                    return {
                        current: { $gte: currStart },
                        previous: { $gte: prevStart, $lt: currStart }
                    };
                }
                case 'last_30_days': {
                    // Current: Last 30 days
                    // Previous: 30 days before that
                    const currStart = new Date(start);
                    currStart.setDate(start.getDate() - 29);

                    const prevStart = new Date(currStart);
                    prevStart.setDate(currStart.getDate() - 30);

                    return {
                        current: { $gte: currStart },
                        previous: { $gte: prevStart, $lt: currStart }
                    };
                }
                case 'all_time':
                    return { current: null, previous: null };
                default:
                    // Default to today
                    return {
                        current: { $gte: start },
                        previous: null
                    };
            }
        };

        const { salesTimeframe, ordersTimeframe } = req.query;

        // 0. Sales Stats (Filtered with Comparison)
        const salesRanges = getDateRanges(salesTimeframe || 'today');

        // Current Sales
        const salesMatch = { orderStatus: { $ne: 'cancelled' } };
        if (salesRanges.current) salesMatch.createdAt = salesRanges.current;
        const salesStatsResult = await Order.aggregate([
            { $match: salesMatch },
            { $group: { _id: null, total: { $sum: "$bills.totalWithTax" } } }
        ]);
        const filteredSales = salesStatsResult.length > 0 ? salesStatsResult[0].total : 0;

        // Previous Sales (for percentage)
        let salesChange = 0;
        if (salesRanges.previous) {
            const prevSalesMatch = { orderStatus: { $ne: 'cancelled' }, createdAt: salesRanges.previous };
            const prevSalesResult = await Order.aggregate([
                { $match: prevSalesMatch },
                { $group: { _id: null, total: { $sum: "$bills.totalWithTax" } } }
            ]);
            const prevSales = prevSalesResult.length > 0 ? prevSalesResult[0].total : 0;

            if (prevSales > 0) {
                salesChange = ((filteredSales - prevSales) / prevSales) * 100;
            } else if (filteredSales > 0) {
                salesChange = 100; // 0 to something is 100% increase logic
            }
        }

        // Orders Stats (Filtered with Comparison)
        const ordersRanges = getDateRanges(ordersTimeframe || 'all_time');

        // Current Orders
        const ordersMatch = {};
        if (ordersRanges.current) ordersMatch.createdAt = ordersRanges.current;
        const filteredOrders = await Order.countDocuments(ordersMatch);

        // Previous Orders (for percentage)
        let ordersChange = 0;
        if (ordersRanges.previous) {
            const prevOrdersMatch = { createdAt: ordersRanges.previous };
            const prevOrdersCount = await Order.countDocuments(prevOrdersMatch);

            if (prevOrdersCount > 0) {
                ordersChange = ((filteredOrders - prevOrdersCount) / prevOrdersCount) * 100;
            } else if (filteredOrders > 0) {
                ordersChange = 100;
            }
        }

        // Hourly helper (start of today)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Weekly helper (last 7 days)
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 6);
        last7Days.setHours(0, 0, 0, 0);

        // 1. Weekly Sales (Last 7 Days)
        const weeklySales = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: last7Days },
                    orderStatus: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: { $sum: "$bills.totalWithTax" },
                    date: { $first: "$createdAt" } // Keep date for sorting
                }
            },
            { $sort: { date: 1 } },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    sales: 1
                }
            }
        ]);

        // 2. Hourly Traffic (Today)
        const hourlyTraffic = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfDay },
                    orderStatus: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } },
            {
                $project: {
                    _id: 0,
                    hour: {
                        $concat: [
                            {
                                $toString: {
                                    $cond: [
                                        { $gt: ["$_id", 12] },
                                        { $subtract: ["$_id", 12] },
                                        { $cond: [{ $eq: ["$_id", 0] }, 12, "$_id"] }
                                    ]
                                }
                            },
                            { $cond: [{ $gte: ["$_id", 12] }, "PM", "AM"] }
                        ]
                    },
                    orders: 1,
                    originalHour: "$_id"
                }
            }
        ]);

        // 3. Category Performance
        const categoryPerformance = await Order.aggregate([
            { $match: { orderStatus: { $ne: 'cancelled' } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.category",
                    value: { $sum: 1 } // Count items sold per category
                }
            },
            { $match: { _id: { $ne: null } } }, // Filter out items without category (old data)
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    value: 1
                }
            }
        ]);

        // 4. Top Selling Items
        const topSellingItems = await Order.aggregate([
            { $match: { orderStatus: { $ne: 'cancelled' } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.name",
                    orders: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { orders: -1 } },
            { $limit: 5 },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    orders: 1,
                    revenue: 1
                }
            }
        ]);

        // 5. Unavailable Items (instead of Low Stock)
        const unavailableItems = await Dish.find({ available: false })
            .select('name price category')
            .limit(5);

        // 6. Sales by Payment Method
        const paymentMethodStats = await Order.aggregate([
            { $match: salesMatch },
            {
                $group: {
                    _id: "$paymentMethod",
                    total: { $sum: "$bills.totalWithTax" }
                }
            }
        ]);

        const formatPaymentStats = (stats) => {
            const result = {
                cash: 0,
                pos1: 0,
                pos2: 0,
                others: 0
            };
            stats.forEach(stat => {
                if (stat._id === 'Cash') result.cash += stat.total;
                else if (stat._id === 'Transfer - POS 1') result.pos1 += stat.total;
                else if (stat._id === 'Transfer - POS 2') result.pos2 += stat.total;
                else if (stat._id === 'Card - POS 1') result.pos1 += stat.total; // Map card to POS 1 as well if needed, or separate? Assuming merged for now based on 'Transfer to POS 1' requirement, but wait, 'Cash accepted, transfer to POS 1, POS 2'. 
                // Let's stick to exact string matching from frontend or robust includes.
                // Frontend sends: 'Cash', 'Card - POS 1', 'Card - POS 2', 'Transfer - POS 1', 'Transfer - POS 2'.
                // User asked for: "list of cash accepted, transfer to POS 1, POS 2".
                // I will aggregate by POS terminal for non-cash.
                else if (stat._id && stat._id.includes('POS 1')) result.pos1 += stat.total;
                else if (stat._id && stat._id.includes('POS 2')) result.pos2 += stat.total;
                else result.others += stat.total;
            });
            return result;
        };

        const paymentStats = formatPaymentStats(paymentMethodStats);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalMenu,
                todaySales: filteredSales,
                todaySalesChange: salesChange,
                totalOrders: filteredOrders,
                totalOrdersChange: ordersChange,
                weeklySales,
                hourlyTraffic,
                categoryPerformance,
                topSellingItems: topSellingItems.map(item => ({
                    ...item,
                    revenue: `₦${item.revenue.toLocaleString()}`
                })),
                unavailableItems,
                paymentStats
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAnalyticsStats = async (req, res, next) => {
    try {
        const { from, to } = req.query;

        // Default to last 30 days if not provided
        let startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);

        let endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        if (from) {
            startDate = new Date(from);
            startDate.setHours(0, 0, 0, 0);
        }
        if (to) {
            endDate = new Date(to);
            endDate.setHours(23, 59, 59, 999);
        }

        const dateMatch = {
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: { $ne: 'cancelled' }
        };

        // 1. Key Metrics
        const keyMetrics = await Order.aggregate([
            { $match: dateMatch },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$bills.totalWithTax" },
                    totalOrders: { $sum: 1 },
                }
            }
        ]);

        const totalRevenue = keyMetrics.length > 0 ? keyMetrics[0].totalRevenue : 0;
        const totalOrders = keyMetrics.length > 0 ? keyMetrics[0].totalOrders : 0;

        // Active Customers (Unique tables or names?)
        const uniqueCustomers = await Order.distinct('table', dateMatch);
        const activeCustomers = uniqueCustomers.length;

        // 2. Revenue Chart Data (Group by Day)
        const revenueChart = await Order.aggregate([
            { $match: dateMatch },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$bills.totalWithTax" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    revenue: 1,
                    orders: 1
                }
            }
        ]);

        // 3. Category Breakdown
        const categoryData = await Order.aggregate([
            { $match: dateMatch },
            { $unwind: "$items" },
            {
                $project: {
                    categoryName: {
                        $cond: {
                            if: { $eq: [{ $type: "$items.category" }, "object"] },
                            then: "$items.category.name",
                            else: "$items.category"
                        }
                    },
                    price: "$items.price",
                    quantity: "$items.quantity"
                }
            },
            {
                $group: {
                    _id: "$categoryName",
                    revenue: { $sum: { $multiply: ["$price", "$quantity"] } },
                    value: { $sum: "$quantity" }
                }
            },
            { $match: { _id: { $ne: null } } },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    value: 1,
                    revenue: 1
                }
            }
        ]);

        // 4. Top Selling Items
        const topItems = await Order.aggregate([
            { $match: dateMatch },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.name",
                    sales: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { sales: -1 } },
            { $limit: 5 },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    sales: 1,
                    revenue: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                metrics: {
                    totalRevenue,
                    totalOrders,
                    activeCustomers,
                    avgOrderTime: "18 min"
                },
                revenueChart,
                categoryData,
                topItems,
                paymentStats: await (async () => {
                    const paymentMethodStats = await Order.aggregate([
                        { $match: dateMatch },
                        {
                            $group: {
                                _id: "$paymentMethod",
                                total: { $sum: "$bills.totalWithTax" }
                            }
                        }
                    ]);

                    const result = {
                        cash: 0,
                        pos1: 0,
                        pos2: 0,
                        others: 0
                    };
                    paymentMethodStats.forEach(stat => {
                        if (stat._id === 'Cash') result.cash += stat.total;
                        else if (stat._id === 'Transfer - POS 1') result.pos1 += stat.total;
                        else if (stat._id === 'Transfer - POS 2') result.pos2 += stat.total;
                        else if (stat._id === 'Card - POS 1') result.pos1 += stat.total;
                        else if (stat._id && stat._id.includes('POS 1')) result.pos1 += stat.total;
                        else if (stat._id && stat._id.includes('POS 2')) result.pos2 += stat.total;
                        else result.others += stat.total;
                    });
                    return result;
                })()
            }
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        next(error);
    }
};
