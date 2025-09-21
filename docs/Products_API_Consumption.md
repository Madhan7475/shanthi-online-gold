# Products API Consumption Guide

This guide explains how app developers can consume the Products API exposed by the backend.

Base URLs
- Local: http://localhost:9000
- Production: https://YOUR_BACKEND_DOMAIN

Authentication
- Public product endpoints do not require authentication.
- Admin endpoints (create/update/delete) require admin auth (already enforced server-side).

CORS
- The backend allows the origin specified by FRONTEND_URL in backend/.env.
- For production apps, set FRONTEND_URL to your app domain and restart the backend.

Image Hosting
- Product images are served from /uploads.
- All product responses include:
  - imageUrls: absolute URLs for each image
  - primaryImageUrl: first image URL

Example absolute URL:
http://localhost:9000/uploads/1758036670172-NECKLACE.jpg

-------------------------------------------------------------------------------

1) List Products (auto-mode)
- GET /api/products

Behavior
- If no query params are provided: returns a plain array for backward compatibility.
- If any query param is present (q/category/sort/page/limit): returns a paginated object.

Query params
- q: string. Full-text search on title, description, category, brand, collection
- category: string. Exact match (case-insensitive)
- sort: newest | oldest | price_asc | price_desc | title_asc | title_desc
- page: number. Default 1
- limit: number. Default 12 (max 100)

Examples
- Plain list (no query)
  curl -s http://localhost:9000/api/products

  Response (array):
  [
    {
      "_id": "...",
      "title": "Dawn Gold Necklace Set",
      "price": 736189,
      "images": ["1758036670172-NECKLACE.jpg", "..."],
      "imageUrls": ["http://localhost:9000/uploads/1758036670172-NECKLACE.jpg", "..."],
      "primaryImageUrl": "http://localhost:9000/uploads/1758036670172-NECKLACE.jpg",
      ...
    },
    ...
  ]

- With query (paginated)
  curl -s "http://localhost:9000/api/products?q=ring&sort=price_desc&page=1&limit=12"

  Response (object):
  {
    "items": [ { ...product with imageUrls... } ],
    "total": 42,
    "page": 1,
    "pages": 4
  }

Axios usage
import axios from "axios";
const api = axios.create({ baseURL: "http://localhost:9000" });

// plain list
const products = (await api.get("/api/products")).data;

// paginated search
const res = (await api.get("/api/products", { params: { q: "ring", page: 1, limit: 12, sort: "newest" } })).data;
console.log(res.items, res.total);

-------------------------------------------------------------------------------

2) Always-Paginated Search
- GET /api/products/search

Always returns a paginated result, even without query params.

Query params
- q, category, sort, page, limit (same as above)

Example
curl -s "http://localhost:9000/api/products/search?q=bridal&limit=6"

Response
{
  "items": [ { ...product with imageUrls... } ],
  "total": 6,
  "page": 1,
  "pages": 1
}

-------------------------------------------------------------------------------

3) Product Detail
- GET /api/products/:id

Returns a single product by its MongoDB _id, including imageUrls and primaryImageUrl.

Example
curl -s http://localhost:9000/api/products/68c9359586c5d737379c6ccc

Response
{
  "_id": "68c9359586c5d737379c6ccc",
  "title": "Dawn Gold Necklace Set",
  "price": 736189,
  "images": ["1758036670172-NECKLACE.jpg"],
  "imageUrls": ["http://localhost:9000/uploads/1758036670172-NECKLACE.jpg"],
  "primaryImageUrl": "http://localhost:9000/uploads/1758036670172-NECKLACE.jpg",
  ...
}

Important
- Reserved route names /search, /categories, /feed are not intercepted by :id internally.

-------------------------------------------------------------------------------

4) Categories with Counts
- GET /api/products/categories

Returns distinct product categories with item counts. Use this to render dynamic category chips/cards on the home page.

Example
curl -s http://localhost:9000/api/products/categories

Response
[
  { "category": "gold-necklace", "count": 12 },
  { "category": "gold-bangles", "count": 9 },
  ...
]

-------------------------------------------------------------------------------

5) Lightweight Product Feed (Mobile/App)
- GET /api/products/feed

Returns a minimal list for fast list rendering. Each item includes id, title, price, image (primaryImageUrl).

Query params
- q, category, sort, page, limit

Example
curl -s "http://localhost:9000/api/products/feed?limit=6"

Response
{
  "items": [
    { "id": "68c9359586c5d737379c6ccc", "title": "Dawn Gold Necklace Set", "price": 736189, "image": "http://localhost:9000/uploads/1758036670172-NECKLACE.jpg" },
    ...
  ],
  "total": 50,
  "page": 1,
  "pages": 9
}

-------------------------------------------------------------------------------

Admin Endpoints (Protected)
- POST /api/products
  - Content-Type: multipart/form-data
  - Field name for images: images (up to 5)
  - Body fields: title, description, category, price, stocks, karatage, materialColour, grossWeight, metal, size, diamondClarity, diamondColor, numberOfDiamonds, diamondSetting, diamondShape, jewelleryType, brand, collection, gender, occasion

- PUT /api/products/:id
  - Content-Type: multipart/form-data (optional new images[])

- DELETE /api/products/:id

These require admin authentication and are not intended for public app consumption.

-------------------------------------------------------------------------------

Error Format
Errors are returned with HTTP status codes and a simple JSON body.

Example
HTTP/1.1 500 Internal Server Error
{ "error": "Failed to fetch products" }

You should check response.status and fallback gracefully in the UI. For paginated endpoints, treat errors as an empty list with an error banner.

-------------------------------------------------------------------------------

Tips for Frontend Integration
- Use imageUrls or primaryImageUrl directly for image tags; do not prepend paths manually.
- Prefer /api/products/search or /api/products/feed for pagination-driven UIs.
- Use /api/products/categories to render dynamic categories on the home page (instead of static lists).
- CORS: Ensure your app domain is set in backend/.env FRONTEND_URL.

-------------------------------------------------------------------------------

Change Log (API)
- Added imageUrls, primaryImageUrl enrichment to product responses.
- Added /api/products/search (always-paginated).
- Added /api/products/categories (dynamic counts).
- Added /api/products/feed (lightweight listing).
- Preserved backward-compatible behavior for GET /api/products (plain array when no query).
