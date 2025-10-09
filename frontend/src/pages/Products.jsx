import React, { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Common/Layout";
import { FaFilter, FaTimes } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Pagination from "../components/Common/Pagination";

// Facets we will render on the Filters page (dynamic, from backend)
const FACETS = [
    { facetKey: "category", label: "Category", param: "category" },
    { facetKey: "jewelleryType", label: "Jewellery Type", param: "jewelleryType" },
    { facetKey: "metal", label: "Metal", param: "metal" },
    { facetKey: "karatage", label: "Purity", param: "purity" }, // frontend param -> backend maps to karatage
    { facetKey: "gender", label: "Gender", param: "gender" },
    { facetKey: "occasion", label: "Occasion", param: "occasion" },
    { facetKey: "collection", label: "Collection", param: "collection" },
];

function parseArrayParam(searchParams, key) {
    const raw = searchParams.get(key);
    if (!raw) return [];
    return raw.split(",").map((v) => v.trim()).filter(Boolean);
}

function parseNumber(searchParams, key) {
    const v = searchParams.get(key);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

const ProductsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

    // UI state
    const [showFilters, setShowFilters] = useState(false);
    const [expanded, setExpanded] = useState({});
    const [loading, setLoading] = useState(false);

    // Data
    const [products, setProducts] = useState([]);
    const [facets, setFacets] = useState({});
    const [priceRange, setPriceRange] = useState({ min: 0, max: 0 }); // from server
    const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1 });

    // Selected filters (store as params names used by backend API: category, jewelleryType, metal, purity, gender, occasion, diamondClarity, collection)
    const [selected, setSelected] = useState({});
    const [priceMin, setPriceMin] = useState();
    const [priceMax, setPriceMax] = useState();
    const [page, setPage] = useState(1);

    // Initialize from URL once
    useEffect(() => {
        const initial = {};
        FACETS.forEach(({ param }) => {
            const arr = parseArrayParam(searchParams, param);
            if (arr.length) initial[param] = arr;
        });

        // Price + Page
        const pmin = parseNumber(searchParams, "priceMin");
        const pmax = parseNumber(searchParams, "priceMax");
        const p = parseNumber(searchParams, "page") || 1;

        setSelected(initial);
        setPriceMin(pmin);
        setPriceMax(pmax);
        setPage(p);
    }, []); // run only once

    // Keep state in sync when URL changes (e.g., after "Clear all" or navigating from category pages)
    useEffect(() => {
        const next = {};
        FACETS.forEach(({ param }) => {
            const arr = parseArrayParam(searchParams, param);
            if (arr.length) next[param] = arr;
        });

        const pmin = parseNumber(searchParams, "priceMin");
        const pmax = parseNumber(searchParams, "priceMax");
        const p = parseNumber(searchParams, "page") || 1;

        setSelected(next);
        setPriceMin(pmin);
        setPriceMax(pmax);
        setPage(p);
    }, [searchParams]);

    // Auto-open sidebar when arriving with ?openFilters=1, then strip the param
    useEffect(() => {
        const sp = new URLSearchParams(searchParams);
        if (sp.get("openFilters") === "1") {
            setShowFilters(true);
            sp.delete("openFilters");
            navigate({ pathname: "/products", search: sp.toString() }, { replace: true });
        }
    }, [searchParams, navigate]);

    const buildParams = useCallback(
        (overrides = {}) => {
            const params = new URLSearchParams();

            // Merge current with overrides
            const currentSelected = overrides.selected ?? selected;
            const currentPage = overrides.page ?? page;
            const curPriceMin = overrides.priceMin === null ? undefined : (overrides.priceMin ?? priceMin);
            const curPriceMax = overrides.priceMax === null ? undefined : (overrides.priceMax ?? priceMax);

            // Selected multi-select
            Object.entries(currentSelected || {}).forEach(([param, arr]) => {
                if (Array.isArray(arr) && arr.length) {
                    params.set(param, arr.join(","));
                }
            });

            // Price
            if (curPriceMin !== undefined) params.set("priceMin", String(curPriceMin));
            if (curPriceMax !== undefined) params.set("priceMax", String(curPriceMax));

            // Pagination
            params.set("page", String(currentPage));
            params.set("limit", "12");

            return params;
        },
        [selected, page, priceMin, priceMax]
    );

    const pushUrl = useCallback(
        (overrides = {}) => {
            const params = buildParams(overrides);
            navigate({ pathname: "/products", search: params.toString() }, { replace: false });
        },
        [buildParams, navigate]
    );

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const params = buildParams();
            const { data } = await axiosInstance.get("/products", { params: Object.fromEntries(params.entries()) });

            const items = data.items || data;
            const pages = data.pages || data.totalPages || 1;
            const pageNum = Number(params.get("page") || 1);

            setProducts(Array.isArray(items) ? items : []);
            setPageInfo({ page: pageNum, pages: pages });
        } catch (err) {
            console.error("❌ Failed to load products:", err);
            setProducts([]);
            setPageInfo({ page: 1, pages: 1 });
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    const fetchFacets = useCallback(async () => {
        try {
            const params = buildParams();
            // Facets don't need pagination
            params.delete("page");
            params.delete("limit");
            const { data } = await axiosInstance.get("/products/facets", {
                params: Object.fromEntries(params.entries()),
            });

            setFacets(data.facets || {});
            if (data.priceRange) {
                setPriceRange({
                    min: Number(data.priceRange.min) || 0,
                    max: Number(data.priceRange.max) || 0,
                });
            }
        } catch (err) {
            console.error("❌ Failed to load facets:", err);
        }
    }, [buildParams]);

    // React to filter/page changes by fetching products and facets
    useEffect(() => {
        fetchProducts();
        fetchFacets();
    }, [fetchProducts, fetchFacets]);

    const toggleExpanded = (key) => setExpanded((e) => ({ ...e, [key]: !e[key] }));

    const onToggleOption = (param, value) => {
        setSelected((prev) => {
            const cur = new Set(prev[param] || []);
            if (cur.has(value)) cur.delete(value);
            else cur.add(value);
            const nextSelected = { ...prev, [param]: Array.from(cur) };
            // If empty, remove key
            if (nextSelected[param].length === 0) {
                const { [param]: _, ...rest } = nextSelected;
                pushUrl({ selected: rest, page: 1 });
                setPage(1);
                return rest;
            }
            pushUrl({ selected: nextSelected, page: 1 });
            setPage(1);
            return nextSelected;
        });
    };

    const onClearAll = () => {
        setSelected({});
        setPriceMin(undefined);
        setPriceMax(undefined);
        setPage(1);
        setShowFilters(false); // return to original mode (sidebar closed)
        setExpanded({}); // reset expanded sections
        pushUrl({ selected: {}, priceMin: null, priceMax: null, page: 1 }); // strip all filters from URL
        try {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch { }
    };

    const onPriceCommit = () => {
        setPage(1);
        pushUrl({ page: 1 });
    };

    const handlePageChange = (p) => {
        setPage(p);
        pushUrl({ page: p });
        // scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const appliedCount = useMemo(
        () =>
            Object.values(selected).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0) +
            (priceMin !== undefined ? 1 : 0) +
            (priceMax !== undefined ? 1 : 0),
        [selected, priceMin, priceMax]
    );

    return (
        <Layout>
            {/* Banner */}
            <div className="w-screen h-40 md:h-72 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
                <img src="/gold14.jpg" alt="Products Banner" className="w-full h-full object-cover" />
            </div>

            <div className="px-4 sm:px-6 md:px-8 max-w-7xl mx-auto relative">
                <h1 className="text-2xl font-bold mb-4 mt-6 text-[#400F45] text-center">Products</h1>

                {/* Filter Toggle */}
                {!showFilters && (
                    <div className="flex justify-between items-center mb-4">
                        <button
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm text-[#400F45] hover:bg-gray-100"
                            onClick={() => setShowFilters(true)}
                        >
                            <FaFilter />
                            <span>Filters{appliedCount ? ` (${appliedCount})` : ""}</span>
                            <span className="rotate-90">⌄</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                className="text-sm text-gray-600 hover:text-[#400F45] underline"
                                onClick={onClearAll}
                            >
                                Clear all
                            </button>
                        </div>
                    </div>
                )}

                {/* Overlay */}
                <div
                    className={`fixed inset-0 bg-black bg-opacity-30 z-30 transition-opacity duration-300 ${showFilters ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                        }`}
                    onClick={() => setShowFilters(false)}
                />

                {/* Sidebar */}
                <div
                    className={`fixed top-0 left-0 w-80 h-full bg-white z-40 p-6 shadow-lg overflow-y-auto transform transition-transform duration-300 ease-in-out ${showFilters ? "translate-x-0" : "-translate-x-full"
                        }`}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-[#400F45]">Filters</h2>
                        <div className="flex items-center gap-3">
                            <button
                                className="text-sm text-gray-600 hover:text-[#400F45] underline"
                                onClick={onClearAll}
                            >
                                Clear all
                            </button>
                            <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-[#400F45]">
                                <FaTimes size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Price range */}
                    <div className="mb-4">
                        <div className="w-full text-left font-medium text-sm text-[#400F45] border-b py-2">Price</div>
                        <div className="mt-3 flex items-center gap-2">
                            <input
                                type="number"
                                min={0}
                                placeholder={priceRange.min ? `Min (${priceRange.min})` : "Min"}
                                value={priceMin ?? ""}
                                onChange={(e) => setPriceMin(e.target.value === "" ? undefined : Number(e.target.value))}
                                onBlur={onPriceCommit}
                                className="w-1/2 border rounded px-2 py-1 text-sm"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                                type="number"
                                min={0}
                                placeholder={priceRange.max ? `Max (${priceRange.max})` : "Max"}
                                value={priceMax ?? ""}
                                onChange={(e) => setPriceMax(e.target.value === "" ? undefined : Number(e.target.value))}
                                onBlur={onPriceCommit}
                                className="w-1/2 border rounded px-2 py-1 text-sm"
                            />
                        </div>
                        {priceRange.min !== undefined && priceRange.max !== undefined && (
                            <div className="mt-1 text-xs text-gray-500">
                                Range available: ₹{priceRange.min?.toLocaleString?.() || 0} - ₹{priceRange.max?.toLocaleString?.() || 0}
                            </div>
                        )}
                    </div>

                    {/* Dynamic facets */}
                    <div className="space-y-3">
                        {FACETS.map(({ facetKey, label, param }) => {
                            const options = facets?.[facetKey] || []; // [{ value, count }]
                            if (!Array.isArray(options) || options.length === 0) return null;
                            return (
                                <div key={facetKey} className="border-b pb-2">
                                    <button
                                        onClick={() => toggleExpanded(label)}
                                        className="w-full text-left font-medium text-sm text-[#400F45] py-2"
                                    >
                                        {label}
                                    </button>
                                    <div className={`mt-2 ${expanded[label] ? "block" : "hidden"}`}>
                                        <ul className="pl-1 pr-1 py-1 space-y-1 text-sm text-[#333] max-h-[300px] overflow-y-auto">
                                            {options.map((opt, idx) => {
                                                const val = String(opt.value);
                                                const checked = (selected[param] || []).includes(val);
                                                return (
                                                    <li key={`${val}-${idx}`} className="truncate">
                                                        <label className="flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                className="mr-2"
                                                                checked={checked}
                                                                onChange={() => onToggleOption(param, val)}
                                                            />
                                                            <span className="truncate">
                                                                {val} {typeof opt.count === "number" ? `(${opt.count})` : ""}
                                                            </span>
                                                        </label>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500">Loading products...</p>
                    </div>
                ) : (
                    <>
                        {products.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-500">No products found matching your filters.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 pb-10">
                                {products.map((product) => (
                                    <div
                                        key={product._id}
                                        className="relative border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                                    >
                                        <div className="w-full h-72 bg-white">
                                            <img
                                                src={
                                                    product.primaryImageUrl
                                                        ? product.primaryImageUrl
                                                        : product.imageUrls?.[0]
                                                            ? product.imageUrls[0]
                                                            : product.images?.[0]
                                                                ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${product.images[0]}`
                                                                : "/placeholder.png"
                                                }
                                                alt={product.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h2 className="text-sm font-medium text-gray-800 truncate">{product.title}</h2>
                                            <p className="text-sm text-gray-600 mb-1 truncate">{product.category}</p>
                                            <p className="text-base font-semibold text-[#1a1a1a]">
                                                ₹{product.price ? Number(product.price).toLocaleString() : "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {pageInfo.pages > 1 && (
                            <div className="pb-12">
                                <Pagination currentPage={pageInfo.page} totalPages={pageInfo.pages} onPageChange={handlePageChange} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default ProductsPage;
