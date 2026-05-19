const Order = require("../models/order.model");
const Product = require("../models/product.model");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route  POST /api/orders/razorpay-order
// @desc   Create Razorpay Order
// @access Private
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, items, shippingAddress } = req.body;

    if (!amount || !items || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ message: "Amount, items, and address are required." });
    }

    const options = {
      amount: amount * 100, // Razorpay works in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Initial order creation in DB (pending)
    const order = await Order.create({
      user: req.user._id,
      items: items.map(item => ({
        product: item.product,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        size: item.size
      })),
      totalAmount: amount,
      shippingAddress,
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: "pending",
    });

    res.status(201).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      dbOrderId: order._id,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ message: "Razorpay error.", error: error.message });
  }
};

// @route  POST /api/orders/verify
// @desc   Verify Razorpay Payment Signature
// @access Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
      // Update order in DB
      const order = await Order.findByIdAndUpdate(dbOrderId, {
        paymentStatus: "paid",
        status: "processing", // Move from pending to processing
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      }, { new: true });

      // DECREMENT STOCK PER SIZE
      if (order && order.items) {
        for (const item of order.items) {
          const sizeKey = `stock.${item.size}`;
          await Product.findByIdAndUpdate(item.product, {
            $inc: { [sizeKey]: -item.quantity }
          });
        }
      }

      res.status(200).json({ success: true, message: "Payment verified successfully!" });
    } else {
      await Order.findByIdAndUpdate(dbOrderId, { paymentStatus: "failed" });
      res.status(400).json({ success: false, message: "Invalid signature." });
    }
  } catch (error) {
    res.status(500).json({ message: "Verification error.", error: error.message });
  }
};

// @route  POST /api/orders
// @desc   Place a new order
// @access Private
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in the order." });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required." });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      user: req.user._id,
      items: items.map(item => ({
        product: item.product,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        size: item.size
      })),
      totalAmount,
      shippingAddress,
    });

    res.status(201).json({ message: "Order placed successfully!", order });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// @route  GET /api/orders/my
// @desc   Get current user's orders
// @access Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name image")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// @route  GET /api/orders/my
// @desc   Get current user's orders
// @access Private
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route  GET /api/orders/:id
// @desc   Get single order by ID
// @access Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.product",
      "name image price"
    );

    if (!order) return res.status(404).json({ message: "Order not found." });

    // Allow only the owner or admin to view
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized." });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// @route  GET /api/orders
// @desc   Get all orders (Admin only)
// @access Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name image")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// @route  PUT /api/orders/:id/status
// @desc   Update order status (Admin only)
// @access Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.status(200).json({ message: "Order status updated.", order });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  createRazorpayOrder,
  verifyPayment,
};
