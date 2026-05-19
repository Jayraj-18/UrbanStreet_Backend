const Product = require("../models/product.model");

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Add a product
// @route   POST /api/products
// @access  Admin
const addProduct = async (req, res) => {
  try {
    const { name, price, image, category, description } = req.body;
    
    if (!name || !price || !image || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Initialize stock map based on sizes
    const stockMap = req.body.stock || {};
    if (req.body.sizes) {
      req.body.sizes.forEach(size => {
        if (stockMap[size] === undefined) stockMap[size] = 10;
      });
    }

    const product = await Product.create({
      name,
      price,
      image,
      category,
      description,
      sizes: req.body.sizes || [],
      stock: stockMap
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = async (req, res) => {
  try {
    const { name, price, image, category, description } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.name = name || product.name;
    product.price = price || product.price;
    product.image = image || product.image;
    product.category = category || product.category;
    product.description = description || product.description;
    product.sizes = req.body.sizes !== undefined ? req.body.sizes : product.sizes;
    
    if (req.body.stock !== undefined) {
      // Clear and rebuild the map to ensure clean update
      if (product.stock instanceof Map) {
        product.stock.clear();
        Object.entries(req.body.stock).forEach(([key, val]) => {
          product.stock.set(key, Number(val));
        });
      } else {
        product.stock = req.body.stock;
      }
    }

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
};
