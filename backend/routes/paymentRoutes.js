const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Invoice = require("../models/Invoice");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

const router = express.Router();

// IMPORTANT: Store these in your .env file in production
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "YOUR_TEST_KEY_ID";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "YOUR_TEST_KEY_SECRET";

const instance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});

/**
 * @route   POST /api/payment/create-orderåå
 * @desc    Create a Razorpay order for online payment
 * @access  Private
 */
router.post("/create-order", verifyFirebaseToken, async (req, res) => {
    const { amount, currency = "INR", receipt } = req.body;

    try {
        const options = {
            amount: amount * 100, // Amount in the smallest currency unit (paise)
            currency,
            receipt,
        };
        const order = await instance.orders.create(options);

        if (!order) {
            return res.status(500).send("Error creating order");
        }

        res.json(order);
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).send("Internal Server Error");
    }
});

/**
 * @route   POST /api/payment/verify
 * @desc    Verify Razorpay payment and create order/invoice in DB
 * @access  Private
 */
router.post("/verify", verifyFirebaseToken, async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderData, // Contains customer details, items, total
    } = req.body;

    const shasum = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
        return res.status(400).json({ msg: "Transaction not legit!" });
    }

    // Payment is verified, now create the order and invoice in your database
    try {
        const newOrder = new Order({
            userId: req.user.uid,
            customerName: orderData.customer.name,
            items: orderData.items,
            total: orderData.total,
            status: "Paid", // Or "Processing"
            deliveryAddress: orderData.customer.deliveryAddress,
        });
        await newOrder.save();

        const newInvoice = new Invoice({
            customerName: orderData.customer.name,
            amount: orderData.total,
            status: "Paid",
            orderId: newOrder._id,
        });
        await newInvoice.save();

        res.json({
            msg: "Payment successful and order placed!",
            orderId: newOrder._id,
        });
    } catch (error) {
        console.error("Error saving order to DB after payment:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
