const express = require("express");
const Category = require("../models/Category");
const { upload } = require("../middleware/upload");

const router = express.Router();

// GET /api/categories
router.get("/", async (req, res) => {
  try {
    const { featured } = req.query;
    const filter = {};
    if (featured === "true") filter.featured = true;

    const categories = await Category.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err.message);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET /api/categories/:slug
router.get("/:slug", async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).lean();
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (err) {
    console.error("Error fetching category by slug:", err.message);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// POST /api/categories (Admin) - create with optional image
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, slug, featured = false, order = 0, parent = null } = req.body;
    const image = req.file?.filename || null;

    const exists = await Category.findOne({ slug });
    if (exists) return res.status(400).json({ error: "Slug already exists" });

    const category = await Category.create({ name, slug, featured, order, parent, image });
    res.status(201).json({ message: "Category created", category });
  } catch (err) {
    console.error("Error creating category:", err.message);
    res.status(500).json({ error: "Failed to create category", details: err.message });
  }
});

// PUT /api/categories/:id (Admin) - update with optional new image
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, slug, featured, order, parent } = req.body;
    const update = { name, slug, featured, order, parent };
    if (req.file?.filename) update.image = req.file.filename;

    const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!category) return res.status(404).json({ error: "Category not found" });

    res.json({ message: "Category updated", category });
  } catch (err) {
    console.error("Error updating category:", err.message);
    res.status(500).json({ error: "Failed to update category", details: err.message });
  }
});

// DELETE /api/categories/:id (Admin)
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json({ message: "Category deleted", category });
  } catch (err) {
    console.error("Error deleting category:", err.message);
    res.status(500).json({ error: "Failed to delete category", details: err.message });
  }
});

module.exports = router;
