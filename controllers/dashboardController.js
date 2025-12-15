const User = require("../models/userModel");
const Dish = require("../models/dishModel");
const Order = require("../models/orderModel");

exports.getDashboardStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalMenu = await Dish.countDocuments();

        // Helper to get date date range
        const getDateRange = (timeframe) => {
            const now = new Date();
            const start = new Date();
            start.setHours(0, 0, 0, 0);

            switch (timeframe) {
                case 'today':
                    return { $gte: start };
                case 'yesterday': {
                    const yesterdayStart = new Date(start);
                    yesterdayStart.setDate(start.getDate() - 1);
                    const yesterdayEnd = new Date(start);
                    return { $gte: yesterdayStart, $lt: yesterdayEnd };
                }
                case 'last_7_days': {
                    const last7 = new Date(start);
                    last7.setDate(start.getDate() - 6);
                    return { $gte: last7 };
                }
                case 'last_30_days': {
                    const last30 = new Date(start);
                    last30.setDate(start.getDate() - 29);
                    return { $gte: last30 };
                }
                case 'all_time':
                    return null;
                default:
                    return { $gte: start }; // Default to today
            }
        };

        const { salesTimeframe, ordersTimeframe } = req.query;

        // Helper for start of day (still used by hourly traffic)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Helper for last 7 days (still used by weekly sales)
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 6);
        last7Days.setHours(0, 0, 0, 0);

        // 0. Sales Stats (Filtered)
        const salesDateFilter = getDateRange(salesTimeframe || 'today');
        const salesMatch = { orderStatus: { $ne: 'cancelled' } };
        if (salesDateFilter) salesMatch.createdAt = salesDateFilter;

        const salesStatsResult = await Order.aggregate([
            { $match: salesMatch },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$bills.totalWithTax" }
                }
            }
        ]);
        const filteredSales = salesStatsResult.length > 0 ? salesStatsResult[0].total : 0;

        // Orders Stats (Filtered)
        const ordersDateFilter = getDateRange(ordersTimeframe || 'all_time'); // Default to all time
        const ordersMatch = {}; // Count all including cancelled? Usually filtering implies valid orders but usually total orders means count of creations. Let's keep it simple: count all.
        // Actually, for "Total Orders" we usually count everything, but if filtering by date we should apply date.
        if (ordersDateFilter) ordersMatch.createdAt = ordersDateFilter;

        const filteredOrders = await Order.countDocuments(ordersMatch);

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
                    _id: { $dateToString: { format: "%a", date: "$createdAt" } }, // Mon, Tue...
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

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalMenu,
                todaySales: filteredSales,
                totalOrders: filteredOrders,
                weeklySales,
                hourlyTraffic,
                categoryPerformance,
                topSellingItems: topSellingItems.map(item => ({
                    ...item,
                    revenue: `₦${item.revenue.toLocaleString()}`
                })),
                unavailableItems
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
