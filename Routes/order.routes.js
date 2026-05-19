const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  createRazorpayOrder,
  verifyPayment,
} = require("../controllers/order.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

// All order routes require authentication
router.use(protect);

// Razorpay routes
router.post("/razorpay-order", createRazorpayOrder);
router.post("/verify", verifyPayment);

// POST /api/orders           - Place a new order
router.post("/", createOrder);

// GET /api/orders/my         - Get logged-in user's orders
router.get("/my", getMyOrders);

// GET /api/orders            - Get all orders (Admin only)
router.get("/", adminOnly, getAllOrders);

// GET /api/orders/:id        - Get single order (owner or admin)
router.get("/:id", getOrderById);

// PUT /api/orders/:id/status - Update order status (Admin only)
router.put("/:id/status", adminOnly, updateOrderStatus);

module.exports = router;
