"use client";

import { useEffect, useMemo, useState } from "react";

export default function SupplierLedgerPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] =
    useState(null);

  const [ledger, setLedger] = useState(null);

  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] =
    useState(false);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [showLedger, setShowLedger] =
    useState(false);

  const [showPayment, setShowPayment] =
    useState(false);

  const [showPayments, setShowPayments] =
    useState(false);

  const [paymentDate, setPaymentDate] =
    useState("");

  const [paymentRows, setPaymentRows] =
    useState([
      {
        id: "initial-payment-row",
        method: "CASH",
        amount: "",
        referenceNo: "",
      },
    ]);

  const [paymentNote, setPaymentNote] =
    useState("");

  const [paymentSaving, setPaymentSaving] =
    useState(false);

  const paymentMethods = [
    "CASH",
    "BANK",
    "BKASH",
    "NAGAD",
    "ROCKET",
    "CHEQUE",
    "OTHER",
  ];

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/suppliers"
      );

      const data = await res.json();

      if (!res.ok) {
        alert(
          data.error ||
            "Failed to load suppliers"
        );
        return;
      }

      const list = Array.isArray(data)
        ? data
        : data.suppliers || [];

      setSuppliers(list);
    } catch (error) {
      console.error(error);
      alert(
        "Failed to load suppliers"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadLedger(
    supplierId,
    customFromDate = fromDate,
    customToDate = toDate
  ) {
    try {
      setLedgerLoading(true);

      let url =
        `/api/supplier-ledger?supplierId=${supplierId}`;

      if (customFromDate) {
        url += `&fromDate=${customFromDate}`;
      }

      if (customToDate) {
        url += `&toDate=${customToDate}`;
      }

      const res =
        await fetch(url);

      const data =
        await res.json();

      if (!res.ok) {
        alert(
          data.error ||
            "Failed to load ledger"
        );
        return;
      }

      setLedger(data);

      /*
        Update selected supplier from
        latest API balance.
      */

      if (
        data.suppliers &&
        data.suppliers.length > 0
      ) {
        setSelectedSupplier(
          data.suppliers[0]
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "Failed to load supplier ledger"
      );
    } finally {
      setLedgerLoading(false);
    }
  }

  function selectSupplier(supplier) {
    setSelectedSupplier(
      supplier
    );

    setShowLedger(false);
    setShowPayments(false);

    loadLedger(
      supplier.id
    );
  }

  function openLedgerModal() {
    if (!selectedSupplier) {
      alert(
        "Please select a supplier first."
      );
      return;
    }

    loadLedger(
      selectedSupplier.id
    );

    setShowLedger(true);
  }

  function openPaymentHistory() {
    if (!selectedSupplier) {
      alert(
        "Please select a supplier first."
      );
      return;
    }

    loadLedger(
      selectedSupplier.id
    );

    setShowPayments(true);
  }

  function openPaymentModal() {
    if (!selectedSupplier) {
      alert(
        "Please select a supplier first."
      );
      return;
    }

    /*
      IMPORTANT:

      Payment is allowed even when Due = 0.

      It can create Advance.
    */

    setPaymentDate(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setPaymentRows([
      {
        id: "initial-payment-row",
        method: "CASH",
        amount: "",
        referenceNo: "",
      },
    ]);

    setPaymentNote("");
    setShowPayment(true);
  }

  function addPaymentRow() {
    setPaymentRows(
      (prev) => [
        ...prev,
        {
          id:
            typeof crypto !==
              "undefined" &&
            crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${prev.length}`,

          method: "CASH",

          amount: "",

          referenceNo: "",
        },
      ]
    );
  }

  function removePaymentRow(
    id
  ) {
    setPaymentRows(
      (prev) => {
        if (
          prev.length === 1
        ) {
          return prev;
        }

        return prev.filter(
          (row) =>
            row.id !== id
        );
      }
    );
  }

  function updatePaymentRow(
    id,
    field,
    value
  ) {
    setPaymentRows(
      (prev) =>
        prev.map(
          (row) =>
            row.id === id
              ? {
                  ...row,
                  [field]:
                    value,
                }
              : row
        )
    );
  }

  const paymentTotal =
    useMemo(() => {
      return paymentRows.reduce(
        (sum, row) =>
          sum +
          Number(
            row.amount || 0
          ),
        0
      );
    }, [paymentRows]);

  /*
    Actual current signed balance.
  */

  const currentNetBalance =
    Number(
      ledger?.summary
        ?.netBalance ??
        selectedSupplier?.netBalance ??
        0
    );

  const currentDue =
    Number(
      ledger?.summary
        ?.dueBalance ??
        selectedSupplier?.dueBalance ??
        selectedSupplier?.currentBalance ??
        0
    );

  const currentAdvance =
    Number(
      ledger?.summary
        ?.advanceBalance ??
        selectedSupplier?.advanceBalance ??
        0
    );

  /*
    Payment result preview.

    If current Due = 3000
    Payment = 5000

    Remaining Due = 0
    New Advance = 2000
  */

  const remainingDue =
    Math.max(
      currentDue -
        paymentTotal,
      0
    );

  const newAdvance =
    Math.max(
      paymentTotal -
        currentDue,
      0
    );

  async function savePayment() {
    if (!selectedSupplier) {
      alert(
        "Please select a supplier."
      );
      return;
    }

    if (
      paymentTotal <= 0
    ) {
      alert(
        "Please enter payment amount."
      );
      return;
    }

    const validRows =
      paymentRows.filter(
        (row) =>
          Number(
            row.amount || 0
          ) > 0
      );

    if (
      validRows.length === 0
    ) {
      alert(
        "Please enter at least one payment method."
      );
      return;
    }

    try {
      setPaymentSaving(true);

      const breakdown =
        validRows.map(
          (row) => ({
            method:
              row.method,

            amount:
              Number(
                row.amount || 0
              ),

            referenceNo:
              row.referenceNo
                ?.trim() || "",
          })
        );

      const uniqueMethods =
        [
          ...new Set(
            breakdown.map(
              (item) =>
                item.method
            )
          ),
        ];

      const paymentMethod =
        uniqueMethods.length >
        1
          ? "MULTI"
          : uniqueMethods[0];

      const res =
        await fetch(
          "/api/supplier-ledger",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              supplierId:
                selectedSupplier.id,

              paymentDate,

              amount:
                paymentTotal,

              paymentMethod,

              paymentBreakdown:
                breakdown,

              referenceNo:
                breakdown
                  .map(
                    (item) =>
                      item.referenceNo
                  )
                  .filter(Boolean)
                  .join(", ") ||
                null,

              note:
                paymentNote ||
                null,
            }),
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        alert(
          data.error ||
            "Payment failed."
        );
        return;
      }

      alert(
        "Supplier payment saved successfully."
      );

      setShowPayment(false);

      await loadLedger(
        selectedSupplier.id
      );

      await loadSuppliers();
    } catch (error) {
      console.error(error);

      alert(
        "Payment failed."
      );
    } finally {
      setPaymentSaving(false);
    }
  }

  function formatMoney(value) {
    return Number(
      value || 0
    ).toLocaleString(
      "en-BD",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-GB"
    );
  }

  function getSupplierBalance(
    supplier
  ) {
    const due =
      Number(
        supplier.dueBalance ??
          supplier.currentBalance ??
          0
      );

    const advance =
      Number(
        supplier.advanceBalance ??
          0
      );

    return {
      due,
      advance,
    };
  }

  const filteredSuppliers =
    suppliers.filter(
      (supplier) => {
        const text =
          search
            .toLowerCase()
            .trim();

        if (!text) {
          return true;
        }

        return (
          String(
            supplier.name || ""
          )
            .toLowerCase()
            .includes(text) ||

          String(
            supplier.phone || ""
          )
            .toLowerCase()
            .includes(text) ||

          String(
            supplier.code || ""
          )
            .toLowerCase()
            .includes(text)
        );
      }
    );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Supplier Ledger
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage supplier balances, ledger transactions and payments.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              onClick={
                openLedgerModal
              }
              disabled={
                !selectedSupplier
              }
              className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              View Ledger
            </button>

            <button
              onClick={
                openPaymentHistory
              }
              disabled={
                !selectedSupplier
              }
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Payment History
            </button>

            <button
              onClick={
                openPaymentModal
              }
              disabled={
                !selectedSupplier
              }
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Make Payment
            </button>

          </div>
        </div>

        {/* SUMMARY */}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Suppliers
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-800">
              {suppliers.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Selected Supplier
            </p>

            <p className="mt-2 truncate text-lg font-bold text-slate-800">
              {selectedSupplier?.name ||
                "None"}
            </p>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50 p-5 shadow-sm">
            <p className="text-sm text-red-600">
              Current Due
            </p>

            <p className="mt-2 text-2xl font-bold text-red-700">
              ৳{" "}
              {formatMoney(
                currentDue
              )}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm text-emerald-600">
              Advance
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-700">
              ৳{" "}
              {formatMoney(
                currentAdvance
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Account Status
            </p>

            <p
              className={`mt-2 text-lg font-bold ${
                currentDue > 0
                  ? "text-red-600"
                  : currentAdvance >
                      0
                    ? "text-emerald-600"
                    : "text-slate-600"
              }`}
            >
              {currentDue > 0
                ? "DUE"
                : currentAdvance >
                    0
                  ? "ADVANCE"
                  : "SETTLED"}
            </p>
          </div>

        </div>

        {/* FILTER */}

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

            <input
              type="text"
              placeholder="Search supplier..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            />

            <input
              type="date"
              value={fromDate}
              onChange={(e) =>
                setFromDate(
                  e.target.value
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) =>
                setToDate(
                  e.target.value
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            />

            <div className="flex gap-2">

              <button
                onClick={() => {
                  if (
                    selectedSupplier
                  ) {
                    loadLedger(
                      selectedSupplier.id
                    );
                  }
                }}
                disabled={
                  !selectedSupplier ||
                  ledgerLoading
                }
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {ledgerLoading
                  ? "Loading..."
                  : "Apply Filter"}
              </button>

              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");

                  if (
                    selectedSupplier
                  ) {
                    loadLedger(
                      selectedSupplier.id,
                      "",
                      ""
                    );
                  }
                }}
                disabled={
                  !selectedSupplier
                }
                className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reset
              </button>

            </div>

          </div>
        </div>

        {/* SUPPLIER TABLE */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-800">
              Supplier List
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading suppliers...
            </div>
          ) : filteredSuppliers.length ===
            0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No supplier found.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px] text-sm">

                <thead className="bg-slate-100">
                  <tr>

                    <th className="px-5 py-3 text-left font-semibold text-slate-600">
                      Supplier
                    </th>

                    <th className="px-5 py-3 text-left font-semibold text-slate-600">
                      Phone
                    </th>

                    <th className="px-5 py-3 text-left font-semibold text-slate-600">
                      Code
                    </th>

                    <th className="px-5 py-3 text-right font-semibold text-slate-600">
                      Due
                    </th>

                    <th className="px-5 py-3 text-right font-semibold text-slate-600">
                      Advance
                    </th>

                    <th className="px-5 py-3 text-center font-semibold text-slate-600">
                      Status
                    </th>

                    <th className="px-5 py-3 text-center font-semibold text-slate-600">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredSuppliers.map(
                    (supplier) => {
                      const isSelected =
                        selectedSupplier?.id ===
                        supplier.id;

                      const balance =
                        getSupplierBalance(
                          supplier
                        );

                      return (
                        <tr
                          key={
                            supplier.id
                          }
                          className={`border-t border-slate-100 ${
                            isSelected
                              ? "bg-blue-50"
                              : ""
                          }`}
                        >

                          <td className="px-5 py-4 font-semibold text-slate-800">
                            {supplier.name ||
                              "-"}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {supplier.phone ||
                              "-"}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {supplier.code ||
                              "-"}
                          </td>

                          <td className="px-5 py-4 text-right font-semibold text-red-600">
                            ৳{" "}
                            {formatMoney(
                              balance.due
                            )}
                          </td>

                          <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                            ৳{" "}
                            {formatMoney(
                              balance.advance
                            )}
                          </td>

                          <td className="px-5 py-4 text-center">

                            {balance.due >
                            0 ? (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                DUE
                              </span>
                            ) : balance.advance >
                              0 ? (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                ADVANCE
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                SETTLED
                              </span>
                            )}

                          </td>

                          <td className="px-5 py-4 text-center">

                            <button
                              onClick={() =>
                                selectSupplier(
                                  supplier
                                )
                              }
                              className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {isSelected
                                ? "Selected"
                                : "Select"}
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* ======================================================
          LEDGER MODAL
      ====================================================== */}

      {showLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Supplier Ledger
                </h2>

                <p className="text-sm text-slate-500">
                  {selectedSupplier?.name ||
                    "-"}
                </p>
              </div>

              <button
                onClick={() =>
                  setShowLedger(false)
                }
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Close
              </button>

            </div>

            <div className="max-h-[calc(90vh-80px)] overflow-auto p-6">

              {ledgerLoading ? (
                <div className="py-10 text-center text-slate-500">
                  Loading ledger...
                </div>
              ) : !ledger ? (
                <div className="py-10 text-center text-slate-500">
                  No ledger data.
                </div>
              ) : (
                <>

                  {/* BALANCE SUMMARY */}

                  <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Total Purchase
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        ৳{" "}
                        {formatMoney(
                          ledger.summary
                            ?.totalPurchase
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-xs text-emerald-600">
                        Total Payment
                      </p>

                      <p className="mt-1 font-bold text-emerald-700">
                        ৳{" "}
                        {formatMoney(
                          ledger.summary
                            ?.totalSupplierPayment
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-red-50 p-4">
                      <p className="text-xs text-red-600">
                        Current Due
                      </p>

                      <p className="mt-1 text-xl font-bold text-red-700">
                        ৳{" "}
                        {formatMoney(
                          ledger.summary
                            ?.dueBalance
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-xs text-emerald-600">
                        Current Advance
                      </p>

                      <p className="mt-1 text-xl font-bold text-emerald-700">
                        ৳{" "}
                        {formatMoney(
                          ledger.summary
                            ?.advanceBalance
                        )}
                      </p>
                    </div>

                  </div>

                  {/* LEDGER TABLE */}

                  <div className="overflow-x-auto rounded-xl border border-slate-200">

                    <table className="w-full min-w-[1050px] text-sm">

                      <thead className="bg-slate-100">
                        <tr>

                          <th className="px-4 py-3 text-left">
                            Date
                          </th>

                          <th className="px-4 py-3 text-left">
                            Type
                          </th>

                          <th className="px-4 py-3 text-left">
                            Reference
                          </th>

                          <th className="px-4 py-3 text-left">
                            Payment Method
                          </th>

                          <th className="px-4 py-3 text-right">
                            Debit
                          </th>

                          <th className="px-4 py-3 text-right">
                            Credit
                          </th>

                          <th className="px-4 py-3 text-right">
                            Balance
                          </th>

                        </tr>
                      </thead>

                      <tbody>

                        {(ledger.ledger ||
                          []).map(
                          (
                            item,
                            index
                          ) => (
                            <tr
                              key={`${item.type}-${item.id}-${index}`}
                              className="border-t border-slate-100"
                            >

                              <td className="px-4 py-3">
                                {formatDate(
                                  item.date
                                )}
                              </td>

                              <td className="px-4 py-3 font-semibold">
                                {item.type ||
                                  "-"}
                              </td>

                              <td className="px-4 py-3">
                                {item.reference ||
                                  "-"}
                              </td>

                              <td className="px-4 py-3">

                                {item.paymentBreakdown &&
                                Array.isArray(
                                  item.paymentBreakdown
                                ) ? (
                                  <div className="space-y-1">

                                    {item.paymentBreakdown.map(
                                      (
                                        payment,
                                        paymentIndex
                                      ) => (
                                        <div
                                          key={
                                            paymentIndex
                                          }
                                          className="text-xs"
                                        >
                                          <span className="font-semibold">
                                            {
                                              payment.method
                                            }
                                          </span>

                                          : ৳{" "}
                                          {formatMoney(
                                            payment.amount
                                          )}

                                          {payment.referenceNo
                                            ? ` (${payment.referenceNo})`
                                            : ""}
                                        </div>
                                      )
                                    )}

                                  </div>
                                ) : (
                                  item.paymentMethod ||
                                  "-"
                                )}

                              </td>

                              <td className="px-4 py-3 text-right font-semibold text-red-600">
                                {Number(
                                  item.debit ||
                                    0
                                ) >
                                0
                                  ? `৳ ${formatMoney(
                                      item.debit
                                    )}`
                                  : "-"}
                              </td>

                              <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                                {Number(
                                  item.credit ||
                                    0
                                ) >
                                0
                                  ? `৳ ${formatMoney(
                                      item.credit
                                    )}`
                                  : "-"}
                              </td>

                              <td
                                className={`px-4 py-3 text-right font-bold ${
                                  Number(
                                    item.balance ||
                                      0
                                  ) <
                                  0
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {Number(
                                  item.balance ||
                                    0
                                ) <
                                0
                                  ? `Advance ৳ ${formatMoney(
                                      Math.abs(
                                        item.balance
                                      )
                                    )}`
                                  : `Due ৳ ${formatMoney(
                                      item.balance
                                    )}`}
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>
                    </table>
                  </div>

                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          PAYMENT HISTORY MODAL
      ====================================================== */}

      {showPayments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Payment History
                </h2>

                <p className="text-sm text-slate-500">
                  {selectedSupplier?.name ||
                    "-"}
                </p>
              </div>

              <button
                onClick={() =>
                  setShowPayments(false)
                }
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Close
              </button>

            </div>

            <div className="max-h-[calc(90vh-80px)] overflow-auto p-6">

              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">

                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs text-blue-600">
                    Payment Transactions
                  </p>

                  <p className="mt-1 text-xl font-bold text-blue-700">
                    {(
                      ledger?.payments ||
                      []
                    ).length}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs text-emerald-600">
                    Total Payment
                  </p>

                  <p className="mt-1 text-xl font-bold text-emerald-700">
                    ৳{" "}
                    {formatMoney(
                      (
                        ledger?.payments ||
                        []
                      ).reduce(
                        (sum, payment) =>
                          sum +
                          Number(
                            payment.amount ||
                              0
                          ),
                        0
                      )
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-xs text-red-600">
                    Current Due
                  </p>

                  <p className="mt-1 text-xl font-bold text-red-700">
                    ৳{" "}
                    {formatMoney(
                      currentDue
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs text-emerald-600">
                    Current Advance
                  </p>

                  <p className="mt-1 text-xl font-bold text-emerald-700">
                    ৳{" "}
                    {formatMoney(
                      currentAdvance
                    )}
                  </p>
                </div>

              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">

                <table className="w-full min-w-[1000px] text-sm">

                  <thead className="bg-slate-100">
                    <tr>

                      <th className="px-4 py-3 text-left">
                        Date
                      </th>

                      <th className="px-4 py-3 text-left">
                        Payment No
                      </th>

                      <th className="px-4 py-3 text-left">
                        Supplier
                      </th>

                      <th className="px-4 py-3 text-left">
                        Method
                      </th>

                      <th className="px-4 py-3 text-right">
                        Amount
                      </th>

                      <th className="px-4 py-3 text-left">
                        Reference
                      </th>

                      <th className="px-4 py-3 text-left">
                        Note
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {!ledger?.payments ||
                    ledger.payments
                      .length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          No payment history found.
                        </td>
                      </tr>
                    ) : (
                      ledger.payments.map(
                        (payment) => (
                          <tr
                            key={
                              payment.id
                            }
                            className="border-t border-slate-100"
                          >

                            <td className="px-4 py-3">
                              {formatDate(
                                payment.paymentDate
                              )}
                            </td>

                            <td className="px-4 py-3 font-semibold text-blue-600">
                              {payment.paymentNo ||
                                "-"}
                            </td>

                            <td className="px-4 py-3">
                              {payment.supplierName ||
                                "-"}
                            </td>

                            <td className="px-4 py-3">

                              {payment.paymentBreakdown &&
                              Array.isArray(
                                payment.paymentBreakdown
                              ) ? (
                                <div className="space-y-1">

                                  {payment.paymentBreakdown.map(
                                    (
                                      item,
                                      index
                                    ) => (
                                      <div
                                        key={
                                          index
                                        }
                                        className="text-xs"
                                      >
                                        <span className="font-semibold">
                                          {
                                            item.method
                                          }
                                        </span>

                                        : ৳{" "}
                                        {formatMoney(
                                          item.amount
                                        )}
                                      </div>
                                    )
                                  )}

                                </div>
                              ) : (
                                payment.paymentMethod ||
                                "-"
                              )}

                            </td>

                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                              ৳{" "}
                              {formatMoney(
                                payment.amount
                              )}
                            </td>

                            <td className="px-4 py-3 text-slate-600">
                              {payment.referenceNo ||
                                "-"}
                            </td>

                            <td className="max-w-[250px] px-4 py-3 text-slate-600">
                              {payment.note ||
                                "-"}
                            </td>

                          </tr>
                        )
                      )
                    )}

                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          PAYMENT MODAL
      ====================================================== */}

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Supplier Payment
                </h2>

                <p className="text-sm text-slate-500">
                  {selectedSupplier?.name ||
                    "-"}
                </p>
              </div>

              <button
                onClick={() =>
                  setShowPayment(false)
                }
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Close
              </button>

            </div>

            <div className="p-6">

              {/* PAYMENT ACCOUNT STATUS */}

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-xs text-red-600">
                    Current Due
                  </p>

                  <p className="mt-1 text-xl font-bold text-red-700">
                    ৳{" "}
                    {formatMoney(
                      currentDue
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs text-emerald-600">
                    Existing Advance
                  </p>

                  <p className="mt-1 text-xl font-bold text-emerald-700">
                    ৳{" "}
                    {formatMoney(
                      currentAdvance
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs text-blue-600">
                    Total Payment
                  </p>

                  <p className="mt-1 text-xl font-bold text-blue-700">
                    ৳{" "}
                    {formatMoney(
                      paymentTotal
                    )}
                  </p>
                </div>

                <div
                  className={`rounded-xl p-4 ${
                    newAdvance > 0
                      ? "bg-emerald-50"
                      : "bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-xs ${
                      newAdvance > 0
                        ? "text-emerald-600"
                        : "text-slate-500"
                    }`}
                  >
                    After Payment
                  </p>

                  <p
                    className={`mt-1 text-lg font-bold ${
                      newAdvance > 0
                        ? "text-emerald-700"
                        : "text-slate-800"
                    }`}
                  >
                    {newAdvance >
                    0
                      ? `Advance ৳ ${formatMoney(
                          newAdvance
                        )}`
                      : `Due ৳ ${formatMoney(
                          remainingDue
                        )}`}
                  </p>
                </div>

              </div>

              {/* DATE */}

              <div className="mb-5">

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment Date
                </label>

                <input
                  type="date"
                  value={
                    paymentDate
                  }
                  onChange={(e) =>
                    setPaymentDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* PAYMENT METHODS */}

              <div className="mb-5">

                <div className="mb-3 flex items-center justify-between">

                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Payment Methods
                    </h3>

                    <p className="text-xs text-slate-500">
                      One transaction can contain multiple payment methods.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addPaymentRow
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    + Add Method
                  </button>

                </div>

                <div className="space-y-3">

                  {paymentRows.map(
                    (row) => (
                      <div
                        key={
                          row.id
                        }
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">
                              Method
                            </label>

                            <select
                              value={
                                row.method
                              }
                              onChange={(
                                e
                              ) =>
                                updatePaymentRow(
                                  row.id,
                                  "method",
                                  e.target
                                    .value
                                )
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                            >
                              {paymentMethods.map(
                                (
                                  method
                                ) => (
                                  <option
                                    key={
                                      method
                                    }
                                    value={
                                      method
                                    }
                                  >
                                    {
                                      method
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">
                              Amount
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                row.amount
                              }
                              onChange={(
                                e
                              ) =>
                                updatePaymentRow(
                                  row.id,
                                  "amount",
                                  e.target
                                    .value
                                )
                              }
                              placeholder="0.00"
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">
                              Reference No
                            </label>

                            <input
                              type="text"
                              value={
                                row.referenceNo
                              }
                              onChange={(
                                e
                              ) =>
                                updatePaymentRow(
                                  row.id,
                                  "referenceNo",
                                  e.target
                                    .value
                                )
                              }
                              placeholder="Transaction / Cheque No"
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                            />
                          </div>

                          <div className="flex items-end">

                            <button
                              type="button"
                              onClick={() =>
                                removePaymentRow(
                                  row.id
                                )
                              }
                              disabled={
                                paymentRows.length ===
                                1
                              }
                              className="w-full rounded-lg bg-red-100 px-3 py-2.5 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Remove
                            </button>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>
              </div>

              {/* NOTE */}

              <div className="mb-6">

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Note
                </label>

                <textarea
                  value={
                    paymentNote
                  }
                  onChange={(e) =>
                    setPaymentNote(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Payment note..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                />

              </div>

              {/* FOOTER */}

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-sm text-slate-500">
                    Total Received
                  </p>

                  <p className="text-2xl font-bold text-slate-800">
                    ৳{" "}
                    {formatMoney(
                      paymentTotal
                    )}
                  </p>

                  {newAdvance >
                    0 && (
                    <p className="mt-1 text-sm font-semibold text-emerald-600">
                      ৳{" "}
                      {formatMoney(
                        newAdvance
                      )}{" "}
                      will remain as Advance
                    </p>
                  )}

                </div>

                <div className="flex gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setShowPayment(
                        false
                      )
                    }
                    className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      savePayment
                    }
                    disabled={
                      paymentSaving ||
                      paymentTotal <=
                        0
                    }
                    className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {paymentSaving
                      ? "Saving..."
                      : "Save Payment"}
                  </button>

                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}