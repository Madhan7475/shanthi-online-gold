// backend/scripts/importProductsFromExcel.js
// Bulk-import Products from an Excel/CSV file into MongoDB.
//
// Usage examples:
//   ENV_FILE=.env.prod node backend/scripts/importProductsFromExcel.js --file=./backend/uploads/products.xlsx
//   ENV_FILE=.env.prod node backend/scripts/importProductsFromExcel.js --file=./backend/uploads/products.csv --mode=upsert --upsertKey=title
//   ENV_FILE=.env.staging node backend/scripts/importProductsFromExcel.js --file=./backend/uploads/products.xlsx --dryRun
//
// Requirements:
//   npm i xlsx yargs slugify
//
// Supported columns in Excel/CSV (all optional except title/price/category):
//   title, description, category, price, stocks, karatage, materialColour, grossWeight, metal,
//   size, diamondClarity, diamondColor, numberOfDiamonds, diamondSetting, diamondShape,
//   jewelleryType, brand, collection, gender,
//   images (comma-separated), image1, image2, image3 (alternative columns),
//   makingChargeId (Mongo ObjectId of MakingCharge),
//   makingChargeName (will be resolved to MakingCharge _id if found),
//   categoryId (optional explicit ObjectId), categorySlug (optional explicit slug)
//
// Upsert logic:
//  - mode=insert (default): only insert new docs
//  - mode=upsert: find existing doc by upsertKey (default: title) and update or insert if missing
//
// Output:
//  - Summary printed to console
//  - Failed rows (validation/DB) saved to ./backend/uploads/import_failures_<timestamp>.json

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const slugify = require('slugify');

require('dotenv').config({ path: process.env.ENV_FILE || '.env' });

const connectDB = require('../config/db');
const Product = require('../models/Product');
let MakingCharge = null;
let Category = null;

// Helpers
const toNumber = (v) => {
    if (v === null || v === undefined || v === '') return undefined;
    // Strip currency symbols, INR, commas, spaces and any non-numeric chars except dot/minus
    const cleaned = String(v).toString().replace(/[^\d.\-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
};

const toTrimmed = (v) => {
    if (v === null || v === undefined) return undefined;
    const s = String(v).trim();
    return s.length ? s : undefined;
};

const toImagesArray = (row) => {
    const toFilename = (val) => {
        if (val == null) return null;
        const cleaned = String(val)
            .replace(/^[\s'"\[\]\(\)]+|[\s'"\[\]\(\)]+$/g, '')
            .replace(/\\/g, '/');
        const base = path.basename(cleaned);
        return base && base !== '.' ? base : null;
    };

    const parseImagesCell = (cell) => {
        if (cell == null) return [];
        let text = String(cell).trim();

        // Try JSON-like arrays (normalize single quotes to double if needed)
        if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('(') && text.endsWith(')'))) {
            let jsonText = text;
            if (jsonText.includes("'") && !jsonText.includes('"')) {
                jsonText = jsonText.replace(/'/g, '"');
            }
            try {
                const arr = JSON.parse(jsonText.replace(/^\(|\)$/g, ''));
                if (Array.isArray(arr)) {
                    return arr.map(toFilename).filter(Boolean);
                }
            } catch {
                // fall through to delimiter parsing
            }
        }

        // Delimiter-based parse: comma, semicolon, pipe, newline
        return text
            .split(/[\n,;|]+/)
            .map(toFilename)
            .filter(Boolean);
    };

    // Priority: images column OR image1,image2,...
    let images = [];
    if (row.images) {
        images = parseImagesCell(row.images);
    } else {
        const keys = Object.keys(row)
            .filter((k) => /^image\d+$/i.test(k))
            .sort((a, b) => {
                const ai = Number(a.replace(/^\D+/g, '')) || 0;
                const bi = Number(b.replace(/^\D+/g, '')) || 0;
                return ai - bi;
            });

        images = keys
            .map((k) => toFilename(row[k]))
            .filter(Boolean);
    }

    // If nothing valid parsed, return undefined so we don't overwrite with []
    return images.length ? images : undefined;
};

const toSlug = (s) => {
    if (!s) return undefined;
    return slugify(String(s), { lower: true, strict: true });
};

const looksLikeObjectId = (s) => /^[a-fA-F0-9]{24}$/.test(String(s || ''));

// CLI args
const argv = yargs(hideBin(process.argv))
    .option('file', {
        alias: 'f',
        type: 'string',
        describe: 'Path to Excel/CSV file',
        demandOption: true,
    })
    .option('mode', {
        alias: 'm',
        choices: ['insert', 'upsert'],
        default: 'insert',
        describe: 'Insert new docs or upsert existing',
    })
    .option('upsertKey', {
        alias: 'k',
        type: 'string',
        default: 'title',
        describe: 'Field name to match for upsert (e.g. title)',
    })
    .option('dryRun', {
        type: 'boolean',
        default: false,
        describe: 'Parse and validate only; no DB writes',
    })
    .option('limit', {
        type: 'number',
        describe: 'Only import first N rows',
    })
    .help()
    .strict()
    .argv;

(async () => {
    const startedAt = new Date();
    const filePath = path.resolve(argv.file);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Input file not found: ${filePath}`);
        process.exit(1);
    }

    // Lazy require optional models (if present)
    try { MakingCharge = require('../models/MakingCharge'); } catch { }
    try { Category = require('../models/Category'); } catch { }

    // Connect DB
    await connectDB();

    // Load workbook
    const wb = xlsx.readFile(filePath, { cellDates: false, raw: false });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    let rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (argv.limit && Number.isFinite(argv.limit)) {
        rows = rows.slice(0, argv.limit);
    }

    console.log(`📦 Importing from: ${filePath}`);
    console.log(`📄 Sheet: ${sheetName}, Rows: ${rows.length}`);
    console.log(`🛠  Mode: ${argv.mode} ${argv.mode === 'upsert' ? `(upsertKey=${argv.upsertKey})` : ''}`);
    if (argv.dryRun) console.log('🔍 Dry-run: no DB writes will be performed');

    const failures = [];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let rowIndex = 0;

    for (const rawRow of rows) {
        rowIndex += 1;
        try {
            // Normalize headers to canonical keys (case/space/underscore insensitive) + alias map
            const row = {};
            const keyMap = {
                title: 'title', productname: 'title', name: 'title',
                category: 'category', categoryname: 'category',
                price: 'price', mrp: 'price', amount: 'price', sellingprice: 'price',
                stocks: 'stocks', stock: 'stocks', quantity: 'stocks',
                karatage: 'karatage', karat: 'karatage',
                materialcolour: 'materialColour', materialcolor: 'materialColour',
                grossweight: 'grossWeight',
                metal: 'metal',
                size: 'size',
                diamondclarity: 'diamondClarity',
                diamondcolor: 'diamondColor',
                numberofdiamonds: 'numberOfDiamonds',
                diamondsetting: 'diamondSetting',
                diamondshape: 'diamondShape',
                jewellerytype: 'jewelleryType',
                brand: 'brand',
                collection: 'collection',
                gender: 'gender',
                images: 'images',
                categoryslug: 'categorySlug',
                categoryid: 'categoryId',
                makingchargeid: 'makingChargeId',
                makingchargename: 'makingChargeName',
                description: 'description',
            };
            Object.keys(rawRow).forEach((k) => {
                const norm = String(k).toLowerCase().replace(/[\s_-]+/g, '');
                const imageMatch = norm.match(/^image(\d+)$/i);
                let canonical = keyMap[norm] || (imageMatch ? `image${imageMatch[1]}` : null);
                const value = rawRow[k];
                if (canonical) {
                    row[canonical] = value;
                } else {
                    // Fallback: preserve original trimmed key for any unrecognized columns
                    row[String(k).trim()] = value;
                }
            });

            // Mandatory fields
            const title = toTrimmed(row.title);
            const category = toTrimmed(row.category);
            const price = toNumber(row.price);

            if (!title || !category || !Number.isFinite(price)) {
                skipped += 1;
                failures.push({ rowIndex, reason: 'Missing required fields (title/category/price)', row });
                continue;
            }

            // Optional/other fields
            const payload = {
                title,
                description: toTrimmed(row.description),
                category,
                categorySlug: toTrimmed(row.categorySlug) || toSlug(category),
                categoryId: looksLikeObjectId(row.categoryId) ? new mongoose.Types.ObjectId(row.categoryId) : undefined,
                price,
                stocks: toNumber(row.stocks) ?? 0,
                karatage: toTrimmed(row.karatage),
                materialColour: toTrimmed(row.materialColour),
                grossWeight: toTrimmed(row.grossWeight),
                metal: toTrimmed(row.metal),
                size: toTrimmed(row.size),
                diamondClarity: toTrimmed(row.diamondClarity),
                diamondColor: toTrimmed(row.diamondColor),
                numberOfDiamonds: toTrimmed(row.numberOfDiamonds),
                diamondSetting: toTrimmed(row.diamondSetting),
                diamondShape: toTrimmed(row.diamondShape),
                jewelleryType: toTrimmed(row.jewelleryType),
                brand: toTrimmed(row.brand),
                collection: toTrimmed(row.collection),
                gender: toTrimmed(row.gender),
                images: toImagesArray(row),
            };

            // Resolve MakingCharge if provided
            if (looksLikeObjectId(row.makingChargeId)) {
                payload.makingCharge = new mongoose.Types.ObjectId(row.makingChargeId);
            } else if (toTrimmed(row.makingChargeName) && MakingCharge) {
                const mc = await MakingCharge.findOne({ name: toTrimmed(row.makingChargeName) }).lean();
                if (mc?._id) payload.makingCharge = mc._id;
            }

            // Resolve Category by name if categoryId is not provided but Category collection exists
            if (!payload.categoryId && Category) {
                const cat = await Category.findOne({ name: category }).lean();
                if (cat?._id) payload.categoryId = cat._id;
            }

            // Clean undefined fields (so we don't overwrite with undefined)
            Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

            if (argv.dryRun) {
                const imagesPreview = Array.isArray(payload.images) ? payload.images.slice(0, 3) : null;
                console.log(`DRY-RUN row#${rowIndex}:`, {
                    title: payload.title,
                    category: payload.category,
                    price: payload.price,
                    imagesCount: Array.isArray(payload.images) ? payload.images.length : 0,
                    imagesPreview,
                    rawImagesCell: row.images ?? null,
                });
                continue;
            }

            if (argv.mode === 'upsert') {
                const key = argv.upsertKey;
                if (!key || !payload[key]) {
                    failures.push({ rowIndex, reason: `Upsert key "${key}" missing in row`, row });
                    continue;
                }
                const filter = { [key]: payload[key] };
                const res = await Product.findOneAndUpdate(filter, { $set: payload }, { new: true, upsert: true, setDefaultsOnInsert: true });
                // Determine if inserted or updated
                const wasNew = res && res.createdAt && Math.abs(new Date(res.createdAt).getTime() - Date.now()) < 5000;
                if (wasNew) inserted += 1;
                else updated += 1;
            } else {
                await Product.create(payload);
                inserted += 1;
            }
        } catch (err) {
            failures.push({
                rowIndex,
                reason: err?.message || 'Unknown error',
                stack: err?.stack,
                row: rawRow,
            });
        }
    }

    const finishedAt = new Date();
    console.log('—— Import Summary ——');
    console.log(`Processed: ${rows.length}`);
    console.log(`Inserted:  ${inserted}`);
    console.log(`Updated:   ${updated}`);
    console.log(`Skipped:   ${skipped}`);
    console.log(`Failures:  ${failures.length}`);
    console.log(`Started:   ${startedAt.toISOString()}`);
    console.log(`Finished:  ${finishedAt.toISOString()}`);

    if (failures.length) {
        const outDir = path.resolve(__dirname, '../uploads');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        const outPath = path.join(outDir, `import_failures_${Date.now()}.json`);
        fs.writeFileSync(outPath, JSON.stringify(failures, null, 2));
        console.log(`⚠️  Failure details saved to: ${outPath}`);
    }

    await mongoose.connection.close();
    process.exit(0);
})().catch(async (e) => {
    console.error('Fatal import error:', e);
    try { await mongoose.connection.close(); } catch { }
    process.exit(1);
});
