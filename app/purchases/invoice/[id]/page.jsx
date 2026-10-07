"use client";

import { useEffect, useState } from "react";

export default function PurchaseInvoicePage({ params }) {
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPurchase = async () => {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;

        const res = await fetch("/api/purchases", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: Number(id),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message || "Failed to load purchase."
          );
        }

        setPurchase(data);
      } catch (error) {
        console.error("INVOICE ERROR:", error);
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadPurchase();
  }, [params]);

  const money = (value) => {
    return Number(value || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const weight = (value) => {
    return Number(value || 0).toFixed(3);
  };

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm font-medium text-gray-500">
          Loading invoice...
        </p>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Purchase Not Found
          </h2>

          <a
            href="/purchases/history"
            className="mt-4 inline-block rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Purchase History
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* =========================
          SCREEN TOOLBAR
      ========================= */}
      <div className="print:hidden sticky top-0 z-50 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between">

          <a
            href="/purchases/history"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Back
          </a>

          <button
            onClick={() => window.print()}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            🖨 Print Invoice
          </button>

        </div>
      </div>

      {/* =========================
          INVOICE AREA
      ========================= */}
      <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">

        <div
          id="purchase-invoice"
          className="mx-auto w-full max-w-[210mm] bg-white px-[14mm] py-[12mm] shadow-xl print:max-w-none print:shadow-none"
        >

          {/* =========================
              HEADER
          ========================= */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-6">

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                YOUR JEWELLERY SHOP
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Jewellery Management System
              </p>

              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <p>Address: Your Shop Address, Bangladesh</p>
                <p>Phone: +880 1XXXXXXXXX</p>
                <p>Email: info@yourshop.com</p>
              </div>
            </div>

            <div className="text-right">

              <div className="inline-block rounded-lg bg-gray-900 px-4 py-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-white">
                  Purchase Invoice
                </p>
              </div>

              <div className="mt-4 space-y-1 text-sm">
                <p>
                  <span className="font-semibold text-gray-500">
                    Invoice:
                  </span>{" "}
                  <span className="font-bold text-gray-900">
                    {purchase.purchaseNo}
                  </span>
                </p>

                <p>
                  <span className="font-semibold text-gray-500">
                    Date:
                  </span>{" "}
                  {formatDate(purchase.purchaseDate)}
                </p>
              </div>

            </div>

          </div>

          {/* =========================
              SUPPLIER INFO
          ========================= */}
          <div className="my-7 grid grid-cols-2 gap-6">

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Supplier
              </p>

              <h2 className="text-lg font-bold text-gray-900">
                {purchase.supplier?.name || "-"}
              </h2>

              <div className="mt-2 space-y-1 text-xs text-gray-600">
                <p>
                  Code:{" "}
                  <span className="font-semibold">
                    {purchase.supplier?.supplierCode || "-"}
                  </span>
                </p>

                <p>
                  Phone: {purchase.supplier?.phone || "-"}
                </p>

                <p>
                  Email: {purchase.supplier?.email || "-"}
                </p>

                <p>
                  Address: {purchase.supplier?.address || "-"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Purchase Information
              </p>

              <div className="space-y-2 text-sm">

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Purchase No
                  </span>

                  <span className="font-bold text-gray-900">
                    {purchase.purchaseNo}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Purchase Date
                  </span>

                  <span className="font-semibold text-gray-800">
                    {formatDate(purchase.purchaseDate)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Status
                  </span>

                  <span className="font-bold text-gray-800">
                    {purchase.status || "COMPLETED"}
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* =========================
              ITEMS TABLE
          ========================= */}
          <div className="overflow-hidden rounded-lg border border-gray-200">

            <table className="w-full border-collapse text-[10px]">

              <thead>
                <tr className="bg-gray-900 text-white">

                  <th className="border-r border-gray-700 px-2 py-3 text-left">
                    #
                  </th>

                  <th className="border-r border-gray-700 px-2 py-3 text-left">
                    Product
                  </th>

                  <th className="border-r border-gray-700 px-2 py-3 text-center">
                    Qty
                  </th>

                  <th className="border-r border-gray-700 px-2 py-3 text-right">
                    Gross
                  </th>

                  <th className="border-r border-gray-700 px-2 py-3 text-right">
                    Stone
                  </th>

                  <th className="border-r border-gray-700 px-2 py-3 text-right">
                    Net
                  </th>

                  <th className="border-r border-gray-700 px-2 py-3 text-center">
                    Karat
                  </th>

                  <th className="border-r border-gray-700 px-2 py-3 text-right">
                    Rate
                  </th>

                  <th className="border-r border-gray-700 px-2 py-3 text-right">
                    Making
                  </th>

                  <th className="border-r border-gray-700 px-2 py-3 text-right">
                    Stone Charge
                  </th>

                  <th className="px-2 py-3 text-right">
                    Total
                  </th>

                </tr>
              </thead>

              <tbody>

                {purchase.items?.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200"
                  >

                    <td className="px-2 py-3 text-center text-gray-500">
                      {index + 1}
                    </td>

                    <td className="px-2 py-3">
                      <p className="font-bold text-gray-900">
                        {item.product?.name || "-"}
                      </p>

                      <p className="mt-0.5 text-[9px] text-gray-400">
                        {item.product?.productCode || ""}
                      </p>
                    </td>

                    <td className="px-2 py-3 text-center font-semibold">
                      {item.quantity}
                    </td>

                    <td className="px-2 py-3 text-right">
                      {weight(item.grossWeight)}
                    </td>

                    <td className="px-2 py-3 text-right">
                      {weight(item.stoneWeight)}
                    </td>

                    <td className="px-2 py-3 text-right font-semibold">
                      {weight(item.netWeight)}
                    </td>

                    <td className="px-2 py-3 text-center">
                      {item.karat || "-"}
                    </td>

                    <td className="px-2 py-3 text-right">
                      ৳ {money(item.rate)}
                    </td>

                    <td className="px-2 py-3 text-right">
                      ৳ {money(item.makingCharge)}
                    </td>

                    <td className="px-2 py-3 text-right">
                      ৳ {money(item.stoneCharge)}
                    </td>

                    <td className="px-2 py-3 text-right font-bold">
                      ৳ {money(item.totalAmount)}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          {/* =========================
              TOTAL SECTION
          ========================= */}
          <div className="mt-6 flex justify-end">

            <div className="w-[330px]">

              <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-semibold">
                  ৳ {money(purchase.subtotal)}
                </span>
              </div>

              <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
                <span className="text-gray-500">
                  Discount
                </span>

                <span className="font-semibold">
                  - ৳ {money(purchase.discount)}
                </span>
              </div>

              <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
                <span className="text-gray-500">
                  VAT
                </span>

                <span className="font-semibold">
                  ৳ {money(purchase.vat)}
                </span>
              </div>

              <div className="flex justify-between border-b-2 border-gray-900 py-3 text-base">
                <span className="font-bold">
                  Grand Total
                </span>

                <span className="font-extrabold">
                  ৳ {money(purchase.totalAmount)}
                </span>
              </div>

              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-500">
                  Paid Amount
                </span>

                <span className="font-semibold">
                  ৳ {money(purchase.paidAmount)}
                </span>
              </div>

              <div className="flex justify-between py-2 text-sm">
                <span className="font-bold text-gray-700">
                  Due Amount
                </span>

                <span className="font-extrabold text-gray-900">
                  ৳ {money(purchase.dueAmount)}
                </span>
              </div>

            </div>

          </div>

          {/* =========================
              NOTE
          ========================= */}
          {purchase.note && (
            <div className="mt-7 rounded-lg border border-gray-200 p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Note
              </p>

              <p className="text-xs text-gray-700">
                {purchase.note}
              </p>
            </div>
          )}

          {/* =========================
              FOOTER
          ========================= */}
          <div className="mt-12 border-t border-gray-200 pt-5">

            <div className="flex items-end justify-between">

              <div>
                <p className="text-xs text-gray-400">
                  Thank you for your business.
                </p>

                <p className="mt-1 text-[10px] text-gray-400">
                  This is a computer generated purchase invoice.
                </p>
              </div>

              <div className="text-center">
                <div className="mb-2 h-10 w-32 border-b border-gray-400" />

                <p className="text-[10px] text-gray-500">
                  Authorized Signature
                </p>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* =========================
          PRINT CSS
      ========================= */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 210mm;
            margin: 0;
            padding: 0;
            background: white !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #purchase-invoice {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 12mm 14mm;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
}