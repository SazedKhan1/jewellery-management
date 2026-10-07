"use client";

import { useEffect, useMemo, useState } from "react";

const money = (value) =>
  Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function SupplierPaymentHistoryPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedPayment, setSelectedPayment] = useState(null);

  const loadPayments = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (supplierId) {
        params.set("supplierId", supplierId);
      }

      if (fromDate) {
        params.set("fromDate", fromDate);
      }

      if (toDate) {
        params.set("toDate", toDate);
      }

      const res = await fetch(`/api/supplier-ledger?${params.toString()}`);

      if (!res.ok) {
        throw new Error("Failed to load payment history");
      }

      const data = await res.json();

      setSuppliers(data.suppliers || []);
      setPayments(data.payments || []);
    } catch (error) {
      console.error(error);
      alert("Payment history load করা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return payments;
    }

    return payments.filter((payment) => {
      return (
        String(payment.paymentNo || "")
          .toLowerCase()
          .includes(keyword) ||
        String(payment.supplier?.name || "")
          .toLowerCase()
          .includes(keyword) ||
        String(payment.referenceNo || "")
          .toLowerCase()
          .includes(keyword) ||
        String(payment.paymentMethod || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [payments, search]);

  const totalPayment = filteredPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const cashTotal = filteredPayments.reduce((sum, payment) => {
    const breakdown = payment.paymentBreakdown;

    if (!breakdown) {
      return (
        sum +
        (payment.paymentMethod === "CASH"
          ? Number(payment.amount || 0)
          : 0)
      );
    }

    return (
      sum +
      Number(
        Array.isArray(breakdown)
          ? breakdown
              .filter((item) => item.method === "CASH")
              .reduce((s, item) => s + Number(item.amount || 0), 0)
          : breakdown.CASH || 0
      )
    );
  }, 0);

  const bankTotal = filteredPayments.reduce((sum, payment) => {
    const breakdown = payment.paymentBreakdown;

    if (!breakdown) {
      return (
        sum +
        (payment.paymentMethod === "BANK"
          ? Number(payment.amount || 0)
          : 0)
      );
    }

    return (
      sum +
      Number(
        Array.isArray(breakdown)
          ? breakdown
              .filter((item) => item.method === "BANK")
              .reduce((s, item) => s + Number(item.amount || 0), 0)
          : breakdown.BANK || 0
      )
    );
  }, 0);

  const mobileBankingTotal = filteredPayments.reduce((sum, payment) => {
    const breakdown = payment.paymentBreakdown;

    if (!breakdown) {
      return (
        sum +
        (["BKASH", "NAGAD", "ROCKET"].includes(payment.paymentMethod)
          ? Number(payment.amount || 0)
          : 0)
      );
    }

    return (
      sum +
      Number(
        Array.isArray(breakdown)
          ? breakdown
              .filter((item) =>
                ["BKASH", "NAGAD", "ROCKET"].includes(item.method)
              )
              .reduce((s, item) => s + Number(item.amount || 0), 0)
          : Number(breakdown.BKASH || 0) +
              Number(breakdown.NAGAD || 0) +
              Number(breakdown.ROCKET || 0)
      )
    );
  }, 0);

  const getBreakdown = (payment) => {
    if (!payment.paymentBreakdown) {
      return [
        {
          method: payment.paymentMethod || "CASH",
          amount: Number(payment.amount || 0),
          referenceNo: payment.referenceNo || "",
        },
      ];
    }

    if (Array.isArray(payment.paymentBreakdown)) {
      return payment.paymentBreakdown;
    }

    return Object.entries(payment.paymentBreakdown).map(
      ([method, amount]) => ({
        method,
        amount,
        referenceNo: "",
      })
    );
  };

  const methodLabel = (method) => {
    const labels = {
      CASH: "Cash",
      BANK: "Bank",
      BKASH: "bKash",
      NAGAD: "Nagad",
      ROCKET: "Rocket",
      CHEQUE: "Cheque",
      OTHER: "Other",
    };

    return labels[method] || method || "-";
  };

  const handleFilter = () => {
    loadPayments();
  };

  const handleReset = () => {
    setSearch("");
    setSupplierId("");
    setFromDate("");
    setToDate("");

    setTimeout(() => {
      loadPayments();
    }, 0);
  };

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1>Supplier Payment History</h1>
          <p>All supplier payments and payment transactions</p>
        </div>

        <div className="top-actions">
          <a href="/supplier-ledger" className="back-btn">
            ← Supplier Ledger
          </a>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Total Payments</div>
          <div className="summary-value">
            {filteredPayments.length}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Total Amount</div>
          <div className="summary-value">
            ৳ {money(totalPayment)}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Cash</div>
          <div className="summary-value">
            ৳ {money(cashTotal)}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Bank</div>
          <div className="summary-value">
            ৳ {money(bankTotal)}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Mobile Banking</div>
          <div className="summary-value">
            ৳ {money(mobileBankingTotal)}
          </div>
        </div>
      </div>

      <div className="filter-card">
        <div className="filter-row">
          <div className="field search-field">
            <label>Search</label>
            <input
              type="text"
              placeholder="Payment no, supplier, reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Supplier</label>

            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">All Suppliers</option>

              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>From Date</label>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="field">
            <label>To Date</label>

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="filter-buttons">
            <button className="apply-btn" onClick={handleFilter}>
              Apply
            </button>

            <button className="reset-btn" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div>
            <h2>Payment Transactions</h2>
            <span>{filteredPayments.length} payment(s)</span>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading payment history...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">৳</div>
            <h3>No Payment Found</h3>
            <p>
              There are no supplier payment transactions matching your
              filter.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Payment No</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Payment Method</th>
                  <th>Reference</th>
                  <th className="amount-col">Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((payment, index) => {
                  const breakdown = getBreakdown(payment);

                  return (
                    <tr key={payment.id}>
                      <td>{index + 1}</td>

                      <td>
                        <strong className="payment-no">
                          {payment.paymentNo}
                        </strong>
                      </td>

                      <td>{formatDate(payment.paymentDate)}</td>

                      <td>
                        <div className="supplier-name">
                          {payment.supplier?.name || "-"}
                        </div>

                        {payment.supplier?.phone && (
                          <div className="supplier-phone">
                            {payment.supplier.phone}
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="method-list">
                          {breakdown.map((item, itemIndex) => (
                            <span
                              key={`${payment.id}-${itemIndex}`}
                              className="method-badge"
                            >
                              {methodLabel(item.method)}{" "}
                              <b>৳{money(item.amount)}</b>
                            </span>
                          ))}
                        </div>
                      </td>

                      <td>
                        {payment.referenceNo || "-"}
                      </td>

                      <td className="amount-col">
                        <strong>৳ {money(payment.amount)}</strong>
                      </td>

                      <td>
                        <span
                          className={`status ${
                            payment.status === "COMPLETED"
                              ? "completed"
                              : "cancelled"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="view-btn"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPayment && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Payment Details</h2>
                <p>{selectedPayment.paymentNo}</p>
              </div>

              <button
                className="close-btn"
                onClick={() => setSelectedPayment(null)}
              >
                ×
              </button>
            </div>

            <div className="details-grid">
              <div>
                <span>Payment No</span>
                <strong>{selectedPayment.paymentNo}</strong>
              </div>

              <div>
                <span>Date</span>
                <strong>
                  {formatDate(selectedPayment.paymentDate)}
                </strong>
              </div>

              <div>
                <span>Supplier</span>
                <strong>
                  {selectedPayment.supplier?.name || "-"}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{selectedPayment.status}</strong>
              </div>
            </div>

            <div className="breakdown-section">
              <h3>Payment Breakdown</h3>

              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {getBreakdown(selectedPayment).map(
                    (item, index) => (
                      <tr key={index}>
                        <td>{methodLabel(item.method)}</td>
                        <td>
                          {item.referenceNo ||
                            selectedPayment.referenceNo ||
                            "-"}
                        </td>
                        <td>
                          ৳ {money(item.amount)}
                        </td>
                      </tr>
                    )
                  )}

                  <tr className="total-row">
                    <td colSpan="2">Total Payment</td>
                    <td>
                      ৳ {money(selectedPayment.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="note-box">
              <span>Note</span>
              <p>{selectedPayment.note || "No note added."}</p>
            </div>

            <div className="modal-footer">
              <button
                className="print-btn"
                onClick={() => window.print()}
              >
                Print
              </button>

              <button
                className="close-modal-btn"
                onClick={() => setSelectedPayment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f7f8fa;
          padding: 28px;
          color: #172033;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .topbar h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }

        .topbar p {
          margin: 7px 0 0;
          color: #697386;
          font-size: 14px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          padding: 10px 15px;
          border: 1px solid #dfe3e8;
          background: white;
          border-radius: 8px;
          color: #344054;
          font-size: 14px;
          font-weight: 600;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .summary-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 18px;
        }

        .summary-label {
          color: #667085;
          font-size: 13px;
          margin-bottom: 9px;
        }

        .summary-value {
          font-size: 22px;
          font-weight: 700;
        }

        .filter-card,
        .table-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .filter-card {
          padding: 18px;
        }

        .filter-row {
          display: grid;
          grid-template-columns: 1.8fr 1.2fr 1fr 1fr auto;
          gap: 14px;
          align-items: end;
        }

        .field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #475467;
          margin-bottom: 7px;
        }

        .field input,
        .field select {
          width: 100%;
          height: 40px;
          padding: 0 11px;
          border: 1px solid #d0d5dd;
          border-radius: 7px;
          outline: none;
          background: white;
          font-size: 13px;
          box-sizing: border-box;
        }

        .field input:focus,
        .field select:focus {
          border-color: #98a2b3;
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
        }

        .apply-btn,
        .reset-btn {
          height: 40px;
          border-radius: 7px;
          padding: 0 15px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
        }

        .apply-btn {
          border: 1px solid #172033;
          background: #172033;
          color: white;
        }

        .reset-btn {
          border: 1px solid #d0d5dd;
          background: white;
          color: #344054;
        }

        .table-header {
          padding: 18px 20px;
          border-bottom: 1px solid #eaecf0;
        }

        .table-header h2 {
          margin: 0;
          font-size: 17px;
        }

        .table-header span {
          display: block;
          margin-top: 5px;
          color: #667085;
          font-size: 12px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1100px;
        }

        th {
          background: #fafafa;
          color: #667085;
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          padding: 13px 15px;
          border-bottom: 1px solid #eaecf0;
          white-space: nowrap;
        }

        td {
          padding: 14px 15px;
          border-bottom: 1px solid #f0f2f5;
          font-size: 13px;
          vertical-align: middle;
        }

        tbody tr:hover {
          background: #fcfcfd;
        }

        .payment-no {
          color: #344054;
        }

        .supplier-name {
          font-weight: 600;
        }

        .supplier-phone {
          color: #98a2b3;
          font-size: 11px;
          margin-top: 3px;
        }

        .method-list {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          max-width: 260px;
        }

        .method-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 7px;
          border-radius: 6px;
          background: #f2f4f7;
          color: #475467;
          font-size: 11px;
          white-space: nowrap;
        }

        .amount-col {
          text-align: right;
          white-space: nowrap;
        }

        .status {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }

        .completed {
          background: #ecfdf3;
          color: #027a48;
        }

        .cancelled {
          background: #fef3f2;
          color: #b42318;
        }

        .view-btn {
          border: 1px solid #d0d5dd;
          background: white;
          color: #344054;
          padding: 7px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .loading,
        .empty {
          text-align: center;
          padding: 70px 20px;
          color: #667085;
        }

        .empty-icon {
          width: 50px;
          height: 50px;
          margin: 0 auto 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f2f4f7;
          font-size: 22px;
          font-weight: 700;
        }

        .empty h3 {
          margin: 0 0 6px;
          color: #344054;
        }

        .empty p {
          margin: 0;
          font-size: 13px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(16, 24, 40, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .modal {
          width: 100%;
          max-width: 720px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid #eaecf0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 19px;
        }

        .modal-header p {
          margin: 5px 0 0;
          color: #667085;
          font-size: 12px;
        }

        .close-btn {
          width: 34px;
          height: 34px;
          border: 0;
          background: #f2f4f7;
          border-radius: 50%;
          cursor: pointer;
          font-size: 21px;
          color: #475467;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          padding: 20px;
          border-bottom: 1px solid #eaecf0;
        }

        .details-grid span,
        .note-box span {
          display: block;
          color: #667085;
          font-size: 11px;
          margin-bottom: 5px;
        }

        .details-grid strong {
          font-size: 14px;
        }

        .breakdown-section {
          padding: 20px;
        }

        .breakdown-section h3 {
          margin: 0 0 12px;
          font-size: 15px;
        }

        .breakdown-table {
          min-width: 0;
          border: 1px solid #eaecf0;
          border-radius: 8px;
          overflow: hidden;
        }

        .breakdown-table th,
        .breakdown-table td {
          padding: 11px 12px;
        }

        .total-row td {
          background: #fafafa;
          font-weight: 700;
        }

        .note-box {
          margin: 0 20px 20px;
          padding: 13px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .note-box p {
          margin: 0;
          font-size: 13px;
          color: #475467;
          line-height: 1.5;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 16px 20px;
          border-top: 1px solid #eaecf0;
        }

        .print-btn,
        .close-modal-btn {
          height: 38px;
          padding: 0 15px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .print-btn {
          background: #172033;
          color: white;
          border: 1px solid #172033;
        }

        .close-modal-btn {
          background: white;
          color: #344054;
          border: 1px solid #d0d5dd;
        }

        @media (max-width: 1100px) {
          .summary-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .filter-row {
            grid-template-columns: repeat(2, 1fr);
          }

          .search-field {
            grid-column: span 2;
          }
        }

        @media (max-width: 700px) {
          .page {
            padding: 15px;
          }

          .topbar {
            align-items: flex-start;
            gap: 15px;
            flex-direction: column;
          }

          .summary-grid {
            grid-template-columns: 1fr 1fr;
          }

          .filter-row {
            grid-template-columns: 1fr;
          }

          .search-field {
            grid-column: auto;
          }

          .filter-buttons {
            width: 100%;
          }

          .apply-btn,
          .reset-btn {
            flex: 1;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }
        }

        @media print {
          .topbar,
          .summary-grid,
          .filter-card,
          .table-card,
          .modal-overlay {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}