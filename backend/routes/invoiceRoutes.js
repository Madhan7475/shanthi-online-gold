const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const Order = require("../models/Order");
const verifyAuthFlexible = require("../middleware/verifyAuthFlexible");
const PDFDocument = require("pdfkit");
const resolveUser = require("../utils/helper");

// @route   GET /api/invoices
// @desc    Get all invoices
// @access  Private/Admin
router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * @route   GET /api/invoices/:orderId/pdf
 * @desc    Generate and download invoice PDF for a specific order
 * @access  Private (owner)
 */
router.get("/:orderId/pdf", verifyAuthFlexible, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    // Authorize: allow only the order owner (supports firebase/jwt via verifyAuthFlexible)
    const user = await resolveUser(req);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user._id.toString() !== order.userId?.toString()) {
      return res.status(401).json({ message: "Not authorized to download this invoice" });
    }
    // Fetch invoice if exists (optional)
    const invoice = await Invoice.findOne({ orderId: order._id }).lean();

    // Company info (from env or defaults)
    const company = {
      name: process.env.COMPANY_NAME || "Shanthi Online Gold",
      address:
        process.env.COMPANY_ADDRESS ||
        "No. 123, Jewellery Street,\nChennai, Tamil Nadu 600001\nIndia",
      phone: process.env.COMPANY_PHONE || "+91-98765-43210",
      email: process.env.COMPANY_EMAIL || "support@shanthionlinegold.com",
      gstin: process.env.COMPANY_GSTIN || "",
    };

    // Prepare response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice_${String(order._id)}.pdf`
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // Helpers
    const fmtINR = (n) => {
      try {
        return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(n || 0));
      } catch {
        const v = Math.round(Number(n || 0));
        return "₹" + v.toString();
      }
    };

    // Header
    doc
      .fontSize(18)
      .text("TAX INVOICE", { align: "right" })
      .moveDown(0.5);

    doc
      .fontSize(20)
      .text(company.name, { continued: false })
      .fontSize(10)
      .text(company.address)
      .moveDown(0.3);

    const contactLine = [company.phone, company.email].filter(Boolean).join("  |  ");
    if (contactLine) doc.text(contactLine);
    if (company.gstin) doc.text(`GSTIN: ${company.gstin}`);
    doc.moveDown(1);

    // Invoice meta
    const metaLeftX = doc.x;
    const metaTopY = doc.y;

    doc
      .fontSize(11)
      .text(`Invoice No: ${invoice?._id || order._id}`)
      .text(`Order ID: ${order._id}`)
      .text(`Invoice Date: ${new Date(invoice?.date || order.date || order.createdAt || Date.now()).toLocaleString("en-IN")}`);

    const rightColX = 320;
    doc
      .fontSize(11)
      .text("Bill To:", rightColX, metaTopY)
      .text(order.customerName || "", rightColX, doc.y)
      .text(order.deliveryAddress || "", rightColX, doc.y, { width: 250 });

    doc.moveDown(1);

    // Payment info
    doc
      .fontSize(11)
      .text(`Payment Method: ${order.paymentMethod || "N/A"}`)
      .text(`Transaction ID: ${order.transactionId || "N/A"}`)
      .text(`Status: ${order.status || "N/A"}`)
      .moveDown(0.5);

    // Items table
    const tableTop = doc.y + 10;
    const col = {
      sn: 40,
      title: 70,
      karat: 310,
      weight: 360,
      qty: 420,
      unit: 460,
      amount: 520,
    };

    doc
      .fontSize(11)
      .text("#", col.sn, tableTop)
      .text("Item", col.title, tableTop)
      .text("Karat", col.karat, tableTop)
      .text("Weight", col.weight, tableTop)
      .text("Qty", col.qty, tableTop)
      .text("Unit", col.unit, tableTop)
      .text("Amount", col.amount, tableTop, { align: "right", width: 80 });

    doc
      .moveTo(40, tableTop + 14)
      .lineTo(570, tableTop + 14)
      .strokeColor("#cccccc")
      .stroke();

    const items = Array.isArray(order.items) ? order.items : [];
    let y = tableTop + 24;
    let subtotal = 0;

    items.forEach((item, idx) => {
      const qty = Number(item?.quantity || 1);
      const unit = Number(item?.price || 0);
      const line = unit * qty;
      subtotal += line;

      const karat = item?.karatage ? String(item.karatage) : "";
      const weight = item?.grossWeight ? String(item.grossWeight) : "";

      doc
        .fontSize(10)
        .text(String(idx + 1), col.sn, y)
        .text(item?.title || "Item", col.title, y, { width: 220 })
        .text(karat, col.karat, y)
        .text(weight, col.weight, y)
        .text(qty.toString(), col.qty, y)
        .text(fmtINR(unit), col.unit, y)
        .text(fmtINR(line), col.amount, y, { align: "right", width: 80 });

      y += 18;
      if (y > 730) {
        doc.addPage();
        y = 60;
      }
    });

    // Totals
    y += 6;
    doc
      .moveTo(360, y)
      .lineTo(570, y)
      .strokeColor("#cccccc")
      .stroke();
    y += 8;

    const total = Number(order.total || subtotal);

    doc
      .fontSize(11)
      .text("Subtotal:", 400, y)
      .text(fmtINR(subtotal), col.amount, y, { align: "right", width: 80 });

    y += 16;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Total:", 400, y)
      .text(fmtINR(total), col.amount, y, { align: "right", width: 80 })
      .font("Helvetica");

    y += 30;

    doc
      .fontSize(9)
      .fillColor("#666666")
      .text(
        "Thank you for your purchase! This is a computer generated invoice and does not require a physical signature.",
        40,
        y,
        { width: 520 }
      );

    doc.end();
  } catch (err) {
    console.error("Invoice PDF generation failed:", err);
    res.status(500).json({ message: "Failed to generate invoice PDF", error: err.message || String(err) });
  }
});

module.exports = router;
