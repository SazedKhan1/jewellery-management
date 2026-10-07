"use client";

import { useEffect, useMemo, useState } from "react";

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // =========================
  // FETCH SUPPLIERS
  // =========================
  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();

      if (Array.isArray(data)) {
        setSuppliers(data);
      } else if (Array.isArray(data.data)) {
        setSuppliers(data.data);
      }
    } catch (error) {
      console.error("SUPPLIER FETCH ERROR:", error);
    }
  };

  // =========================
  // FETCH PURCHASES
  // =========================
  const fetchPurchases = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (supplierId) {
        params.append("supplierId", supplierId);
      }

      if (fromDate) {
        params.append("from", fromDate);
      }

      if (toDate) {
        params.append("to", toDate);
      }

      const url = `/api/purchases${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to fetch purchases."
        );
      }

      setPurchases(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("PURCHASE FETCH ERROR:", error);
      alert(error.message);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchPurchases();
  }, []);

  // =========================
  // SEARCH
  // =========================
  const handleSearch = () => {
    fetchPurchases();
  };

  // =========================
  // RESET
  // =========================
  const handleReset = () => {
    setSearch("");
    setSupplierId("");
    setFromDate("");
    setToDate("");

    setTimeout(() => {
      fetchPurchases();
    }, 0);
  };

  // =========================
  // VIEW DETAILS
  // =========================
  const handleViewDetails = async (id) => {
    try {
      setDetailsLoading(true);
      setShowDetails(true);
      setSelectedPurchase(null);

      const res = await fetch("/api/purchases", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to fetch purchase details."
        );
      }

      setSelectedPurchase(data);
    } catch (error) {
      console.error("PURCHASE DETAILS ERROR:", error);
      alert(error.message);
      setShowDetails(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // =========================
  // SUMMARY
  // =========================
  const summary = useMemo(() => {
    let totalPurchase = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalItems = 0;

    purchases.forEach((purchase) => {
      totalPurchase += Number(purchase.totalAmount || 0);
      totalPaid += Number(purchase.paidAmount || 0);
      totalDue += Number(purchase.dueAmount || 0);

      if (Array.isArray(purchase.items)) {
        totalItems += purchase.items.length;
      }
    });

    return {
      totalPurchase,
      totalPaid,
      totalDue,
      totalItems,
    };
  }, [purchases]);

  // =========================
  // MONEY FORMAT
  // =========================
  const money = (value) => {
    return Number(value || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // =========================
  // DATE FORMAT
  // =========================
  const dateFormat = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-4 md:p-6">
      <div className="mx-auto max-w-[1600px]">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Purchase History
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View, search and manage all purchase records.
            </p>
          </div>

          <a
            href="/purchases"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <span className="text-lg">+</span>
            New Purchase
          </a>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            title="Total Purchases"
            value={`৳ ${money(summary.totalPurchase)}`}
            icon="🛒"
            description={`${purchases.length} purchase records`}
          />

          <SummaryCard
            title="Total Paid"
            value={`৳ ${money(summary.totalPaid)}`}
            icon="💰"
            description="Amount already paid"
          />

          <SummaryCard
            title="Total Due"
            value={`৳ ${money(summary.totalDue)}`}
            icon="⚠️"
            description="Outstanding supplier due"
          />

          <SummaryCard
            title="Purchase Items"
            value={summary.totalItems}
            icon="📦"
            description="Total line items"
          />

        </div>

        {/* FILTER */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900">
              Search & Filter
            </h2>

            <p className="text-xs text-gray-500">
              Find purchases by purchase number, supplier or date.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">

            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Purchase No or Supplier..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Supplier
              </label>

              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:border-gray-400 focus:bg-white"
              >
                <option value="">All Suppliers</option>

                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:border-gray-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:border-gray-400 focus:bg-white"
              />
            </div>

          </div>

          <div className="mt-4 flex flex-wrap gap-2">

            <button
              onClick={handleSearch}
              className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Search
            </button>

            <button
              onClick={handleReset}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Reset
            </button>

          </div>
        </div>

        {/* PURCHASE TABLE */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-gray-900">
                Purchase Records
              </h2>

              <p className="text-xs text-gray-500">
                {purchases.length} records found
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-sm font-medium text-gray-500">
                Loading purchase records...
              </div>
            </div>
          ) : purchases.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

              <div className="mb-3 text-5xl">
                🛒
              </div>

              <h3 className="font-bold text-gray-900">
                No purchase records found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filter.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1150px] text-left">

                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                      Purchase
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                      Date
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                      Supplier
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                      Items
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                      Total
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                      Paid
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                      Due
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {purchases.map((purchase) => {

                    const due = Number(
                      purchase.dueAmount || 0
                    );

                    return (
                      <tr
                        key={purchase.id}
                        className="transition hover:bg-gray-50"
                      >

                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-900">
                            {purchase.purchaseNo}
                          </div>

                          <div className="mt-1 text-xs text-gray-400">
                            #{purchase.id}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {dateFormat(purchase.purchaseDate)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-800">
                            {purchase.supplier?.name || "-"}
                          </div>

                          <div className="mt-1 text-xs text-gray-400">
                            {purchase.supplier?.supplierCode || ""}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                            {purchase.items?.length || 0}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="font-bold text-gray-900">
                            ৳ {money(purchase.totalAmount)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="font-semibold text-gray-700">
                            ৳ {money(purchase.paidAmount)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span
                            className={
                              due > 0
                                ? "font-bold text-red-600"
                                : "font-semibold text-gray-400"
                            }
                          >
                            ৳ {money(due)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              purchase.status === "COMPLETED"
                                ? "bg-gray-900 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {purchase.status || "COMPLETED"}
                          </span>
                        </td>

                        <td className="px-5 py-4">

                          <div className="flex items-center justify-center gap-2">

                            <button
                              onClick={() =>
                                handleViewDetails(purchase.id)
                              }
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-900 hover:text-white"
                            >
                              View
                            </button>

                            <a
                              href={`/purchases/invoice/${purchase.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-900 hover:text-white"
                            >
                              Print
                            </a>

                          </div>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>
      </div>

      {/* DETAILS MODAL */}
      {showDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowDetails(false)}
        >

          <div
            className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Purchase Details
                </h2>

                {selectedPurchase && (
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedPurchase.purchaseNo}
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-500 transition hover:bg-gray-200"
              >
                ×
              </button>

            </div>

            {detailsLoading ? (
              <div className="flex min-h-[350px] items-center justify-center">
                <p className="text-sm font-medium text-gray-500">
                  Loading purchase details...
                </p>
              </div>
            ) : selectedPurchase ? (
              <div className="max-h-[calc(92vh-90px)] overflow-y-auto p-6">

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

                  <InfoBox
                    label="Purchase No"
                    value={selectedPurchase.purchaseNo}
                  />

                  <InfoBox
                    label="Purchase Date"
                    value={dateFormat(
                      selectedPurchase.purchaseDate
                    )}
                  />

                  <InfoBox
                    label="Supplier"
                    value={
                      selectedPurchase.supplier?.name || "-"
                    }
                  />

                  <InfoBox
                    label="Status"
                    value={
                      selectedPurchase.status || "COMPLETED"
                    }
                  />

                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200">

                  <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                    <h3 className="font-bold text-gray-900">
                      Purchase Items
                    </h3>
                  </div>

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[950px] text-left">

                      <thead>
                        <tr className="border-b border-gray-100">

                          <th className="px-4 py-3 text-xs font-bold text-gray-500">
                            Product
                          </th>

                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">
                            Karat
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">
                            Qty
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">
                            Gross
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">
                            Stone
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">
                            Net
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">
                            Rate
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">
                            Making
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">
                            Stone Charge
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">
                            Total
                          </th>

                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">

                        {selectedPurchase.items?.map((item) => (
                          <tr key={item.id}>

                            <td className="px-4 py-4">

                              <div className="font-semibold text-gray-800">
                                {item.product?.name || "-"}
                              </div>

                              <div className="mt-1 text-xs text-gray-400">
                                {item.product?.productCode || ""}
                              </div>

                            </td>

                            <td className="px-4 py-4 text-center text-sm">
                              {item.karat || "-"}
                            </td>

                            <td className="px-4 py-4 text-right text-sm">
                              {item.quantity}
                            </td>

                            <td className="px-4 py-4 text-right text-sm">
                              {Number(
                                item.grossWeight || 0
                              ).toFixed(3)}
                            </td>

                            <td className="px-4 py-4 text-right text-sm">
                              {Number(
                                item.stoneWeight || 0
                              ).toFixed(3)}
                            </td>

                            <td className="px-4 py-4 text-right font-semibold text-sm">
                              {Number(
                                item.netWeight || 0
                              ).toFixed(3)}
                            </td>

                            <td className="px-4 py-4 text-right text-sm">
                              ৳ {money(item.rate)}
                            </td>

                            <td className="px-4 py-4 text-right text-sm">
                              ৳ {money(item.makingCharge)}
                            </td>

                            <td className="px-4 py-4 text-right text-sm">
                              ৳ {money(item.stoneCharge)}
                            </td>

                            <td className="px-4 py-4 text-right font-bold text-sm">
                              ৳ {money(item.totalAmount)}
                            </td>

                          </tr>
                        ))}

                      </tbody>

                    </table>

                  </div>
                </div>

                <div className="mt-6 flex justify-end">

                  <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 p-5">

                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-gray-500">
                        Subtotal
                      </span>

                      <span className="font-semibold text-gray-800">
                        ৳ {money(selectedPurchase.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-gray-500">
                        Discount
                      </span>

                      <span className="font-semibold text-gray-800">
                        - ৳ {money(selectedPurchase.discount)}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-gray-500">
                        VAT
                      </span>

                      <span className="font-semibold text-gray-800">
                        ৳ {money(selectedPurchase.vat)}
                      </span>
                    </div>

                    <div className="my-2 border-t border-gray-200" />

                    <div className="flex justify-between py-2">
                      <span className="font-bold text-gray-900">
                        Total
                      </span>

                      <span className="font-bold text-gray-900">
                        ৳ {money(selectedPurchase.totalAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-gray-500">
                        Paid
                      </span>

                      <span className="font-semibold text-gray-700">
                        ৳ {money(selectedPurchase.paidAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 text-sm">
                      <span className="font-semibold text-gray-600">
                        Due
                      </span>

                      <span className="font-bold text-red-600">
                        ৳ {money(selectedPurchase.dueAmount)}
                      </span>
                    </div>

                  </div>

                </div>

                {selectedPurchase.note && (
                  <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">

                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                      Note
                    </p>

                    <p className="text-sm text-gray-700">
                      {selectedPurchase.note}
                    </p>

                  </div>
                )}

                <div className="mt-6 flex justify-end">

                  <a
                    href={`/purchases/invoice/${selectedPurchase.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
                  >
                    🖨 Print Invoice
                  </a>

                </div>

              </div>
            ) : null}

          </div>

        </div>
      )}

    </div>
  );
}

// =========================
// SUMMARY CARD
// =========================
function SummaryCard({
  title,
  value,
  icon,
  description,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {title}
          </p>

          <h3 className="mt-2 text-xl font-bold text-gray-900">
            {value}
          </h3>

          <p className="mt-1 text-xs text-gray-400">
            {description}
          </p>

        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-xl">
          {icon}
        </div>

      </div>

    </div>
  );
}

// =========================
// INFO BOX
// =========================
function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">

      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-2 truncate font-bold text-gray-900">
        {value}
      </p>

    </div>
  );
}