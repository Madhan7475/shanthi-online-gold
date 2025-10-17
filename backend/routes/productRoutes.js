const express = require("express");
const Product = require("../models/Product");
const { upload } = require("../middleware/upload");
const adminAuth = require("../middleware/adminAuth");
const { repriceAllProducts } = require("../services/productRepriceService");
const Category = require("../models/Category");
const MakingCharge = require("../models/MakingCharge");
const { getLatestGoldPrice } = require("../services/goldPriceService");
const fs = require("fs");
const path = require("path");
// Basic slugify (no external dependency)
const slugify = (s) =>
    String(s || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const router = express.Router();

/**
 * In non-production, bypass adminAuth for product writes by default,
 * unless explicitly disabled via DEV_ALLOW_PRODUCT_WRITE=0.
 * In production, require DEV_ALLOW_PRODUCT_WRITE=1 to bypass (normally keep it off).
 */
const isNonProd = (process.env.NODE_ENV !== "production");
const devAllowFlag = process.env.DEV_ALLOW_PRODUCT_WRITE;
const bypassWrites = isNonProd ? (devAllowFlag !== "0") : (devAllowFlag === "1");
const guard = bypassWrites ? (req, res, next) => next() : adminAuth;

console.log("[products] env:", {
    ENV_FILE: process.env.ENV_FILE || null,
    NODE_ENV: process.env.NODE_ENV || null,
    DEV_ALLOW_PRODUCT_WRITE: devAllowFlag || null,
    bypassWrites
});

// Debug endpoint to verify guard behavior
router.get("/_guard", (req, res) => {
    res.json({
        envFile: process.env.ENV_FILE || null,
        nodeEnv: process.env.NODE_ENV || null,
        devAllow: process.env.DEV_ALLOW_PRODUCT_WRITE || null,
        bypassWrites,
        guard: bypassWrites ? "bypass" : "adminAuth",
    });
});

const fileToUrl = (req, filename) => `${req.protocol}://${req.get("host")}/uploads/${filename}`;
const withImageUrls = (req, doc) => {
    const obj = doc?.toObject ? doc.toObject() : doc;
    const imageUrls = (obj.images || []).map((f) => fileToUrl(req, f));
    return { ...obj, imageUrls, primaryImageUrl: imageUrls[0] || null };
};

// Helpers to derive weight and rate on backend for price breakup
const parseGrams = (s) => {
    if (s == null) return null;
    const n = parseFloat(String(s).replace(",", ".").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : null;
};
const parseKarat = (karatage) => {
    if (!karatage) return null;
    const s = String(karatage).toUpperCase().trim();
    const m = s.match(/([0-9]{2})\s*K|([0-9]{2})\s*KT|^([0-9]{2})$/i);
    if (m) {
        const k = parseInt(m[1] || m[2] || m[3], 10);
        if (k > 0 && k <= 24) return k;
    }
    if (s.includes("24")) return 24;
    if (s.includes("22")) return 22;
    if (s.includes("18")) return 18;
    return null;
};
const rateForKarat = (karat, pricePerGram24kInr, pricePerGram22kInr, pricePerGram18kInr) => {
    if (!pricePerGram24kInr) return null;
    if (karat === 24) return pricePerGram24kInr;
    if (karat === 22 && pricePerGram22kInr) return pricePerGram22kInr;
    if (karat === 18 && pricePerGram18kInr) return pricePerGram18kInr;
    if (typeof karat === "number" && karat > 0 && karat <= 24) {
        return pricePerGram24kInr * (karat / 24);
    }
    return pricePerGram22kInr || pricePerGram24kInr;
};

// Compute live total for list views (making charges waived), using same parsing helpers.
const computeLiveTotalForProduct = (doc, rates) => {
    try {
        const weightGrams = parseGrams(doc?.grossWeight);
        const karat = parseKarat(doc?.karatage) ?? 22;
        const perGram = rateForKarat(karat, rates?.pricePerGram24kInr, rates?.pricePerGram22kInr, rates?.pricePerGram18kInr);
        if (weightGrams != null && perGram != null && isFinite(weightGrams) && isFinite(perGram)) {
            return Math.round(weightGrams * perGram * 1.06);
        }
    } catch { /* noop */ }
    return null;
};

/**
 * @route   POST /api/products
 * @desc    Upload a new product with multiple images
 * @access  Admin only
 */
router.post("/", guard, upload.array("images", 5), async (req, res) => {
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
            makingChargeType,
            makingChargeAmount,
            makingChargeCurrency,
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

        // Optional: create making charge if provided and amount is valid
        if (makingChargeType && makingChargeAmount !== undefined && Number.isFinite(parseFloat(makingChargeAmount))) {
            try {
                const mc = await MakingCharge.create({
                    type: String(makingChargeType).toLowerCase() === "variable" ? "variable" : "fixed",
                    amount: parseFloat(makingChargeAmount),
                    currency: makingChargeCurrency || "INR",
                    product: newProduct._id,
                });
                newProduct.makingCharge = mc._id;
                await newProduct.save();
            } catch (e) {
                console.warn("⚠️ MakingCharge creation failed:", e?.message || String(e));
            }
        }

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

            // Enrich with live total so listing pages show updated price consistently
            let rates = null;
            try { rates = await getLatestGoldPrice({ allowFetch: true }); } catch { /* fail-soft */ }
            const list = products.map((p) => {
                const obj = withImageUrls(req, p);
                const liveTotal = computeLiveTotalForProduct(obj, rates);
                return liveTotal != null ? { ...obj, price: liveTotal } : obj;
            });

            res.set("Cache-Control", "no-store");
            return res.json(list);
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

        // Map items and override price with live total (waived MC) so grids show updated price
        let rates = null;
        try { rates = await getLatestGoldPrice({ allowFetch: true }); } catch { /* ignore */ }
        const mapped = items.map((p) => {
            const obj = withImageUrls(req, p);
            const liveTotal = computeLiveTotalForProduct(obj, rates);
            return liveTotal != null ? { ...obj, price: liveTotal } : obj;
        });

        res.set("Cache-Control", "no-store");
        res.json({
            items: mapped,
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

        // Build response enriched with image URLs and price breakup computed on backend
        const base = withImageUrls(req, product);

        try {
            let rates = null;
            let rateSource = "none";
            try {
                // 1) Try in-memory cache (valid TTL) — fastest path
                rates = await getLatestGoldPrice({ allowFetch: false });
                rateSource = "cache";
            } catch (eCache) {
                // 2) Serve stale from disk immediately to keep product details snappy
                try {
                    const cachePath = path.join(__dirname, "..", "uploads", "gold_price_cache.json");
                    if (fs.existsSync(cachePath)) {
                        const raw = fs.readFileSync(cachePath, "utf8");
                        const parsed = JSON.parse(raw);
                        const data = parsed && (parsed.data || parsed);
                        if (data && (data.pricePerGram24kInr || data.pricePerGram22kInr)) {
                            rates = data;
                            rateSource = "stale-disk";
                            // Kick off a background refresh without blocking this request
                            setImmediate(() => {
                                getLatestGoldPrice({ allowFetch: true }).catch(() => { });
                            });
                        }
                    }
                } catch { /* ignore disk stale read errors */ }
                // 3) If no disk stale available, fall back to fetching live (blocking)
                if (!rates) {
                    try {
                        rates = await getLatestGoldPrice({ allowFetch: true });
                        rateSource = "fetch";
                    } catch { /* leave rates null */ }
                }
            }
            const weightGrams = parseGrams(base.grossWeight);
            const karat = parseKarat(base.karatage) ?? 22;
            const perGram = rateForKarat(karat, rates?.pricePerGram24kInr, rates?.pricePerGram22kInr, rates?.pricePerGram18kInr);
            const goldValueRaw = (weightGrams != null && perGram != null) ? (weightGrams * perGram) : null;

            // Ensure making charge is pulled from DB (since we no longer populate for perf)
            let mc = base.makingCharge || null;
            try {
                if (!mc || typeof mc !== "object" || typeof mc.amount === "undefined") {
                    const doc = await MakingCharge.findOne({ product: base._id }).lean();
                    if (doc) {
                        mc = { type: doc.type, amount: doc.amount, currency: doc.currency || "INR" };
                        // Attach minimal makingCharge to response so frontend can render the per-gram/fixed rate
                        base.makingCharge = mc;
                    }
                }
            } catch { /* ignore making-charge lookup errors */ }
            const mcType = mc?.type || null;
            const mcRatePerGram = mcType === "variable" ? Number(mc?.amount || 0) : null;
            const mcFixed = mcType === "fixed" ? Number(mc?.amount || 0) : null;

            let mcValueRaw = goldValueRaw != null ? goldValueRaw * 0.06 : null;

            // Only compute totals when inputs are available; otherwise leave null so UI can fall back to persisted DB price
            const goldValue = goldValueRaw != null ? Math.round(goldValueRaw) : null;
            const mcValue = mcValueRaw != null ? Math.round(mcValueRaw) : null;
            const mcDiscountPercent = 0;
            const mcWaived = false;
            const mcValueDiscounted = mcValue != null ? mcValue : null;
            const total = goldValue != null ? (goldValue + (mcValueDiscounted ?? 0)) : null;

            base.priceBreakup = {
                weightGrams,
                karat,
                goldRatePerGramInr: perGram ?? null,
                goldValue: goldValue,
                makingCharge: {
                    type: mcType,
                    ratePerGram: mcRatePerGram,
                    fixed: mcFixed,
                    value: mcValue,
                    discountPercent: mcDiscountPercent,
                    waived: mcWaived,
                    valueDiscounted: mcValueDiscounted,
                },
                total: Number.isFinite(total) ? total : null,
                goldRates: {
                    pricePerGram24kInr: rates?.pricePerGram24kInr ?? null,
                    pricePerGram22kInr: rates?.pricePerGram22kInr ?? null,
                    lastUpdated: rates?.lastUpdated ?? null,
                    source: rates?.source ?? null,
                },
            };
        } catch (e) {
            // Fail-soft: if rates unavailable, just return base object
            console.warn("⚠️ Failed to compute priceBreakup:", e?.message || String(e));
        }

        // Debug headers to verify live rate used on this response
        const pb = base && base.priceBreakup ? base.priceBreakup : null;
        try {
            if (pb && typeof pb.goldRatePerGramInr === "number") {
                res.set("X-Gold-RatePerGram", String(pb.goldRatePerGramInr));
            }
            if (pb && typeof pb.karat !== "undefined" && pb.karat !== null) {
                res.set("X-Gold-Karat", String(pb.karat));
            }
            if (pb && typeof pb.weightGrams === "number") {
                res.set("X-Gold-WeightGrams", String(pb.weightGrams));
            }
            if (pb && pb.goldRates) {
                if (pb.goldRates.source) res.set("X-Gold-Source", String(pb.goldRates.source));
                if (pb.goldRates.lastUpdated) res.set("X-Gold-Updated", String(pb.goldRates.lastUpdated));
            }
            try {
                if (typeof rateSource !== "undefined" && rateSource) {
                    res.set("X-Gold-Rate-Source", String(rateSource));
                }
            } catch { /* best-effort header */ }
        } catch (_) {
            // header set is best-effort
        }
        // Prevent caching so each request can fetch the latest rate if needed
        res.set("Cache-Control", "no-store");
        res.json(base);
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
router.put("/:id", guard, upload.array("images", 5), async (req, res) => {
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
            makingChargeType,
            makingChargeAmount,
            makingChargeCurrency,
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

        // Upsert making charge if provided
        if (makingChargeType && makingChargeAmount !== undefined && Number.isFinite(parseFloat(makingChargeAmount))) {
            try {
                const amountNum = parseFloat(makingChargeAmount);
                let mc = await MakingCharge.findOne({ product: product._id });
                if (mc) {
                    mc.type = String(makingChargeType).toLowerCase() === "variable" ? "variable" : "fixed";
                    mc.amount = amountNum;
                    mc.currency = makingChargeCurrency || mc.currency || "INR";
                    await mc.save();
                } else {
                    mc = await MakingCharge.create({
                        type: String(makingChargeType).toLowerCase() === "variable" ? "variable" : "fixed",
                        amount: amountNum,
                        currency: makingChargeCurrency || "INR",
                        product: product._id,
                    });
                }
                product.makingCharge = mc._id;
            } catch (e) {
                console.warn("⚠️ MakingCharge upsert failed:", e?.message || String(e));
            }
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
router.delete("/:id", guard, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        // Clean up linked making charge if present
        try {
            await MakingCharge.deleteOne({ product: product._id });
        } catch (e) {
            console.warn("⚠️ Failed to delete linked MakingCharge:", e?.message || String(e));
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

        let rates = null;
        try { rates = await getLatestGoldPrice({ allowFetch: true }); } catch { /* ignore */ }
        const mapped = items.map((p) => {
            const obj = withImageUrls(req, p);
            const liveTotal = computeLiveTotalForProduct(obj, rates);
            return liveTotal != null ? { ...obj, price: liveTotal } : obj;
        });

        res.set("Cache-Control", "no-store");
        res.json({
            items: mapped,
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

        let rates = null;
        try { rates = await getLatestGoldPrice({ allowFetch: true }); } catch { /* ignore */ }

        const list = items.map((p) => {
            const withUrls = withImageUrls(req, p);
            const liveTotal = computeLiveTotalForProduct(withUrls, rates);
            return {
                id: String(withUrls._id),
                title: withUrls.title,
                price: (liveTotal != null ? liveTotal : withUrls.price),
                image: withUrls.primaryImageUrl,
            };
        });

        res.set("Cache-Control", "no-store");
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
        const allowFetch = String(req.query.allowFetch || "").toLowerCase() === "true";
        const summary = await repriceAllProducts({ dryRun, allowFetch });
        res.json(summary);
    } catch (err) {
        console.error("❌ Error repricing products:", err);
        res.status(500).json({ error: "Failed to reprice products", details: err.message || String(err) });
    }
});

module.exports = router;
