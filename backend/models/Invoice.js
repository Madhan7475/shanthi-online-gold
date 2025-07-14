const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ["Paid", "Pending", "Cancelled"], default: "Pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
