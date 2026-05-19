const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
    },
    image: {
      type: String,
      required: [true, "Product image URL is required"],
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: ["men", "women", "kids", "jackets", "accessories"],
    },
    description: {
      type: String,
      default: "",
    },
    sizes: {
      type: [String],
      default: ["S", "M", "L", "XL"],
    },
    stock: {
      type: Map,
      of: Number,
      default: { "S": 10, "M": 10, "L": 10, "XL": 10 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
