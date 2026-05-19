const express = require("express");
const router = express.Router();
const { getProducts, getProductById, addProduct, updateProduct, deleteProduct } = require("../controllers/product.controller");
const { protect } = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Public
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin Only
router.post("/", protect, adminMiddleware, addProduct);
router.put("/:id", protect, adminMiddleware, updateProduct);
router.delete("/:id", protect, adminMiddleware, deleteProduct);

module.exports = router;
