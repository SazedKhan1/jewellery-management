"use client";

import { useEffect, useMemo, useState } from "react";

export default function StockPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [history, setHistory] = useState([]);

  const [form, setForm] = useState({
    productId: "",
    transactionType: "OPENING",
    quantity: "",
    grossWeight: "",
    stoneWeight: "",
    netWeight: "",
    note: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  // =========================
  // LOAD PRODUCTS
  // =========================

  const loadProducts = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/stock");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load stock."
        );
      }

      setProducts(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // =========================
  // CATEGORIES
  // =========================

  const categories = useMemo(() => {
    const categoryMap = new Map();

    products.forEach((product) => {
      if (product.category) {
        categoryMap.set(
          product.category.id,
          product.category.name
        );
      }
    });

    return Array.from(categoryMap.entries());
  }, [products]);

  // =========================
  // FILTER PRODUCTS
  // =========================

  const filteredProducts = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return products.filter((product) => {
      const matchesSearch =
        !searchText ||
        product.name
          ?.toLowerCase()
          .includes(searchText) ||
        product.productCode
          ?.toLowerCase()
          .includes(searchText) ||
        product.barcode
          ?.toLowerCase()
          .includes(searchText);

      const matchesCategory =
        !categoryFilter ||
        String(product.categoryId) ===
          String(categoryFilter);

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  // =========================
  // STOCK SUMMARY
  // =========================

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) =>
      total + Number(product.stockQuantity || 0),
    0
  );

  const totalNetWeight = products.reduce(
    (total, product) =>
      total + Number(product.netWeight || 0),
    0
  );

  const outOfStock = products.filter(
    (product) =>
      Number(product.stockQuantity || 0) === 0
  ).length;

  const lowStock = products.filter(
    (product) =>
      Number(product.stockQuantity || 0) > 0 &&
      Number(product.stockQuantity || 0) <= 5
  ).length;

  // =========================
  // OPEN STOCK MODAL
  // =========================

  const openStockModal = (product) => {
    setSelectedProduct(product);

    setForm({
      productId: product.id,
      transactionType: "OPENING",
      quantity: "",
      grossWeight: "",
      stoneWeight: "",
      netWeight: "",
      note: "",
    });

    setMessage("");
    setError("");

    setShowModal(true);
  };

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================
  // AUTO CALCULATE NET WEIGHT
  // =========================

  const handleGrossWeightChange = (e) => {
    const gross = e.target.value;

    setForm((previous) => {
      const stone = Number(previous.stoneWeight) || 0;
      const grossNumber = Number(gross) || 0;

      const calculatedNet =
        grossNumber - stone >= 0
          ? (grossNumber - stone).toFixed(3)
          : "";

      return {
        ...previous,
        grossWeight: gross,
        netWeight: calculatedNet,
      };
    });
  };

  const handleStoneWeightChange = (e) => {
    const stone = e.target.value;

    setForm((previous) => {
      const gross = Number(previous.grossWeight) || 0;
      const stoneNumber = Number(stone) || 0;

      const calculatedNet =
        gross - stoneNumber >= 0
          ? (gross - stoneNumber).toFixed(3)
          : "";

      return {
        ...previous,
        stoneWeight: stone,
        netWeight: calculatedNet,
      };
    });
  };

  // =========================
  // UPDATE STOCK
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!form.productId) {
      setError("Product is required.");
      return;
    }

    if (
      form.quantity === "" ||
      Number(form.quantity) < 0
    ) {
      setError("Please enter a valid quantity.");
      return;
    }

    const gross = Number(form.grossWeight) || 0;
    const stone = Number(form.stoneWeight) || 0;
    const net = Number(form.netWeight) || 0;

    if (gross < 0 || stone < 0 || net < 0) {
      setError("Weight cannot be negative.");
      return;
    }

    if (stone > gross) {
      setError(
        "Stone weight cannot be greater than gross weight."
      );
      return;
    }

    try {
      const response = await fetch("/api/stock", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          grossWeight: gross,
          stoneWeight: stone,
          netWeight: net,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update stock."
        );
      }

      setMessage(
        "Stock updated successfully."
      );

      setShowModal(false);

      setForm({
        productId: "",
        transactionType: "OPENING",
        quantity: "",
        grossWeight: "",
        stoneWeight: "",
        netWeight: "",
        note: "",
      });

      await loadProducts();
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  // =========================
  // STOCK HISTORY
  // =========================

  const openHistory = async (product) => {
    setSelectedProduct(product);
    setHistory([]);
    setShowHistory(true);
    setHistoryLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stock", {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          productId: product.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load history."
        );
      }

      setHistory(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // =========================
  // TRANSACTION LABEL
  // =========================

  const transactionLabel = (type) => {
    const labels = {
      OPENING: "Opening Stock",
      PURCHASE: "Purchase",
      SALES: "Sales",
      PURCHASE_RETURN: "Purchase Return",
      SALES_RETURN: "Sales Return",
      ADJUSTMENT_IN: "Adjustment In",
      ADJUSTMENT_OUT: "Adjustment Out",
    };

    return labels[type] || type;
  };

  // =========================
  // TRANSACTION SIGN
  // =========================

  const transactionSign = (type) => {
    if (
      type === "SALES" ||
      type === "PURCHASE_RETURN" ||
      type === "ADJUSTMENT_OUT"
    ) {
      return "-";
    }

    return "+";
  };

  return (
    <div style={styles.page}>
      {/* =========================
          HEADER
      ========================= */}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Stock Management
          </h1>

          <p style={styles.subtitle}>
            Manage product quantity, weight and
            stock transactions
          </p>
        </div>
      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      {/* =========================
          SUCCESS
      ========================= */}

      {message && (
        <div style={styles.successBox}>
          {message}
        </div>
      )}

      {/* =========================
          SUMMARY
      ========================= */}

      <div style={styles.summaryGrid}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>
            Total Products
          </div>

          <div style={styles.cardValue}>
            {totalProducts}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>
            Total Stock
          </div>

          <div style={styles.cardValue}>
            {totalStock} PC
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>
            Total Net Weight
          </div>

          <div style={styles.cardValue}>
            {totalNetWeight.toFixed(3)} g
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>
            Low / Out Stock
          </div>

          <div style={styles.cardValue}>
            {lowStock} / {outOfStock}
          </div>
        </div>
      </div>

      {/* =========================
          FILTER
      ========================= */}

      <div style={styles.filterBox}>
        <input
          type="text"
          placeholder="Search product, code or barcode..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={styles.input}
        />

        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value)
          }
          style={styles.input}
        >
          <option value="">
            All Categories
          </option>

          {categories.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* =========================
          TABLE
      ========================= */}

      <div style={styles.tableWrapper}>
        {loading ? (
          <div style={styles.empty}>
            Loading stock...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={styles.empty}>
            No products found.
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>

                <th style={styles.th}>
                  Product
                </th>

                <th style={styles.th}>
                  Code
                </th>

                <th style={styles.th}>
                  Category
                </th>

                <th style={styles.th}>
                  Karat
                </th>

                <th style={styles.th}>
                  Stock
                </th>

                <th style={styles.th}>
                  Gross Weight
                </th>

                <th style={styles.th}>
                  Stone Weight
                </th>

                <th style={styles.th}>
                  Net Weight
                </th>

                <th style={styles.th}>
                  Status
                </th>

                <th style={styles.th}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map(
                (product, index) => {
                  const stock = Number(
                    product.stockQuantity || 0
                  );

                  return (
                    <tr key={product.id}>
                      <td style={styles.td}>
                        {index + 1}
                      </td>

                      <td style={styles.td}>
                        <strong>
                          {product.name}
                        </strong>
                      </td>

                      <td style={styles.td}>
                        {product.productCode}
                      </td>

                      <td style={styles.td}>
                        {product.category?.name ||
                          "-"}
                      </td>

                      <td style={styles.td}>
                        {product.karat || "-"}
                      </td>

                      <td style={styles.td}>
                        <strong
                          style={
                            styles.stockNumber
                          }
                        >
                          {stock} PC
                        </strong>
                      </td>

                      <td style={styles.td}>
                        {Number(
                          product.grossWeight || 0
                        ).toFixed(3)}{" "}
                        g
                      </td>

                      <td style={styles.td}>
                        {Number(
                          product.stoneWeight || 0
                        ).toFixed(3)}{" "}
                        g
                      </td>

                      <td style={styles.td}>
                        <strong>
                          {Number(
                            product.netWeight || 0
                          ).toFixed(3)}{" "}
                          g
                        </strong>
                      </td>

                      <td style={styles.td}>
                        {stock === 0 ? (
                          <span
                            style={{
                              ...styles.badge,
                              ...styles.outBadge,
                            }}
                          >
                            Out of Stock
                          </span>
                        ) : stock <= 5 ? (
                          <span
                            style={{
                              ...styles.badge,
                              ...styles.lowBadge,
                            }}
                          >
                            Low Stock
                          </span>
                        ) : (
                          <span
                            style={{
                              ...styles.badge,
                              ...styles.availableBadge,
                            }}
                          >
                            Available
                          </span>
                        )}
                      </td>

                      <td style={styles.td}>
                        <div
                          style={styles.actions}
                        >
                          <button
                            onClick={() =>
                              openStockModal(
                                product
                              )
                            }
                            style={
                              styles.stockButton
                            }
                          >
                            Update Stock
                          </button>

                          <button
                            onClick={() =>
                              openHistory(product)
                            }
                            style={
                              styles.historyButton
                            }
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* =========================
          STOCK ENTRY MODAL
      ========================= */}

      {showModal &&
        selectedProduct && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <div
                style={styles.modalHeader}
              >
                <div>
                  <h2
                    style={styles.modalTitle}
                  >
                    Stock Entry
                  </h2>

                  <p
                    style={
                      styles.modalSubtitle
                    }
                  >
                    {selectedProduct.name}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowModal(false)
                  }
                  style={styles.closeButton}
                >
                  ×
                </button>
              </div>

              {/* CURRENT STOCK */}

              <div
                style={
                  styles.currentStockBox
                }
              >
                <div>
                  <span>
                    Current Quantity
                  </span>

                  <strong>
                    {selectedProduct.stockQuantity}{" "}
                    PC
                  </strong>
                </div>

                <div>
                  <span>
                    Current Net Weight
                  </span>

                  <strong>
                    {Number(
                      selectedProduct.netWeight ||
                        0
                    ).toFixed(3)}{" "}
                    g
                  </strong>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* TRANSACTION */}

                <div
                  style={styles.formGroup}
                >
                  <label
                    style={styles.label}
                  >
                    Transaction Type
                  </label>

                  <select
                    name="transactionType"
                    value={
                      form.transactionType
                    }
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="OPENING">
                      Opening Stock
                    </option>

                    <option value="PURCHASE">
                      Purchase
                    </option>

                    <option value="SALES">
                      Sales
                    </option>

                    <option value="PURCHASE_RETURN">
                      Purchase Return
                    </option>

                    <option value="SALES_RETURN">
                      Sales Return
                    </option>

                    <option value="ADJUSTMENT_IN">
                      Adjustment In
                    </option>

                    <option value="ADJUSTMENT_OUT">
                      Adjustment Out
                    </option>
                  </select>
                </div>

                {/* QUANTITY */}

                <div
                  style={styles.formGroup}
                >
                  <label
                    style={styles.label}
                  >
                    Quantity (PC)
                  </label>

                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={handleChange}
                    placeholder="Enter quantity"
                    style={styles.input}
                  />
                </div>

                {/* WEIGHTS */}

                <div
                  style={
                    styles.weightGrid
                  }
                >
                  <div
                    style={
                      styles.formGroup
                    }
                  >
                    <label
                      style={styles.label}
                    >
                      Gross Weight (g)
                    </label>

                    <input
                      type="number"
                      name="grossWeight"
                      min="0"
                      step="0.001"
                      value={
                        form.grossWeight
                      }
                      onChange={
                        handleGrossWeightChange
                      }
                      placeholder="0.000"
                      style={styles.input}
                    />
                  </div>

                  <div
                    style={
                      styles.formGroup
                    }
                  >
                    <label
                      style={styles.label}
                    >
                      Stone Weight (g)
                    </label>

                    <input
                      type="number"
                      name="stoneWeight"
                      min="0"
                      step="0.001"
                      value={
                        form.stoneWeight
                      }
                      onChange={
                        handleStoneWeightChange
                      }
                      placeholder="0.000"
                      style={styles.input}
                    />
                  </div>
                </div>

                {/* NET WEIGHT */}

                <div
                  style={styles.formGroup}
                >
                  <label
                    style={styles.label}
                  >
                    Net Weight (g)
                  </label>

                  <input
                    type="number"
                    name="netWeight"
                    min="0"
                    step="0.001"
                    value={form.netWeight}
                    onChange={handleChange}
                    placeholder="0.000"
                    style={{
                      ...styles.input,
                      background:
                        "#f5f6f8",
                    }}
                  />

                  <small
                    style={
                      styles.helpText
                    }
                  >
                    Net Weight = Gross Weight -
                    Stone Weight
                  </small>
                </div>

                {/* NOTE */}

                <div
                  style={styles.formGroup}
                >
                  <label
                    style={styles.label}
                  >
                    Note
                  </label>

                  <textarea
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    placeholder="Optional note..."
                    rows="3"
                    style={{
                      ...styles.input,
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* ACTION */}

                <div
                  style={styles.modalActions}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setShowModal(false)
                    }
                    style={
                      styles.cancelButton
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    style={
                      styles.submitButton
                    }
                  >
                    Save Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* =========================
          HISTORY MODAL
      ========================= */}

      {showHistory &&
        selectedProduct && (
          <div style={styles.overlay}>
            <div
              style={{
                ...styles.modal,
                width: "1000px",
                maxWidth: "95%",
              }}
            >
              <div
                style={
                  styles.modalHeader
                }
              >
                <div>
                  <h2
                    style={styles.modalTitle}
                  >
                    Stock History
                  </h2>

                  <p
                    style={
                      styles.modalSubtitle
                    }
                  >
                    {selectedProduct.name} —{" "}
                    {selectedProduct.productCode}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowHistory(false)
                  }
                  style={
                    styles.closeButton
                  }
                >
                  ×
                </button>
              </div>

              {historyLoading ? (
                <div style={styles.empty}>
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <div style={styles.empty}>
                  No stock transactions found.
                </div>
              ) : (
                <div
                  style={
                    styles.historyTableWrapper
                  }
                >
                  <table
                    style={styles.table}
                  >
                    <thead>
                      <tr>
                        <th
                          style={styles.th}
                        >
                          Date
                        </th>

                        <th
                          style={styles.th}
                        >
                          Transaction
                        </th>

                        <th
                          style={styles.th}
                        >
                          Quantity
                        </th>

                        <th
                          style={styles.th}
                        >
                          Gross
                        </th>

                        <th
                          style={styles.th}
                        >
                          Stone
                        </th>

                        <th
                          style={styles.th}
                        >
                          Net
                        </th>

                        <th
                          style={styles.th}
                        >
                          Reference
                        </th>

                        <th
                          style={styles.th}
                        >
                          Note
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {history.map(
                        (item) => (
                          <tr
                            key={item.id}
                          >
                            <td
                              style={
                                styles.td
                              }
                            >
                              {new Date(
                                item.createdAt
                              ).toLocaleString()}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {transactionLabel(
                                item.transactionType
                              )}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              <strong>
                                {transactionSign(
                                  item.transactionType
                                )}
                                {
                                  item.quantity
                                }{" "}
                                PC
                              </strong>
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {Number(
                                item.grossWeight ||
                                  0
                              ).toFixed(3)}{" "}
                              g
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {Number(
                                item.stoneWeight ||
                                  0
                              ).toFixed(3)}{" "}
                              g
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {Number(
                                item.netWeight ||
                                  0
                              ).toFixed(3)}{" "}
                              g
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {item.referenceType ||
                                "-"}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {item.note || "-"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

// =====================================
// STYLES
// =====================================

const styles = {
  page: {
    padding: "30px",
    background: "#f6f7fb",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    marginBottom: "25px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
  },

  subtitle: {
    marginTop: "6px",
    color: "#666",
    fontSize: "14px",
  },

  errorBox: {
    background: "#ffe5e5",
    color: "#b42318",
    padding: "12px 15px",
    borderRadius: "8px",
    marginBottom: "15px",
  },

  successBox: {
    background: "#e7f8ed",
    color: "#16733a",
    padding: "12px 15px",
    borderRadius: "8px",
    marginBottom: "15px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "15px",
    marginBottom: "25px",
  },

  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.06)",
  },

  cardLabel: {
    color: "#777",
    fontSize: "14px",
    marginBottom: "8px",
  },

  cardValue: {
    fontSize: "25px",
    fontWeight: "700",
  },

  filterBox: {
    background: "#fff",
    padding: "18px",
    borderRadius: "12px",
    display: "grid",
    gridTemplateColumns:
      "2fr 1fr",
    gap: "15px",
    marginBottom: "20px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.06)",
  },

  input: {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #ddd",
    borderRadius: "7px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },

  tableWrapper: {
    background: "#fff",
    borderRadius: "12px",
    overflowX: "auto",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.06)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1250px",
  },

  th: {
    background: "#f2f3f6",
    padding: "13px 12px",
    textAlign: "left",
    fontSize: "13px",
    borderBottom: "1px solid #ddd",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "13px 12px",
    borderBottom: "1px solid #eee",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },

  stockNumber: {
    fontSize: "16px",
  },

  badge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
  },

  availableBadge: {
    background: "#e8f7ee",
    color: "#178044",
  },

  lowBadge: {
    background: "#fff3cd",
    color: "#9a6700",
  },

  outBadge: {
    background: "#ffe5e5",
    color: "#b42318",
  },

  actions: {
    display: "flex",
    gap: "7px",
  },

  stockButton: {
    border: "none",
    background: "#111827",
    color: "#fff",
    padding: "8px 11px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },

  historyButton: {
    border: "1px solid #ddd",
    background: "#fff",
    color: "#333",
    padding: "8px 11px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },

  empty: {
    padding: "50px",
    textAlign: "center",
    color: "#777",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },

  modal: {
    background: "#fff",
    borderRadius: "14px",
    padding: "25px",
    width: "550px",
    maxWidth: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow:
      "0 10px 40px rgba(0,0,0,0.2)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "22px",
  },

  modalSubtitle: {
    margin: "5px 0 0",
    color: "#777",
    fontSize: "13px",
  },

  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: "28px",
    cursor: "pointer",
    lineHeight: 1,
  },

  currentStockBox: {
    background: "#f5f6f8",
    padding: "15px",
    borderRadius: "8px",
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "15px",
    marginBottom: "20px",
  },

  formGroup: {
    marginBottom: "17px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontSize: "13px",
    fontWeight: "600",
  },

  helpText: {
    display: "block",
    marginTop: "5px",
    color: "#777",
    fontSize: "11px",
  },

  weightGrid: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "15px",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "25px",
  },

  cancelButton: {
    border: "1px solid #ddd",
    background: "#fff",
    padding: "10px 18px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  submitButton: {
    border: "none",
    background: "#111827",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  historyTableWrapper: {
    overflowX: "auto",
  },
};