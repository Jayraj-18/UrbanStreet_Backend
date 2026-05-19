const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @route  POST /api/auth/signup
// @desc   Register a new user
// @access Public
const signup = async (req, res) => {
  try {
    let { name, username, email, password, address } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Enforce lowercase for unique fields
    username = username.toLowerCase();
    email = email.toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? "Email" : "Username";
      return res.status(409).json({ message: `${field} is already taken.` });
    }

    const user = await User.create({ name, username, email, password, address });
    const token = generateToken(user._id);

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.status(201).cookie("token", token, cookieOptions).json({
      message: "Account created successfully!",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Signup error details:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// @route  POST /api/auth/login
// @desc   Login user and return token
// @access Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const token = generateToken(user._id);

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.status(200).cookie("token", token, cookieOptions).json({
      message: "Login successful!",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error details:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// @route  POST /api/auth/logout
// @desc   Logout user and clear cookie
// @access Private
const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ message: "Logged out successfully!" });
};

// @route  GET /api/auth/me
// @desc   Get current logged-in user
// @access Private
const getMe = async (req, res) => {
  res.status(200).json({ user: req.user });
};

module.exports = { signup, login, getMe, logout };
