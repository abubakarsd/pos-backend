const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const { default: mongoose } = require("mongoose");

const addOrder = async (req, res, next) => {
  try {
    // req.user is populated by verifyToken middleware
    const serverId = req.user.id;
    const { items, bills, customerDetails, paymentMethod, paymentData } = req.body;

    // Per user request: "complete payment should send item to Orders... paid for is completed no Pending"
    // We assume orders coming in via this API are fully paid/completed.
    const orderStatus = "served"; // Using 'served' to map to 'Completed' in frontend config

    // Generate Custom Order ID
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 5 digit random number
    const orderId = `ORD-${randomNum}`;

    const orderData = {
      orderId,
      customerDetails: customerDetails || { name: "Walk-in", phone: "0000000000", guests: 1 }, // Default if not provided
      items,
      bills,
      orderStatus,
      paymentMethod,
      paymentData,
      server: serverId, // Set the server field
      // table: req.body.table // Optional, if provided
    };

    if (req.body.table) {
      orderData.table = req.body.table;
    }

    const order = new Order(orderData);
    await order.save();

    res
      .status(201)
      .json({ success: true, message: "Order created!", data: order });
  } catch (error) {
    console.error("Error creating order:", error);
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const order = await Order.findById(id);
    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("table").populate("server", "name"); // Populate server name
    res.status(200).json({ data: orders });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true }
    );

    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res
      .status(200)
      .json({ success: true, message: "Order updated", data: order });
  } catch (error) {
    next(error);
  }
};

module.exports = { addOrder, getOrderById, getOrders, updateOrder };
