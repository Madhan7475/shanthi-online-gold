// server.js

const express = require('express');
const cors = require('cors');
const dotenv =require("dotenv");
const connectDB = require("./config/db");
const userRoutes =require("./routes/userRoutes")

const mongoose = require('mongoose'); // optional: if using MongoDB
require('dotenv').config();


dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();


// Middleware
app.use(cors());
app.use(express.json()); // parse JSON bodies

// MongoDB Connection (optional)
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shanthi-gold', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Sample route
app.get('/', (req, res) => {
  res.send('Welcome to Shanthi Online Gold Server 🚀');
});

// API Routes
app.use("/api/user", userRoutes);

// Example API route
app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: 'Gold Ring', price: 5000 },
    { id: 2, name: 'Diamond Necklace', price: 12000 },
  ]);
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
