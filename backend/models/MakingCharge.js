// backend/models/MakingCharge.js
const mongoose = require("mongoose");

const makingChargeSchema = new mongoose.Schema(
    {
        // "fixed" = one-time amount for the whole product
        // "variable" = amount charged per gram (display as "per gram" in UI)
        type: {
            type: String,
            enum: ["fixed", "variable"],
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
            unique: true,
        },
    },
    { timestamps: true }
);

// Helpful compound index
makingChargeSchema.index({ product: 1, type: 1 });

module.exports = mongoose.model("MakingCharge", makingChargeSchema);
