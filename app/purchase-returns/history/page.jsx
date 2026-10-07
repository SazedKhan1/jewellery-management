"use client";

import { useEffect, useMemo, useState } from "react";

export default function PurchaseReturnHistoryPage() {
  const [returns, setReturns] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    loadReturns();
  }, [search, supplierId, fromDate, toDate]);

  async function loadSuppliers() {
    try {
      const res = await fetch("/api/suppliers");

      if (!res.ok) {
        throw new Error("Failed to load suppliers");
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setSuppliers(data);
      } else if (Array.isArray(data.suppliers)) {
        setSuppliers(data.suppliers);
      } else {
        setSuppliers([]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadReturns() {
    try {
      setLoading(true);
      setError("");

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

      const url = `/api/purchase-returns${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Failed to load purchase returns");
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setReturns(data);
      } else if (Array.isArray(data.returns)) {
        setReturns(data.returns);
      } else {
        setReturns([]);
      }
    } catch (err) {
      console.error(err);
      setError("Purchase return history load করা যাচ্ছে না।");
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatWeight(value) {
    return Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getItemCount(returnData) {
    return returnData?.items?.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );
  }

  function getTotalAmount(returnData) {
    return Number(returnData?.totalAmount || 0);
  }

  const summary = useMemo(() => {
    const totalReturns = returns.length;

    const totalItems = returns.reduce((sum, item) => {
      return sum + getItemCount(item);
    }, 0);

    const totalAmount = returns.reduce((sum, item) => {
      return sum + getTotalAmount(item);
    }, 0);

    const totalWeight = returns.reduce((sum, returnData) => {
      return (
        sum +
        (returnData.items || []).reduce(
          (itemSum, item) => itemSum + Number(item.netWeight || 0),
          0
        )
      );
    }, 0);

    return {
      totalReturns,
      totalItems,
      totalAmount,
      totalWeight,
    };
  }, [returns]);

  function openDetails(returnData) {
    setSelectedReturn(returnData);
    setShowDetails(true);
  }

  function closeDetails() {
    setSelectedReturn(null);
    setShowDetails(false);
  }

  function printReturn(returnData) {
    const items = returnData?.items || [];

    const itemsHtml = items
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.product?.productCode || "-"}</td>
            <td>${item.product?.name || "-"}</td>
            <td>${item.product?.category?.name || "-"}</td>
            <td>${item.quantity || 0}</td>
            <td>${formatWeight(item.grossWeight)}</td>
            <td>${formatWeight(item.stoneWeight)}</td>
            <td>${formatWeight(item.netWeight)}</td>
            <td>${formatMoney(item.rate)}</td>
            <td>${formatMoney(item.totalAmount)}</td>
          </tr>
        `
      )
      .join("");

    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=800"
    );

    if (!printWindow) {
      alert("Popup blocked. Please allow popup for printing.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${returnData.returnNo || "Purchase Return"}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 30px;
            color: #111827;
            background: #ffffff;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #111827;
            padding-bottom: 18px;
            margin-bottom: 20px;
          }

          .company h1 {
            margin: 0 0 5px;
            font-size: 26px;
          }

          .company p {
            margin: 3px 0;
            color: #6b7280;
            font-size: 13px;
          }

          .invoice-title {
            text-align: right;
          }

          .invoice-title h2 {
            margin: 0 0 8px;
            font-size: 22px;
          }

          .invoice-title p {
            margin: 4px 0;
            font-size: 13px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
          }

          .info-box {
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 14px;
          }

          .info-box h3 {
            margin: 0 0 10px;
            font-size: 14px;
          }

          .info-box p {
            margin: 5px 0;
            font-size: 13px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          th,
          td {
            border: 1px solid #d1d5db;
            padding: 8px;
            font-size: 11px;
            text-align: left;
          }

          th {
            background: #f3f4f6;
            font-weight: 700;
          }

          td:nth-child(1),
          td:nth-child(5),
          td:nth-child(6),
          td:nth-child(7),
          td:nth-child(8),
          td:nth-child(9),
          td:nth-child(10) {
            text-align: right;
          }

          .summary {
            margin-top: 20px;
            margin-left: auto;
            width: 330px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
          }

          .summary-row.total {
            font-size: 17px;
            font-weight: 700;
            border-bottom: 2px solid #111827;
            padding-top: 12px;
          }

          .note {
            margin-top: 25px;
            border: 1px solid #d1d5db;
            padding: 12px;
            border-radius: 6px;
          }

          .note strong {
            display: block;
            margin-bottom: 5px;
          }

          .footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #6b7280;
          }

          @media print {
            body {
              padding: 15px;
            }

            @page {
              size: A4 landscape;
              margin: 10mm;
            }
          }
        </style>
      </head>

      <body>

        <div class="header">
          <div class="company">
            <h1>Jewellery Management</h1>
            <p>Purchase Return Document</p>
          </div>

          <div class="invoice-title">
            <h2>PURCHASE RETURN</h2>
            <p><strong>Return No:</strong> ${
              returnData.returnNo || "-"
            }</p>
            <p><strong>Date:</strong> ${formatDate(
              returnData.returnDate
            )}</p>
          </div>
        </div>

        <div class="info-grid">

          <div class="info-box">
            <h3>Supplier Information</h3>
            <p>
              <strong>Name:</strong>
              ${returnData.supplier?.name || "-"}
            </p>

            <p>
              <strong>Code:</strong>
              ${returnData.supplier?.supplierCode || "-"}
            </p>

            <p>
              <strong>Phone:</strong>
              ${returnData.supplier?.phone || "-"}
            </p>

            <p>
              <strong>Address:</strong>
              ${returnData.supplier?.address || "-"}
            </p>
          </div>

          <div class="info-box">
            <h3>Purchase Information</h3>

            <p>
              <strong>Purchase No:</strong>
              ${returnData.purchase?.purchaseNo || "-"}
            </p>

            <p>
              <strong>Purchase Date:</strong>
              ${formatDate(returnData.purchase?.purchaseDate)}
            </p>

            <p>
              <strong>Return Status:</strong>
              ${returnData.status || "COMPLETED"}
            </p>
          </div>

        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product Code</th>
              <th>Product</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Gross Wt.</th>
              <th>Stone Wt.</th>
              <th>Net Wt.</th>
              <th>Rate</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="summary">

          <div class="summary-row">
            <span>Total Items</span>
            <strong>${getItemCount(returnData)}</strong>
          </div>

          <div class="summary-row">
            <span>Total Net Weight</span>
            <strong>${formatWeight(
              items.reduce(
                (sum, item) => sum + Number(item.netWeight || 0),
                0
              )
            )}</strong>
          </div>

          <div class="summary-row total">
            <span>Total Return Amount</span>
            <strong>৳ ${formatMoney(
              returnData.totalAmount
            )}</strong>
          </div>

        </div>

        ${
          returnData.note
            ? `
              <div class="note">
                <strong>Note</strong>
                <div>${returnData.note}</div>
              </div>
            `
            : ""
        }

        <div class="footer">
          <div>Prepared by: __________________</div>
          <div>Authorized by: __________________</div>
        </div>

      </body>
      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  }

  function clearFilters() {
    setSearch("");
    setSupplierId("");
    setFromDate("");
    setToDate("");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "28px",
      }}
    >
      <div
        style={{
          maxWidth: "1500px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Purchase Return History
            </h1>

            <p
              style={{
                margin: "6px 0 0",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              View and manage all purchase return records
            </p>
          </div>

          <a
            href="/purchase-returns"
            style={{
              background: "#111827",
              color: "#fff",
              padding: "11px 18px",
              borderRadius: "7px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            + New Purchase Return
          </a>
        </div>

        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "22px",
          }}
        >
          <SummaryCard
            title="Total Returns"
            value={summary.totalReturns}
            subtitle="Return documents"
          />

          <SummaryCard
            title="Total Items"
            value={summary.totalItems}
            subtitle="Returned quantity"
          />

          <SummaryCard
            title="Net Weight"
            value={formatWeight(summary.totalWeight)}
            subtitle="Returned net weight"
          />

          <SummaryCard
            title="Return Amount"
            value={`৳ ${formatMoney(summary.totalAmount)}`}
            subtitle="Total return value"
          />
        </div>

        {/* Filters */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "18px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(240px, 2fr) minmax(180px, 1fr) repeat(2, minmax(150px, 1fr)) auto",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <FilterField label="Search">
              <input
                type="text"
                placeholder="Return no, purchase no, supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={inputStyle}
              />
            </FilterField>

            <FilterField label="Supplier">
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                style={inputStyle}
              >
                <option value="">All Suppliers</option>

                {suppliers.map((supplier) => (
                  <option
                    key={supplier.id}
                    value={supplier.id}
                  >
                    {supplier.name}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="From Date">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={inputStyle}
              />
            </FilterField>

            <FilterField label="To Date">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={inputStyle}
              />
            </FilterField>

            <button
              onClick={clearFilters}
              style={{
                height: "40px",
                padding: "0 15px",
                border: "1px solid #d1d5db",
                background: "#fff",
                borderRadius: "7px",
                cursor: "pointer",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "12px 15px",
              borderRadius: "7px",
              marginBottom: "18px",
            }}
          >
            {error}
          </div>
        )}

        {/* Table */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "17px",
                  color: "#111827",
                }}
              >
                Return List
              </h2>

              <p
                style={{
                  margin: "4px 0 0",
                  color: "#6b7280",
                  fontSize: "13px",
                }}
              >
                {returns.length} return record
                {returns.length !== 1 ? "s" : ""}
              </p>
            </div>

            <button
              onClick={loadReturns}
              style={{
                border: "1px solid #d1d5db",
                background: "#fff",
                padding: "8px 13px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              Loading purchase return history...
            </div>
          ) : returns.length === 0 ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "38px",
                  marginBottom: "10px",
                }}
              >
                ↩
              </div>

              <h3
                style={{
                  margin: 0,
                  color: "#374151",
                }}
              >
                No Purchase Returns Found
              </h3>

              <p
                style={{
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                No return records match your current filters.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "1050px",
                }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <TableHead>#</TableHead>
                    <TableHead>Return No</TableHead>
                    <TableHead>Purchase No</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Return Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </tr>
                </thead>

                <tbody>
                  {returns.map((returnData, index) => (
                    <tr
                      key={returnData.id}
                      style={{
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <TableCell>
                        {index + 1}
                      </TableCell>

                      <TableCell>
                        <strong
                          style={{
                            color: "#111827",
                          }}
                        >
                          {returnData.returnNo}
                        </strong>
                      </TableCell>

                      <TableCell>
                        {returnData.purchase?.purchaseNo ||
                          "-"}
                      </TableCell>

                      <TableCell>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#111827",
                            }}
                          >
                            {returnData.supplier?.name ||
                              "-"}
                          </div>

                          {returnData.supplier
                            ?.supplierCode && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                marginTop: "3px",
                              }}
                            >
                              {
                                returnData.supplier
                                  .supplierCode
                              }
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          returnData.returnDate
                        )}
                      </TableCell>

                      <TableCell>
                        {getItemCount(returnData)}
                      </TableCell>

                      <TableCell>
                        <strong>
                          ৳{" "}
                          {formatMoney(
                            returnData.totalAmount
                          )}
                        </strong>
                      </TableCell>

                      <TableCell>
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "5px 9px",
                            borderRadius: "999px",
                            background:
                              returnData.status ===
                              "COMPLETED"
                                ? "#ecfdf5"
                                : "#f3f4f6",
                            color:
                              returnData.status ===
                              "COMPLETED"
                                ? "#047857"
                                : "#4b5563",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          {returnData.status ||
                            "COMPLETED"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div
                          style={{
                            display: "flex",
                            gap: "7px",
                          }}
                        >
                          <button
                            onClick={() =>
                              openDetails(returnData)
                            }
                            style={{
                              border: "1px solid #d1d5db",
                              background: "#fff",
                              color: "#111827",
                              padding: "7px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              printReturn(returnData)
                            }
                            style={{
                              border: "1px solid #111827",
                              background: "#111827",
                              color: "#fff",
                              padding: "7px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            Print
                          </button>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedReturn && (
        <div
          onClick={closeDetails}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(1200px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "12px",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.2)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 22px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    color: "#111827",
                  }}
                >
                  Purchase Return Details
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#6b7280",
                    fontSize: "13px",
                  }}
                >
                  {selectedReturn.returnNo}
                </p>
              </div>

              <button
                onClick={closeDetails}
                style={{
                  width: "34px",
                  height: "34px",
                  border: "none",
                  borderRadius: "50%",
                  background: "#f3f4f6",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "22px" }}>
              {/* Information */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                  marginBottom: "22px",
                }}
              >
                <InfoBox
                  label="Return No"
                  value={selectedReturn.returnNo}
                />

                <InfoBox
                  label="Purchase No"
                  value={
                    selectedReturn.purchase?.purchaseNo ||
                    "-"
                  }
                />

                <InfoBox
                  label="Supplier"
                  value={
                    selectedReturn.supplier?.name || "-"
                  }
                />

                <InfoBox
                  label="Supplier Code"
                  value={
                    selectedReturn.supplier
                      ?.supplierCode || "-"
                  }
                />

                <InfoBox
                  label="Return Date"
                  value={formatDate(
                    selectedReturn.returnDate
                  )}
                />

                <InfoBox
                  label="Status"
                  value={
                    selectedReturn.status || "COMPLETED"
                  }
                />
              </div>

              {/* Items */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "14px 16px",
                    background: "#f8fafc",
                    borderBottom:
                      "1px solid #e5e7eb",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Returned Items
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: "950px",
                    }}
                  >
                    <thead>
                      <tr>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Gross Wt.</TableHead>
                        <TableHead>Stone Wt.</TableHead>
                        <TableHead>Net Wt.</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Making</TableHead>
                        <TableHead>Stone Charge</TableHead>
                        <TableHead>Total</TableHead>
                      </tr>
                    </thead>

                    <tbody>
                      {(selectedReturn.items || []).map(
                        (item) => (
                          <tr
                            key={item.id}
                            style={{
                              borderTop:
                                "1px solid #e5e7eb",
                            }}
                          >
                            <TableCell>
                              <div>
                                <strong>
                                  {item.product?.name ||
                                    "-"}
                                </strong>

                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#6b7280",
                                    marginTop: "3px",
                                  }}
                                >
                                  {item.product
                                    ?.productCode || "-"}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              {item.product?.category
                                ?.name || "-"}
                            </TableCell>

                            <TableCell>
                              {item.quantity || 0}
                            </TableCell>

                            <TableCell>
                              {formatWeight(
                                item.grossWeight
                              )}
                            </TableCell>

                            <TableCell>
                              {formatWeight(
                                item.stoneWeight
                              )}
                            </TableCell>

                            <TableCell>
                              {formatWeight(
                                item.netWeight
                              )}
                            </TableCell>

                            <TableCell>
                              ৳ {formatMoney(item.rate)}
                            </TableCell>

                            <TableCell>
                              ৳{" "}
                              {formatMoney(
                                item.makingCharge
                              )}
                            </TableCell>

                            <TableCell>
                              ৳{" "}
                              {formatMoney(
                                item.stoneCharge
                              )}
                            </TableCell>

                            <TableCell>
                              <strong>
                                ৳{" "}
                                {formatMoney(
                                  item.totalAmount
                                )}
                              </strong>
                            </TableCell>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    width: "350px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px",
                  }}
                >
                  <SummaryRow
                    label="Total Items"
                    value={getItemCount(
                      selectedReturn
                    )}
                  />

                  <SummaryRow
                    label="Total Net Weight"
                    value={formatWeight(
                      (selectedReturn.items || []).reduce(
                        (sum, item) =>
                          sum +
                          Number(
                            item.netWeight || 0
                          ),
                        0
                      )
                    )}
                  />

                  <SummaryRow
                    label="Subtotal"
                    value={`৳ ${formatMoney(
                      selectedReturn.subtotal
                    )}`}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: "12px",
                      marginTop: "8px",
                      borderTop:
                        "2px solid #111827",
                      fontSize: "17px",
                      fontWeight: 700,
                    }}
                  >
                    <span>Total Return</span>

                    <span>
                      ৳{" "}
                      {formatMoney(
                        selectedReturn.totalAmount
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Note */}
              {selectedReturn.note && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "14px",
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: "5px",
                    }}
                  >
                    Note
                  </div>

                  <div
                    style={{
                      color: "#4b5563",
                      fontSize: "14px",
                    }}
                  >
                    {selectedReturn.note}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 22px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={closeDetails}
                style={{
                  padding: "10px 18px",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  borderRadius: "7px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Close
              </button>

              <button
                onClick={() =>
                  printReturn(selectedReturn)
                }
                style={{
                  padding: "10px 18px",
                  border: "none",
                  background: "#111827",
                  color: "#fff",
                  borderRadius: "7px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Print Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "18px",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: "13px",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#9ca3af",
          fontSize: "12px",
          marginTop: "5px",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "6px",
          fontSize: "12px",
          fontWeight: 600,
          color: "#374151",
        }}
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "13px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#6b7280",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 0",
        fontSize: "14px",
      }}
    >
      <span style={{ color: "#6b7280" }}>
        {label}
      </span>

      <strong style={{ color: "#111827" }}>
        {value}
      </strong>
    </div>
  );
}

function TableHead({ children }) {
  return (
    <th
      style={{
        padding: "12px 14px",
        textAlign: "left",
        fontSize: "12px",
        fontWeight: 700,
        color: "#374151",
        borderBottom: "1px solid #e5e7eb",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function TableCell({ children }) {
  return (
    <td
      style={{
        padding: "12px 14px",
        fontSize: "13px",
        color: "#374151",
        verticalAlign: "middle",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </td>
  );
}

const inputStyle = {
  width: "100%",
  height: "40px",
  padding: "0 11px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  outline: "none",
  background: "#fff",
  color: "#111827",
  fontSize: "13px",
};