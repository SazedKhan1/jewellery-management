"use client";

import { useEffect, useMemo, useState } from "react";

export default function PurchaseReturnPage() {
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [saving, setSaving] = useState(false);

  const [purchaseId, setPurchaseId] = useState("");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [note, setNote] = useState("");

  const [returnItems, setReturnItems] = useState({});

  const money = (value) => {
    return Number(value || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const number = (value, decimals = 3) => {
    return Number(value || 0).toFixed(decimals);
  };

  const dateFormat = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // LOAD PURCHASES
  // =====================================================

  const fetchPurchases = async () => {
    try {
      setLoadingPurchases(true);

      const res = await fetch("/api/purchases");

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
    } finally {
      setLoadingPurchases(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // =====================================================
  // LOAD SINGLE PURCHASE
  // =====================================================

  const handlePurchaseChange = async (id) => {
    setPurchaseId(id);
    setSelectedPurchase(null);
    setReturnItems({});

    if (!id) {
      return;
    }

    try {
      setLoadingPurchase(true);

      const res = await fetch("/api/purchase-returns", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purchaseId: Number(id),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to load purchase."
        );
      }

      setSelectedPurchase(data);

      const initialItems = {};

      data.items?.forEach((item) => {
        initialItems[item.id] = {
          selected: false,
          quantity: 0,

          grossWeight: Number(
            item.grossWeight || 0
          ),

          stoneWeight: Number(
            item.stoneWeight || 0
          ),

          netWeight: Number(
            item.netWeight || 0
          ),

          rate: Number(item.rate || 0),

          makingCharge: Number(
            item.makingCharge || 0
          ),

          stoneCharge: Number(
            item.stoneCharge || 0
          ),
        };
      });

      setReturnItems(initialItems);
    } catch (error) {
      console.error(
        "PURCHASE RETURN LOAD ERROR:",
        error
      );

      alert(error.message);
      setSelectedPurchase(null);
    } finally {
      setLoadingPurchase(false);
    }
  };

  // =====================================================
  // ITEM SELECT
  // =====================================================

  const toggleItem = (itemId) => {
    setReturnItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId]?.selected,
        quantity: !prev[itemId]?.selected
          ? Math.min(
              1,
              selectedPurchase?.items?.find(
                (item) => item.id === itemId
              )?.availableQuantity || 0
            )
          : 0,
      },
    }));
  };

  // =====================================================
  // UPDATE ITEM
  // =====================================================

  const updateItem = (
    itemId,
    field,
    value
  ) => {
    setReturnItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  // =====================================================
  // CALCULATE ITEM TOTAL
  // =====================================================

  const calculateItemTotal = (itemId) => {
    const data = returnItems[itemId];

    if (!data || !data.selected) {
      return 0;
    }

    const netWeight = Number(
      data.netWeight || 0
    );

    const rate = Number(
      data.rate || 0
    );

    const makingCharge = Number(
      data.makingCharge || 0
    );

    const stoneCharge = Number(
      data.stoneCharge || 0
    );

    return (
      netWeight * rate +
      makingCharge +
      stoneCharge
    );
  };

  // =====================================================
  // SELECTED ITEMS
  // =====================================================

  const selectedItems = useMemo(() => {
    if (!selectedPurchase?.items) {
      return [];
    }

    return selectedPurchase.items.filter(
      (item) =>
        returnItems[item.id]?.selected &&
        Number(
          returnItems[item.id]?.quantity || 0
        ) > 0
    );
  }, [
    selectedPurchase,
    returnItems,
  ]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const summary = useMemo(() => {
    let totalQuantity = 0;
    let totalGross = 0;
    let totalStone = 0;
    let totalNet = 0;
    let totalAmount = 0;

    selectedItems.forEach((item) => {
      const data = returnItems[item.id];

      const quantity = Number(
        data.quantity || 0
      );

      totalQuantity += quantity;

      totalGross +=
        Number(data.grossWeight || 0) *
        quantity;

      totalStone +=
        Number(data.stoneWeight || 0) *
        quantity;

      totalNet +=
        Number(data.netWeight || 0) *
        quantity;

      totalAmount +=
        calculateItemTotal(item.id);
    });

    return {
      totalQuantity,
      totalGross,
      totalStone,
      totalNet,
      totalAmount,
    };
  }, [
    selectedItems,
    returnItems,
  ]);

  // =====================================================
  // SUBMIT RETURN
  // =====================================================

  const handleSubmit = async () => {
    if (!purchaseId) {
      alert("Please select a purchase.");
      return;
    }

    if (selectedItems.length === 0) {
      alert(
        "Please select at least one item to return."
      );
      return;
    }

    for (const item of selectedItems) {
      const data = returnItems[item.id];

      const quantity = Number(
        data.quantity || 0
      );

      const available =
        Number(item.availableQuantity || 0);

      if (quantity <= 0) {
        alert(
          `Please enter return quantity for ${item.product?.name}.`
        );
        return;
      }

      if (quantity > available) {
        alert(
          `${item.product?.name}: Maximum return quantity is ${available}.`
        );
        return;
      }

      if (
        Number(data.grossWeight || 0) <
        Number(data.stoneWeight || 0)
      ) {
        alert(
          `${item.product?.name}: Stone weight cannot be greater than gross weight.`
        );
        return;
      }
    }

    const confirmed = window.confirm(
      `Are you sure you want to create this purchase return?\n\nTotal: ৳ ${money(
        summary.totalAmount
      )}`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        purchaseId: Number(purchaseId),

        returnDate,

        note: note.trim() || null,

        items: selectedItems.map((item) => {
          const data = returnItems[item.id];

          return {
            purchaseItemId: item.id,

            quantity: Number(
              data.quantity || 0
            ),

            grossWeight: Number(
              data.grossWeight || 0
            ),

            stoneWeight: Number(
              data.stoneWeight || 0
            ),

            netWeight: Number(
              data.netWeight || 0
            ),

            rate: Number(
              data.rate || 0
            ),

            makingCharge: Number(
              data.makingCharge || 0
            ),

            stoneCharge: Number(
              data.stoneCharge || 0
            ),
          };
        }),
      };

      const res = await fetch(
        "/api/purchase-returns",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Failed to create purchase return."
        );
      }

      alert(
        `Purchase return created successfully.\n\nReturn No: ${data.returnNo}`
      );

      // Reset
      setPurchaseId("");
      setSelectedPurchase(null);
      setReturnItems({});
      setNote("");

      await fetchPurchases();
    } catch (error) {
      console.error(
        "CREATE PURCHASE RETURN ERROR:",
        error
      );

      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-4 md:p-6">
      <div className="mx-auto max-w-[1600px]">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Purchase Return
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Return purchased jewellery items to suppliers.
            </p>
          </div>

          <a
            href="/purchases/history"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Purchase History
          </a>
        </div>

        {/* PURCHASE SELECTION */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-900">
              Select Purchase
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Select the purchase invoice from which you want to return items.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Purchase Invoice
              </label>

              <select
                value={purchaseId}
                onChange={(e) =>
                  handlePurchaseChange(
                    e.target.value
                  )
                }
                disabled={loadingPurchases}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              >
                <option value="">
                  {loadingPurchases
                    ? "Loading purchases..."
                    : "Select Purchase"}
                </option>

                {purchases.map((purchase) => (
                  <option
                    key={purchase.id}
                    value={purchase.id}
                  >
                    {purchase.purchaseNo} —{" "}
                    {purchase.supplier?.name ||
                      "Supplier"}{" "}
                    — ৳{" "}
                    {money(
                      purchase.totalAmount
                    )}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Return Date
              </label>

              <input
                type="date"
                value={returnDate}
                onChange={(e) =>
                  setReturnDate(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Supplier
              </label>

              <div className="flex min-h-[46px] items-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-800">
                {selectedPurchase?.supplier
                  ?.name || "-"}
              </div>
            </div>

          </div>
        </div>

        {/* LOADING */}
        {loadingPurchase && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Loading purchase details...
            </p>
          </div>
        )}

        {/* PURCHASE INFO */}
        {selectedPurchase &&
          !loadingPurchase && (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <SummaryCard
                  title="Purchase No"
                  value={
                    selectedPurchase.purchaseNo
                  }
                  description="Original purchase"
                  icon="🧾"
                />

                <SummaryCard
                  title="Purchase Date"
                  value={dateFormat(
                    selectedPurchase.purchaseDate
                  )}
                  description={
                    selectedPurchase.supplier
                      ?.name || "Supplier"
                  }
                  icon="📅"
                />

                <SummaryCard
                  title="Purchase Total"
                  value={`৳ ${money(
                    selectedPurchase.totalAmount
                  )}`}
                  description="Original purchase value"
                  icon="💰"
                />

                <SummaryCard
                  title="Return Total"
                  value={`৳ ${money(
                    summary.totalAmount
                  )}`}
                  description={`${summary.totalQuantity} unit(s) selected`}
                  icon="↩️"
                />

              </div>

              {/* ITEMS */}
              <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-100 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-gray-900">
                      Purchase Items
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      Select the products and enter return quantity.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[1450px] text-left">

                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">

                        <th className="w-12 px-4 py-4 text-center">
                          <span className="text-xs font-bold text-gray-500">
                            Return
                          </span>
                        </th>

                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                          Product
                        </th>

                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                          Purchased
                        </th>

                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                          Returned
                        </th>

                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                          Available
                        </th>

                        <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                          Return Qty
                        </th>

                        <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                          Gross
                        </th>

                        <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                          Stone
                        </th>

                        <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                          Net
                        </th>

                        <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                          Rate
                        </th>

                        <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                          Making
                        </th>

                        <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                          Stone Charge
                        </th>

                        <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                          Total
                        </th>

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">

                      {selectedPurchase.items?.map(
                        (item) => {
                          const data =
                            returnItems[
                              item.id
                            ] || {};

                          const disabled =
                            Number(
                              item.availableQuantity ||
                                0
                            ) <= 0;

                          const itemTotal =
                            calculateItemTotal(
                              item.id
                            );

                          return (
                            <tr
                              key={item.id}
                              className={
                                data.selected
                                  ? "bg-gray-50"
                                  : "hover:bg-gray-50"
                              }
                            >

                              {/* CHECKBOX */}
                              <td className="px-4 py-4 text-center">

                                <input
                                  type="checkbox"
                                  checked={
                                    !!data.selected
                                  }
                                  disabled={
                                    disabled
                                  }
                                  onChange={() =>
                                    toggleItem(
                                      item.id
                                    )
                                  }
                                  className="h-4 w-4 cursor-pointer rounded border-gray-300"
                                />

                              </td>

                              {/* PRODUCT */}
                              <td className="px-4 py-4">

                                <div className="font-semibold text-gray-900">
                                  {item.product
                                    ?.name ||
                                    "-"}
                                </div>

                                <div className="mt-1 text-xs text-gray-400">
                                  {item.product
                                    ?.productCode ||
                                    ""}

                                  {item.karat && (
                                    <>
                                      {" "}
                                      •{" "}
                                      {
                                        item.karat
                                      }
                                    </>
                                  )}
                                </div>

                              </td>

                              {/* PURCHASED */}
                              <td className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                                {item.quantity}
                              </td>

                              {/* RETURNED */}
                              <td className="px-4 py-4 text-center">

                                <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                                  {
                                    item.alreadyReturnedQty
                                  }
                                </span>

                              </td>

                              {/* AVAILABLE */}
                              <td className="px-4 py-4 text-center">

                                <span
                                  className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                                    item.availableQuantity >
                                    0
                                      ? "bg-gray-900 text-white"
                                      : "bg-gray-100 text-gray-400"
                                  }`}
                                >
                                  {
                                    item.availableQuantity
                                  }
                                </span>

                              </td>

                              {/* QUANTITY */}
                              <td className="px-4 py-4">

                                <input
                                  type="number"
                                  min="0"
                                  max={
                                    item.availableQuantity
                                  }
                                  value={
                                    data.quantity ??
                                    0
                                  }
                                  disabled={
                                    !data.selected ||
                                    disabled
                                  }
                                  onChange={(e) =>
                                    updateItem(
                                      item.id,
                                      "quantity",
                                      e.target.value
                                    )
                                  }
                                  className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-right text-sm outline-none focus:border-gray-400 disabled:bg-gray-100"
                                />

                              </td>

                              {/* GROSS */}
                              <td className="px-4 py-4">

                                <input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={
                                    data.grossWeight ??
                                    0
                                  }
                                  disabled={
                                    !data.selected
                                  }
                                  onChange={(e) =>
                                    updateItem(
                                      item.id,
                                      "grossWeight",
                                      e.target.value
                                    )
                                  }
                                  className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2 text-right text-sm outline-none focus:border-gray-400 disabled:bg-gray-100"
                                />

                              </td>

                              {/* STONE */}
                              <td className="px-4 py-4">

                                <input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={
                                    data.stoneWeight ??
                                    0
                                  }
                                  disabled={
                                    !data.selected
                                  }
                                  onChange={(e) =>
                                    updateItem(
                                      item.id,
                                      "stoneWeight",
                                      e.target.value
                                    )
                                  }
                                  className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2 text-right text-sm outline-none focus:border-gray-400 disabled:bg-gray-100"
                                />

                              </td>

                              {/* NET */}
                              <td className="px-4 py-4">

                                <input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={
                                    data.netWeight ??
                                    0
                                  }
                                  disabled={
                                    !data.selected
                                  }
                                  onChange={(e) =>
                                    updateItem(
                                      item.id,
                                      "netWeight",
                                      e.target.value
                                    )
                                  }
                                  className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2 text-right text-sm font-semibold outline-none focus:border-gray-400 disabled:bg-gray-100"
                                />

                              </td>

                              {/* RATE */}
                              <td className="px-4 py-4">

                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={
                                    data.rate ?? 0
                                  }
                                  disabled={
                                    !data.selected
                                  }
                                  onChange={(e) =>
                                    updateItem(
                                      item.id,
                                      "rate",
                                      e.target.value
                                    )
                                  }
                                  className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2 text-right text-sm outline-none focus:border-gray-400 disabled:bg-gray-100"
                                />

                              </td>

                              {/* MAKING */}
                              <td className="px-4 py-4">

                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={
                                    data.makingCharge ??
                                    0
                                  }
                                  disabled={
                                    !data.selected
                                  }
                                  onChange={(e) =>
                                    updateItem(
                                      item.id,
                                      "makingCharge",
                                      e.target.value
                                    )
                                  }
                                  className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2 text-right text-sm outline-none focus:border-gray-400 disabled:bg-gray-100"
                                />

                              </td>

                              {/* STONE CHARGE */}
                              <td className="px-4 py-4">

                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={
                                    data.stoneCharge ??
                                    0
                                  }
                                  disabled={
                                    !data.selected
                                  }
                                  onChange={(e) =>
                                    updateItem(
                                      item.id,
                                      "stoneCharge",
                                      e.target.value
                                    )
                                  }
                                  className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2 text-right text-sm outline-none focus:border-gray-400 disabled:bg-gray-100"
                                />

                              </td>

                              {/* TOTAL */}
                              <td className="px-4 py-4 text-right">

                                <span className="font-bold text-gray-900">
                                  ৳{" "}
                                  {money(
                                    itemTotal
                                  )}
                                </span>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>
                  </table>
                </div>
              </div>

              {/* NOTE + SUMMARY */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* NOTE */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                  <h3 className="mb-4 font-bold text-gray-900">
                    Return Note
                  </h3>

                  <textarea
                    value={note}
                    onChange={(e) =>
                      setNote(e.target.value)
                    }
                    rows={6}
                    placeholder="Write return reason or additional note..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
                  />

                </div>

                {/* SUMMARY */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                  <h3 className="mb-4 font-bold text-gray-900">
                    Return Summary
                  </h3>

                  <div className="space-y-3">

                    <SummaryRow
                      label="Return Quantity"
                      value={`${summary.totalQuantity} pcs`}
                    />

                    <SummaryRow
                      label="Gross Weight"
                      value={`${number(
                        summary.totalGross
                      )} g`}
                    />

                    <SummaryRow
                      label="Stone Weight"
                      value={`${number(
                        summary.totalStone
                      )} g`}
                    />

                    <SummaryRow
                      label="Net Weight"
                      value={`${number(
                        summary.totalNet
                      )} g`}
                    />

                    <div className="my-3 border-t border-gray-200" />

                    <div className="flex items-center justify-between">

                      <span className="font-bold text-gray-900">
                        Return Total
                      </span>

                      <span className="text-xl font-bold text-gray-900">
                        ৳{" "}
                        {money(
                          summary.totalAmount
                        )}
                      </span>

                    </div>

                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={
                      saving ||
                      selectedItems.length === 0
                    }
                    className="mt-6 w-full rounded-xl bg-gray-900 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {saving
                      ? "Processing Return..."
                      : "Create Purchase Return"}
                  </button>

                </div>

              </div>
            </>
          )}

        {/* EMPTY STATE */}
        {!selectedPurchase &&
          !loadingPurchase && (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">

              <div className="mb-4 text-6xl">
                ↩️
              </div>

              <h2 className="text-lg font-bold text-gray-900">
                Select a Purchase
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Select a purchase invoice above to view
                its items and create a purchase return.
              </p>

            </div>
          )}

      </div>
    </div>
  );
}


// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  title,
  value,
  description,
  icon,
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


// =====================================================
// SUMMARY ROW
// =====================================================

function SummaryRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between text-sm">

      <span className="text-gray-500">
        {label}
      </span>

      <span className="font-semibold text-gray-800">
        {value}
      </span>

    </div>
  );
}