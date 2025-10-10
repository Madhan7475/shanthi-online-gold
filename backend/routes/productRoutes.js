const express = require("express");
const Product = require("../models/Product");
const { upload } = require("../middleware/upload");
const adminAuth = require("../middleware/adminAuth");
const { repriceAllProducts } = require("../services/productRepriceService");
const Category = require("../models/Category");
// Basic slugify (no external dependency)
const slugify = (s) =>
    String(s || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const router = express.Router();

const fileToUrl = (req, filename) => `${req.protocol}://${req.get("host")}/uploads/${filename}`;
const withImageUrls = (req, doc) => {
    const obj = doc?.toObject ? doc.toObject() : doc;
    const imageUrls = (obj.images || []).map((f) => fileToUrl(req, f));
    return { ...obj, imageUrls, primaryImageUrl: imageUrls[0] || null };
};

/**
 * @route   POST /api/products
 * @desc    Upload a new product with multiple images
 * @access  Admin only
 */
router.post("/", adminAuth, upload.array("images", 5), async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            price,
            stocks,
            karatage,
            materialColour,
            grossWeight,
            metal,
            size,
            diamondClarity,
            diamondColor,
            numberOfDiamonds,
            diamondSetting,
            diamondShape,
            jewelleryType,
            brand,
            collection,
            gender,
            occasion,
        } = req.body;

        // Resolve category relations
        const normalizedCategorySlug =
            (req.body.categorySlug && String(req.body.categorySlug).toLowerCase()) ||
            (category ? slugify(category) : null);
        let categoryObjectId = req.body.categoryId || null;
        if (!categoryObjectId && normalizedCategorySlug) {
            try {
                const cat = await Category.findOne({ slug: normalizedCategorySlug }).select("_id");
                if (cat) categoryObjectId = cat._id;
            } catch { /* noop */ }
        }

        const imageFilenames = req.files?.map((file) => file.filename) || [];

        const newProduct = new Product({
            title,
            description,
            category,
            categorySlug: normalizedCategorySlug,
            categoryId: categoryObjectId,
            price,
            stocks,
            karatage,
            materialColour,
            grossWeight,
            metal,
            size,
            diamondClarity,
            diamondColor,
            numberOfDiamonds,
            diamondSetting,
            diamondShape,
            jewelleryType,
            brand,
            collection,
            gender,
            occasion,
            images: imageFilenames,
        });

        await newProduct.save();

        res.status(201).json({
            message: "✅ Product uploaded successfully",
            product: newProduct,
        });
    } catch (err) {
        console.error("❌ Error uploading product:", err);
        res.status(500).json({
            error: "Failed to upload product",
            details: err.message,
        });
    }
});

/**
 * @route   GET /api/products
 * @desc    Fetch products with optional search/filter/sort/pagination
 *          - If no query params are provided, returns a plain array (backward compatible)
 *          - If any of q/category/sort/page/limit present, returns { items, total, page, pages }
 * @access  Public
 */
router.get("/", async (req, res) => {
    try {
        const {
            q,
            category,
            categoryId,
            sort,
            page,
            limit,
            priceMin,
            priceMax,
            jewelleryType,
            product,
            gender,
            purity,
            occasion,
            metal,
            diamondClarity,
            collection,
            community,
            type,
            brand,
            size,
            materialColour
        } = req.query;

        const hasQuery = Boolean(
            (q && q.length) ||
            (category && category.length) ||
            (sort && sort.length) ||
            (page && String(page).length) ||
            (limit && String(limit).length) ||
            priceMin || priceMax || jewelleryType || product || gender ||
            purity || occasion || metal || diamondClarity || collection ||
            community || type
        );

        // Backward-compatible: when no query params, return plain array
        if (!hasQuery) {
            const products = await Product.find().sort({ createdAt: -1 }).lean();
            return res.json(products.map((p) => withImageUrls(req, p)));
        }

        const filter = {};

        // Text search
        if (q) {
            const regex = new RegExp(q, "i");
            filter.$or = [
                { title: regex },
                { description: regex },
                { category: regex },
                { brand: regex },
                { collection: regex },
            ];
        }

        // Category filter (prefer normalized slug or explicit ID). Backward compatible for legacy records.
        if (categoryId) {
            filter.categoryId = categoryId;
        } else if (category) {
            const slug = slugify(category);
            const nameRegex = new RegExp(`^${category}$`, "i");
            const orConditions = [];
            if (slug) orConditions.push({ categorySlug: slug });
            orConditions.push({ category: nameRegex });
            if (filter.$or) {
                const existingOr = filter.$or;
                delete filter.$or;
                filter.$and = [{ $or: existingOr }, { $or: orConditions }];
            } else {
                filter.$or = orConditions;
            }
        }

        // Price range filter
        if (priceMin || priceMax) {
            filter.price = {};
            if (priceMin) filter.price.$gte = parseFloat(priceMin);
            if (priceMax) filter.price.$lte = parseFloat(priceMax);
        }

        // Exact match filters (support comma-separated values for OR)
        // Normalize incoming params to actual schema fields
        const incomingFilters = {
            jewelleryType,
            product,
            gender,
            purity,
            occasion,
            metal,
            diamondClarity,
            collection,
            community,
            type,
            brand,
            size,
            materialColour
        };

        // Map query parameter -> schema field
        const paramToField = {
            jewelleryType: 'jewelleryType',
            product: 'jewelleryType', // map 'product' UI filter to 'jewelleryType' field
            gender: 'gender',
            purity: 'karatage',       // map 'purity' UI filter to 'karatage' field
            occasion: 'occasion',
            metal: 'metal',
            diamondClarity: 'diamondClarity',
            collection: 'collection',
            brand: 'brand',
            size: 'size',
            materialColour: 'materialColour',
            community: null,          // not present in schema; ignore
            type: 'jewelleryType'     // map generic 'type' to 'jewelleryType'
        };

        // Build case-insensitive exact-match filters using regex (handles "Gold" vs "gold" etc.)
        const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        Object.entries(incomingFilters).forEach(([param, value]) => {
            if (!value) return;
            const field = paramToField[param];
            if (!field) return; // ignore unsupported params

            const values = String(value).split(",").map((v) => v.trim()).filter(Boolean);
            if (!values.length) return;
            const regexes = values.map((v) => new RegExp(`^${esc(v)}$`, "i"));
            filter[field] = regexes.length > 1 ? { $in: regexes } : regexes[0];
        });

        const sortMap = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            title_asc: { title: 1 },
            title_desc: { title: -1 },
        };
        const sortOption = sortMap[sort] || sortMap.newest;

        const pageNum = Math.max(parseInt(page) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit) || 12, 1), 100);

        const [items, total] = await Promise.all([
            Product.find(filter)
                .sort(sortOption)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Product.countDocuments(filter),
        ]);

        res.json({
            items: items.map((p) => withImageUrls(req, p)),
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
        });
    } catch (err) {
        console.error("❌ Error fetching products:", err);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

/**
 * @route   GET /api/products/facets
 * @desc    Dynamic facet values for filters. Returns distinct values (and counts) for selected fields.
 *          Accepts same query params as GET /api/products to compute context-aware facets.
 *          Example: /api/products/facets?category=Gold&metal=Gold will return facets for the remaining fields
 * @access  Public
 */
router.get("/facets", async (req, res) => {
    try {
        const {
            q,
            category,
            categoryId,
            priceMin,
            priceMax,
            jewelleryType,
            product,
            gender,
            purity,
            occasion,
            metal,
            diamondClarity,
            collection,
            community,
            type,
            brand,
            size,
            materialColour,
        } = req.query;

        const filter = {};

        // Text search
        if (q) {
            const regex = new RegExp(q, "i");
            filter.$or = [
                { title: regex },
                { description: regex },
                { category: regex },
                { brand: regex },
                { collection: regex },
            ];
        }

        // Category filter (prefer normalized slug or explicit ID). Backward compatible for legacy records.
        if (categoryId) {
            filter.categoryId = categoryId;
        } else if (category) {
            const slug = slugify(category);
            const nameRegex = new RegExp(`^${category}$`, "i");
            const orConditions = [];
            if (slug) orConditions.push({ categorySlug: slug });
            orConditions.push({ category: nameRegex });
            if (filter.$or) {
                const existingOr = filter.$or;
                delete filter.$or;
                filter.$and = [{ $or: existingOr }, { $or: orConditions }];
            } else {
                filter.$or = orConditions;
            }
        }

        // Price range filter (narrow facet results by requested price window)
        if (priceMin || priceMax) {
            filter.price = {};
            if (priceMin) filter.price.$gte = parseFloat(priceMin);
            if (priceMax) filter.price.$lte = parseFloat(priceMax);
        }

        // Normalize incoming params to actual schema fields (same mapping as GET /)
        const incomingFilters = {
            jewelleryType,
            product,
            gender,
            purity,
            occasion,
            metal,
            diamondClarity,
            collection,
            community,
            type,
            brand,
            size,
            materialColour,
        };

        const paramToField = {
            jewelleryType: "jewelleryType",
            product: "jewelleryType", // map 'product' UI filter to 'jewelleryType' field
            gender: "gender",
            purity: "karatage", // map 'purity' to 'karatage'
            occasion: "occasion",
            metal: "metal",
            diamondClarity: "diamondClarity",
            collection: "collection",
            community: null, // ignore
            type: "jewelleryType", // generic 'type' -> jewelleryType
            brand: "brand",
            size: "size",
            materialColour: "materialColour",
        };

        // Build case-insensitive exact-match filters using regex (handles "Gold" vs "gold" etc.)
        const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        Object.entries(incomingFilters).forEach(([param, value]) => {
            if (!value) return;
            const field = paramToField[param];
            if (!field) return;
            const values = String(value)
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean);
            if (!values.length) return;
            const regexes = values.map((v) => new RegExp(`^${esc(v)}$`, "i"));
            filter[field] = regexes.length > 1 ? { $in: regexes } : regexes[0];
        });

        // Build facet spec
        const facetFields = [
            "category",
            "jewelleryType",
            "gender",
            "karatage",
            "occasion",
            "metal",
            "diamondClarity",
            "collection",
            "brand",
            "size",
            "materialColour",
        ];

        const facetSpec = {};
        facetFields.forEach((field) => {
            facetSpec[field] = [
                { $match: { [field]: { $nin: [null, ""] } } },
                { $group: { _id: `$${field}`, count: { $sum: 1 } } },
                { $sort: { count: -1, _id: 1 } },
            ];
        });
        // Also include price range
        facetSpec.priceRange = [{ $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } }];

        const [agg] = await Product.aggregate([{ $match: filter }, { $facet: facetSpec }]);

        const facets = {};
        facetFields.forEach((field) => {
            const raw = agg?.[field] || [];
            facets[field] = raw
                .filter((r) => r._id !== null && r._id !== "")
                .map((r) => ({ value: r._id, count: r.count }));
        });

        const price = Array.isArray(agg?.priceRange) && agg.priceRange[0] ? agg.priceRange[0] : null;

        return res.json({
            facets,
            priceRange: price ? { min: price.min ?? 0, max: price.max ?? 0 } : { min: 0, max: 0 },
        });
    } catch (err) {
        console.error("❌ Error fetching product facets:", err);
        res.status(500).json({ error: "Failed to fetch product facets" });
    }
});

/**
 * @route   GET /api/products/:id
 * @desc    Fetch single product by ID
 * @access  Public
 */
router.get("/:id", async (req, res, next) => {
    try {
        // Avoid intercepting explicit routes like /search, /categories, /feed
        const reserved = new Set(["search", "categories", "feed"]);
        if (reserved.has(req.params.id)) return next();

        const product = await Product.findById(req.params.id).lean();
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json(withImageUrls(req, product));
    } catch (err) {
        console.error("❌ Error fetching product by ID:", err);
        res.status(500).json({ error: "Failed to fetch product" });
    }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product by ID
 * @access  Admin only
 */
router.put("/:id", adminAuth, upload.array("images", 5), async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            price,
            stocks,
            karatage,
            materialColour,
            grossWeight,
            metal,
            size,
            diamondClarity,
            diamondColor,
            numberOfDiamonds,
            diamondSetting,
            diamondShape,
            jewelleryType,
            brand,
            collection,
            gender,
            occasion,
        } = req.body;

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        // Resolve category relations for update
        const categorySlugUpdated =
            (req.body.categorySlug && String(req.body.categorySlug).toLowerCase()) ||
            (category ? slugify(category) : product.categorySlug || null);
        let updatedCategoryId = req.body.categoryId || product.categoryId || null;
        if (!updatedCategoryId && categorySlugUpdated) {
            try {
                const cat = await Category.findOne({ slug: categorySlugUpdated }).select("_id");
                if (cat) updatedCategoryId = cat._id;
            } catch { /* noop */ }
        }

        // Update fields
        Object.assign(product, {
            title,
            description,
            category,
            categorySlug: categorySlugUpdated,
            categoryId: updatedCategoryId,
            price,
            stocks,
            karatage,
            materialColour,
            grossWeight,
            metal,
            size,
            diamondClarity,
            diamondColor,
            numberOfDiamonds,
            diamondSetting,
            diamondShape,
            jewelleryType,
            brand,
            collection,
            gender,
            occasion,
        });

        // Update images if new ones uploaded
        if (req.files?.length > 0) {
            product.images = req.files.map((file) => file.filename);
        }

        await product.save();

        res.json({
            message: "✅ Product updated successfully",
            product,
        });
    } catch (err) {
        console.error("❌ Error updating product:", err);
        res.status(500).json({ error: "Failed to update product", details: err.message });
    }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product by ID
 * @access  Admin only
 */
router.delete("/:id", adminAuth, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json({ message: "🗑️ Product deleted successfully", product });
    } catch (err) {
        console.error("❌ Error deleting product:", err);
        res.status(500).json({ error: "Failed to delete product", details: err.message });
    }
});

/**
 * @route   GET /api/products/search
 * @desc    Always returns paginated/filterable product list for public consumption
 * @access  Public
 */
router.get("/search", async (req, res) => {
    try {
        const { q, category, categoryId, sort, page, limit } = req.query;

        const filter = {};
        if (q) {
            const regex = new RegExp(q, "i");
            filter.$or = [
                { title: regex },
                { description: regex },
                { category: regex },
                { brand: regex },
                { collection: regex },
            ];
        }
        // Category filter (prefer normalized slug or explicit ID). Backward compatible for legacy records.
        if (categoryId) {
            filter.categoryId = categoryId;
        } else if (category) {
            const slug = slugify(category);
            const nameRegex = new RegExp(`^${category}$`, "i");
            const orConditions = [];
            if (slug) orConditions.push({ categorySlug: slug });
            orConditions.push({ category: nameRegex });
            if (filter.$or) {
                const existingOr = filter.$or;
                delete filter.$or;
                filter.$and = [{ $or: existingOr }, { $or: orConditions }];
            } else {
                filter.$or = orConditions;
            }
        }

        const sortMap = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            title_asc: { title: 1 },
            title_desc: { title: -1 },
        };
        const sortOption = sortMap[sort] || sortMap.newest;

        const pageNum = Math.max(parseInt(page) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit) || 12, 1), 100);

        const [items, total] = await Promise.all([
            Product.find(filter)
                .sort(sortOption)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            Product.countDocuments(filter),
        ]);

        res.json({
            items: items.map((p) => withImageUrls(req, p)),
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
        });
    } catch (err) {
        console.error("❌ Error fetching products (search):", err);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

/**
 * @route   GET /api/products/categories
 * @desc    List distinct categories with counts
 * @access  Public
 */
router.get("/categories", async (req, res) => {
    try {
        const results = await Product.aggregate([
            { $match: { category: { $ne: null } } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);
        res.json(results.map((r) => ({ category: r._id, count: r.count })));
    } catch (err) {
        console.error("❌ Error fetching categories:", err);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

/**
 * @route   GET /api/products/feed
 * @desc    Lightweight product feed for mobile/app consumption
 * @access  Public
 */
router.get("/feed", async (req, res) => {
    try {
        const { q, category, categoryId, sort, page, limit } = req.query;

        const filter = {};
        if (q) {
            const regex = new RegExp(q, "i");
            filter.$or = [
                { title: regex },
                { description: regex },
                { category: regex },
                { brand: regex },
                { collection: regex },
            ];
        }
        // Category filter (prefer normalized slug or explicit ID). Backward compatible for legacy records.
        if (categoryId) {
            filter.categoryId = categoryId;
        } else if (category) {
            const slug = slugify(category);
            const nameRegex = new RegExp(`^${category}$`, "i");
            const orConditions = [];
            if (slug) orConditions.push({ categorySlug: slug });
            orConditions.push({ category: nameRegex });
            if (filter.$or) {
                const existingOr = filter.$or;
                delete filter.$or;
                filter.$and = [{ $or: existingOr }, { $or: orConditions }];
            } else {
                filter.$or = orConditions;
            }
        }

        const sortMap = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            title_asc: { title: 1 },
            title_desc: { title: -1 },
        };
        const sortOption = sortMap[sort] || sortMap.newest;

        const pageNum = Math.max(parseInt(page) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit) || 12, 1), 100);

        const [items, total] = await Promise.all([
            Product.find(filter, { title: 1, price: 1, images: 1, createdAt: 1 })
                .sort(sortOption)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            Product.countDocuments(filter),
        ]);

        const list = items.map((p) => {
            const withUrls = withImageUrls(req, p);
            return {
                id: String(withUrls._id),
                title: withUrls.title,
                price: withUrls.price,
                image: withUrls.primaryImageUrl,
            };
        });

        res.json({
            items: list,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
        });
    } catch (err) {
        console.error("❌ Error fetching product feed:", err);
        res.status(500).json({ error: "Failed to fetch product feed" });
    }
});

/**
 * @route   POST /api/products/admin/reprice-today?dryRun=true|false
 * @desc    Reprice all products using today's cached gold rates and product grossWeight × karat
 * @access  Admin only
 */
router.post("/admin/reprice-today", adminAuth, async (req, res) => {
    try {
        const dryRun = String(req.query.dryRun || "").toLowerCase() === "true";
        const summary = await repriceAllProducts({ dryRun });
        res.json(summary);
    } catch (err) {
        console.error("❌ Error repricing products:", err);
        res.status(500).json({ error: "Failed to reprice products", details: err.message || String(err) });
    }
});

module.exports = router;
