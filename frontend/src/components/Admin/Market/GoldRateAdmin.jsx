import React, { useEffect, useMemo, useState } from "react";
import { adminAPI } from "../../../utils/api";

const numberOrEmpty = (v) => {
    if (v === "" || v == null) return "";
    const n = Number(v);
    return Number.isFinite(n) ? n : "";
};

const GoldRateAdmin = () => {
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);

    const [current, setCurrent] = useState(null);
    const [form, setForm] = useState({
        p24: "",
        p22: "",
        p18: "",
        reprice: true,
    });
    const [message, setMessage] = useState(null);

    const computedP22 = useMemo(() => {
        const p24 = Number(form.p24);
        if (Number.isFinite(p24)) return Math.round((p24 * 22) / 24);
        return "";
    }, [form.p24]);

    const computedP18 = useMemo(() => {
        const p24 = Number(form.p24);
        if (Number.isFinite(p24)) return Math.round((p24 * 18) / 24);
        return "";
    }, [form.p24]);

    const computedP24 = useMemo(() => {
        const p22 = Number(form.p22);
        if (Number.isFinite(p22)) return Math.round((p22 * 24) / 22);
        const p18 = Number(form.p18);
        if (Number.isFinite(p18)) return Math.round((p18 * 24) / 18);
        const cur24 = Number(current?.pricePerGram24kInr);
        if (Number.isFinite(cur24)) return cur24;
        return "";
    }, [form.p22, form.p18, current]);

    const loadCurrent = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const { data } = await adminAPI.getMarketPrice();
            setCurrent(data);
            setForm((prev) => ({
                ...prev,
                p24: numberOrEmpty(data?.pricePerGram24kInr),
                p22: numberOrEmpty(data?.pricePerGram22kInr),
                p18: numberOrEmpty(data?.pricePerGram18kInr),
            }));
        } catch (e) {
            setMessage({ type: "error", text: `Failed to load current rate: ${e?.response?.data?.error || e.message}` });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCurrent();
    }, []);

    const handleSetManual = async (opts = { reprice: true }) => {
        setBusy(true);
        setMessage(null);
        try {
            const p24 = Number(form.p24);
            const p22 = form.p22 === "" ? null : Number(form.p22);
            const p18 = form.p18 === "" ? null : Number(form.p18);
            if (!Number.isFinite(p24) || p24 <= 0) {
                setMessage({ type: "error", text: "Enter a valid 24K INR/gram value" });
                setBusy(false);
                return;
            }
            const payload = {
                pricePerGram24kInr: p24,
                ...(Number.isFinite(p22) ? { pricePerGram22kInr: p22 } : {}),
                ...(Number.isFinite(p18) ? { pricePerGram18kInr: p18 } : {}),
                reprice: !!opts.reprice,
            };
            const { data } = await adminAPI.setManualGoldPrice(payload);
            setMessage({ type: "success", text: `Manual rate saved${opts.reprice ? " and products repriced" : ""}.` });
            // Reload current to reflect Manual-Override + lastUpdated
            await loadCurrent();
        } catch (e) {
            const detail = e?.response?.data?.details || e?.response?.data?.error || e.message;
            setMessage({ type: "error", text: `Failed to set manual rate: ${detail}` });
        } finally {
            setBusy(false);
        }
    };

    const handleRefreshProvider = async () => {
        setBusy(true);
        setMessage(null);
        try {
            await adminAPI.refreshGoldPrice();
            setMessage({ type: "success", text: "Requested live refresh from provider." });
            await loadCurrent();
        } catch (e) {
            const detail = e?.response?.data?.details || e?.response?.data?.error || e.message;
            setMessage({ type: "error", text: `Refresh failed: ${detail}` });
        } finally {
            setBusy(false);
        }
    };

    const handleRepriceNow = async () => {
        setBusy(true);
        setMessage(null);
        try {
            const { data } = await adminAPI.repriceToday({ dryRun: false, allowFetch: false });
            setMessage({ type: "success", text: `Repriced products. Updated: ${data?.updated ?? 0}, Inspected: ${data?.inspected ?? 0}` });
        } catch (e) {
            const detail = e?.response?.data?.details || e?.response?.data?.error || e.message;
            setMessage({ type: "error", text: `Reprice failed: ${detail}` });
        } finally {
            setBusy(false);
        }
    };

    const labelClass = "block text-sm font-semibold text-[#400F45] mb-1";
    const inputClass = "w-full px-4 py-2 rounded-xl bg-[#f8f8f8] border border-[#d1bfd9] text-sm focus:outline-none focus:ring-2 focus:ring-[#400F45]";

    return (
        <div className="bg-white border border-[#d1bfd9] rounded-2xl p-6 shadow-lg">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-[#400F45]">Market Gold Rate (Admin)</h2>
                <p className="text-sm text-gray-600">Set manual INR/gram rates for 24K and 22K. Optionally reprice all products immediately.</p>
            </div>

            {/* Current cached */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-[#f8f8f8] border border-[#d1bfd9]">
                    <div className="text-xs text-gray-500">Current 24K INR/g</div>
                    <div className="text-lg font-semibold">{current?.pricePerGram24kInr ?? "-"}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#f8f8f8] border border-[#d1bfd9]">
                    <div className="text-xs text-gray-500">Current 22K INR/g</div>
                    <div className="text-lg font-semibold">{current?.pricePerGram22kInr ?? "-"}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#f8f8f8] border border-[#d1bfd9]">
                    <div className="text-xs text-gray-500">Current 18K INR/g</div>
                    <div className="text-lg font-semibold">{current?.pricePerGram18kInr ?? "-"}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#f8f8f8] border border-[#d1bfd9]">
                    <div className="text-xs text-gray-500">Source / Updated</div>
                    <div className="text-sm">
                        <span className="font-semibold">{current?.source ?? "-"}</span>
                        <span className="text-gray-500"> {current?.lastUpdated ? `• ${new Date(current.lastUpdated).toLocaleString()}` : ""}</span>
                    </div>
                </div>
            </div>

            {/* Manual form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div>
                    <label className={labelClass}>24K INR/gram</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={inputClass + " flex-1"}
                            value={form.p24}
                            onChange={(e) => setForm((s) => ({ ...s, p24: e.target.value }))}
                            disabled={loading || busy}
                            placeholder={`${computedP24 || "auto: 22k × 24/22 or current"}`}
                        />
                        <button
                            type="button"
                            className="px-3 py-2 rounded-xl bg-[#e2d2e9] text-[#400F45] border border-[#d1bfd9] text-xs"
                            onClick={() => setForm((s) => ({ ...s, p24: computedP24 }))}
                            disabled={loading || busy || !computedP24}
                            title="Set 24K from 22K/18K or current cached"
                        >
                            Auto
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto: from 22K/18K if provided, else current cached 24K.</p>
                </div>
                <div>
                    <label className={labelClass}>22K INR/gram</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={inputClass + " flex-1"}
                            value={form.p22}
                            onChange={(e) => setForm((s) => ({ ...s, p22: e.target.value }))}
                            disabled={loading || busy}
                            placeholder={`${computedP22 || "auto: 24k × 22/24"}`}
                        />
                        <button
                            type="button"
                            className="px-3 py-2 rounded-xl bg-[#e2d2e9] text-[#400F45] border border-[#d1bfd9] text-xs"
                            onClick={() => setForm((s) => ({ ...s, p22: computedP22 }))}
                            disabled={loading || busy || !computedP22}
                            title="Set 22K = 24K × 22/24"
                        >
                            Auto
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Leave blank to auto-calc from 24K.</p>
                </div>
                <div>
                    <label className={labelClass}>18K INR/gram</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={inputClass + " flex-1"}
                            value={form.p18}
                            onChange={(e) => setForm((s) => ({ ...s, p18: e.target.value }))}
                            disabled={loading || busy}
                            placeholder={`${computedP18 || "auto: 24k × 18/24"}`}
                        />
                        <button
                            type="button"
                            className="px-3 py-2 rounded-xl bg-[#e2d2e9] text-[#400F45] border border-[#d1bfd9] text-xs"
                            onClick={() => setForm((s) => ({ ...s, p18: computedP18 }))}
                            disabled={loading || busy || !computedP18}
                            title="Set 18K = 24K × 18/24"
                        >
                            Auto
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Leave blank to auto-calc from 24K.</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        id="reprice-now"
                        type="checkbox"
                        checked={!!form.reprice}
                        onChange={(e) => setForm((s) => ({ ...s, reprice: e.target.checked }))}
                        disabled={loading || busy}
                    />
                    <label htmlFor="reprice-now" className="text-sm text-[#400F45]">Reprice products immediately</label>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-6">
                <button
                    type="button"
                    onClick={() => handleSetManual({ reprice: !!form.reprice })}
                    disabled={loading || busy}
                    className="bg-[#400F45] text-white px-5 py-2 rounded-full hover:bg-[#330d37] transition text-sm"
                >
                    Save Manual Rate{form.reprice ? " + Reprice" : ""}
                </button>

                <button
                    type="button"
                    onClick={() => handleSetManual({ reprice: false })}
                    disabled={loading || busy}
                    className="bg-[#e2d2e9] text-[#400F45] px-5 py-2 rounded-full hover:bg-[#d2b7de] transition text-sm"
                >
                    Save Manual Rate Only
                </button>

                <button
                    type="button"
                    onClick={handleRefreshProvider}
                    disabled={loading || busy}
                    className="bg-gray-100 text-gray-700 px-5 py-2 rounded-full hover:bg-gray-200 transition text-sm"
                    title="Try fetching live provider rate and replace cache"
                >
                    Refresh From Provider
                </button>

                <button
                    type="button"
                    onClick={handleRepriceNow}
                    disabled={loading || busy}
                    className="bg-gray-100 text-gray-700 px-5 py-2 rounded-full hover:bg-gray-200 transition text-sm"
                    title="Reprice all products using current cached/manual rate"
                >
                    Reprice Using Current Cache
                </button>

                <button
                    type="button"
                    onClick={loadCurrent}
                    disabled={loading || busy}
                    className="bg-white text-[#400F45] px-5 py-2 rounded-full border border-[#d1bfd9] hover:bg-[#faf6fb] transition text-sm"
                >
                    Reload Current
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`mt-4 text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                    {message.text}
                </div>
            )}
        </div>
    );
};

export default GoldRateAdmin;
