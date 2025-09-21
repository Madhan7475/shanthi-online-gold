const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String, default: null }, // filename in /uploads
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
