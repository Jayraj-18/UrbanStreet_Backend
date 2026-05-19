const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./Routes/auth.routes");
const productRoutes = require("./Routes/product.routes");
const orderRoutes = require("./Routes/order.routes");
const { seedAdmin, seedProducts } = require("./seed");
dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://urbansteet.netlify.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));


app.use(express.json());
app.use(cookieParser());



app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "UrbanStreet API is running 🚀" });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    seedAdmin();
    seedProducts();
    app.listen(PORT, () => {
      //   console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
