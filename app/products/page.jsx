"use client";

import { useEffect, useState } from "react";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);

  const [form, setForm] = useState({
    barcode: "",
    name: "",
    categoryId: "",
    jewelleryType: "",
    karat: "",
    purity: "",
    grossWeight: "",
    stoneWeight: "",
    netWeight: "",
    wastagePercent: "",
    makingCharge: "",
    stoneCharge: "",
    purchasePrice: "",
    sellingPrice: "",
    stockQuantity: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ==========================================
  // LOAD CATEGORIES
  // ==========================================

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();

      if (response.ok) {
        setCategories(data);
      }
    } catch (error) {
      console.error("Category Load Error:", error);
    }
  };

  // ==========================================
  // LOAD PRODUCTS
  // ==========================================

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();

      if (response.ok) {
        setProducts(data);
      }
    } catch (error) {
      console.error("Product Load Error:", error);
    }
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  // ==========================================
  // AUTO PRODUCT CODE
  // ==========================================

  const nextProductNumber =
    products.length > 0
      ? Math.max(...products.map((product) => product.id)) + 1
      : 1;

  const nextProductCode = `PRD-${String(nextProductNumber).padStart(
    6,
    "0"
  )}`;

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // GENERATE BARCODE
  // ==========================================

  const generateBarcode = () => {
    const barcode = Math.floor(
      1000000000000 + Math.random() * 9000000000000
    ).toString();

    setForm((previous) => ({
      ...previous,
      barcode,
    }));

    setMessage("New barcode generated.");
  };

  // ==========================================
  // SUBMIT PRODUCT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!form.name.trim()) {
      setMessage("Product Name is required.");
      return;
    }

    if (!form.categoryId) {
      setMessage("Please select a category.");
      return;
    }

    if (!form.barcode) {
      setMessage("Please generate barcode.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to save product.");
        return;
      }

      setMessage(
        `Product added successfully. Product Code: ${data.productCode}`
      );

      resetForm();

      await loadProducts();
    } catch (error) {
      console.error("Product Save Error:", error);
      setMessage("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setForm({
      barcode: "",
      name: "",
      categoryId: "",
      jewelleryType: "",
      karat: "",
      purity: "",
      grossWeight: "",
      stoneWeight: "",
      netWeight: "",
      wastagePercent: "",
      makingCharge: "",
      stoneCharge: "",
      purchasePrice: "",
      sellingPrice: "",
      stockQuantity: "",
    });
  };

  // ==========================================
  // OPEN EDIT
  // ==========================================

  const handleEdit = (product) => {
    setEditingProduct(product);

    setForm({
      barcode: product.barcode || "",
      name: product.name || "",
      categoryId: product.categoryId
        ? String(product.categoryId)
        : "",
      jewelleryType: product.jewelleryType || "",
      karat: product.karat || "",
      purity: product.purity?.toString() || "",
      grossWeight: product.grossWeight?.toString() || "",
      stoneWeight: product.stoneWeight?.toString() || "",
      netWeight: product.netWeight?.toString() || "",
      wastagePercent:
        product.wastagePercent?.toString() || "",
      makingCharge:
        product.makingCharge?.toString() || "",
      stoneCharge:
        product.stoneCharge?.toString() || "",
      purchasePrice:
        product.purchasePrice?.toString() || "",
      sellingPrice:
        product.sellingPrice?.toString() || "",
      stockQuantity:
        product.stockQuantity?.toString() || "",
    });

    setMessage("");
  };

  // ==========================================
  // UPDATE PRODUCT
  // ==========================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!form.name.trim()) {
      setMessage("Product Name is required.");
      return;
    }

    if (!form.categoryId) {
      setMessage("Please select a category.");
      return;
    }

    if (!form.barcode) {
      setMessage("Barcode is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingProduct.id,
          ...form,
          status: editingProduct.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Failed to update product."
        );
        return;
      }

      setMessage("Product updated successfully.");

      setEditingProduct(null);
      resetForm();

      await loadProducts();
    } catch (error) {
      console.error("Product Update Error:", error);
      setMessage("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // DELETE PRODUCT
  // ==========================================

  const handleDelete = async () => {
    if (!deleteProduct) return;

    setLoading(true);

    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: deleteProduct.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Failed to delete product."
        );
        return;
      }

      setMessage("Product deleted successfully.");

      setDeleteProduct(null);

      await loadProducts();
    } catch (error) {
      console.error("Product Delete Error:", error);
      setMessage("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FILTER PRODUCTS
  // ==========================================

  const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      product.name?.toLowerCase().includes(searchText) ||
      product.productCode
        ?.toLowerCase()
        .includes(searchText) ||
      product.barcode
        ?.toLowerCase()
        .includes(searchText);

    const matchesCategory =
      !filterCategory ||
      product.categoryId?.toString() === filterCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* ==========================================
            PAGE HEADER
        ========================================== */}

        <h1
          style={{
            fontSize: "32px",
            marginBottom: "8px",
          }}
        >
          Product Management
        </h1>

        <p
          style={{
            color: "#777",
            marginBottom: "30px",
          }}
        >
          Manage jewellery products and inventory.
        </p>

        {/* ==========================================
            ADD PRODUCT
        ========================================== */}

        <section
          style={{
            background: "#fff",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid #e5e5e5",
            marginBottom: "30px",
          }}
        >
          <h2
            style={{
              marginBottom: "20px",
            }}
          >
            Add Product
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={gridStyle}>
              {/* PRODUCT CODE */}

              <div>
                <label style={labelStyle}>
                  Product Code
                </label>

                <input
                  type="text"
                  value={nextProductCode}
                  readOnly
                  style={{
                    ...inputStyle,
                    background: "#f3f3f3",
                    fontWeight: "600",
                    color: "#333",
                  }}
                />

                <small
                  style={{
                    display: "block",
                    marginTop: "5px",
                    color: "#777",
                  }}
                >
                  Auto generated
                </small>
              </div>

              {/* BARCODE */}

              <div>
                <label style={labelStyle}>
                  Barcode
                </label>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <input
                    type="text"
                    name="barcode"
                    value={form.barcode}
                    onChange={handleChange}
                    placeholder="Scan or generate barcode"
                    style={{
                      ...inputStyle,
                      flex: 1,
                    }}
                  />

                  <button
                    type="button"
                    onClick={generateBarcode}
                    style={barcodeButtonStyle}
                  >
                    Generate
                  </button>
                </div>
              </div>

              <InputField
                label="Product Name *"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Gold Ring"
              />

              {/* CATEGORY */}

              <div>
                <label style={labelStyle}>
                  Category *
                </label>

                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">
                    Select Category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <InputField
                label="Jewellery Type"
                name="jewelleryType"
                value={form.jewelleryType}
                onChange={handleChange}
                placeholder="Ring / Chain / Necklace"
              />

              <InputField
                label="Karat"
                name="karat"
                value={form.karat}
                onChange={handleChange}
                placeholder="22K"
              />

              <InputField
                label="Purity"
                name="purity"
                type="number"
                step="0.001"
                value={form.purity}
                onChange={handleChange}
                placeholder="91.600"
              />

              <InputField
                label="Gross Weight"
                name="grossWeight"
                type="number"
                step="0.001"
                value={form.grossWeight}
                onChange={handleChange}
                placeholder="0.000"
              />

              <InputField
                label="Stone Weight"
                name="stoneWeight"
                type="number"
                step="0.001"
                value={form.stoneWeight}
                onChange={handleChange}
                placeholder="0.000"
              />

              <InputField
                label="Net Weight"
                name="netWeight"
                type="number"
                step="0.001"
                value={form.netWeight}
                onChange={handleChange}
                placeholder="0.000"
              />

              <InputField
                label="Wastage %"
                name="wastagePercent"
                type="number"
                step="0.001"
                value={form.wastagePercent}
                onChange={handleChange}
                placeholder="0"
              />

              <InputField
                label="Making Charge"
                name="makingCharge"
                type="number"
                step="0.01"
                value={form.makingCharge}
                onChange={handleChange}
                placeholder="0.00"
              />

              <InputField
                label="Stone Charge"
                name="stoneCharge"
                type="number"
                step="0.01"
                value={form.stoneCharge}
                onChange={handleChange}
                placeholder="0.00"
              />

              <InputField
                label="Purchase Price"
                name="purchasePrice"
                type="number"
                step="0.01"
                value={form.purchasePrice}
                onChange={handleChange}
                placeholder="0.00"
              />

              <InputField
                label="Selling Price"
                name="sellingPrice"
                type="number"
                step="0.01"
                value={form.sellingPrice}
                onChange={handleChange}
                placeholder="0.00"
              />

              <InputField
                label="Stock Quantity"
                name="stockQuantity"
                type="number"
                value={form.stockQuantity}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            {/* MESSAGE */}

            {message && (
              <p
                style={{
                  marginTop: "20px",
                  padding: "12px",
                  background: "#f5f5f5",
                  borderRadius: "7px",
                  color: "#333",
                }}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Saving..." : "Save Product"}
            </button>
          </form>
        </section>

        {/* ==========================================
            PRODUCT LIST
        ========================================== */}

        <section
          style={{
            background: "#fff",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid #e5e5e5",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2>Product List</h2>

            <span
              style={{
                background: "#f1f1f1",
                padding: "8px 14px",
                borderRadius: "20px",
              }}
            >
              Total: {filteredProducts.length}
            </span>
          </div>

          {/* SEARCH + FILTER */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "15px",
              marginBottom: "25px",
            }}
          >
            <input
              type="text"
              placeholder="Search by product name, code or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchInputStyle}
            />

            <select
              value={filterCategory}
              onChange={(e) =>
                setFilterCategory(e.target.value)
              }
              style={searchInputStyle}
            >
              <option value="">
                All Categories
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* EMPTY */}

          {filteredProducts.length === 0 ? (
            <p
              style={{
                color: "#888",
              }}
            >
              No products found.
            </p>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "1450px",
                }}
              >
                <thead>
                  <tr>
                    <TableHeader>ID</TableHeader>
                    <TableHeader>Code</TableHeader>
                    <TableHeader>Barcode</TableHeader>
                    <TableHeader>Product</TableHeader>
                    <TableHeader>Category</TableHeader>
                    <TableHeader>Karat</TableHeader>
                    <TableHeader>Gross Weight</TableHeader>
                    <TableHeader>Net Weight</TableHeader>
                    <TableHeader>Purchase</TableHeader>
                    <TableHeader>Selling</TableHeader>
                    <TableHeader>Stock</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <TableCell>
                        {product.id}
                      </TableCell>

                      <TableCell>
                        <strong>
                          {product.productCode}
                        </strong>
                      </TableCell>

                      <TableCell>
                        {product.barcode || "-"}
                      </TableCell>

                      <TableCell>
                        <strong>
                          {product.name}
                        </strong>
                      </TableCell>

                      <TableCell>
                        {product.category?.name || "-"}
                      </TableCell>

                      <TableCell>
                        {product.karat || "-"}
                      </TableCell>

                      <TableCell>
                        {product.grossWeight?.toString() || "0"}
                      </TableCell>

                      <TableCell>
                        {product.netWeight?.toString() || "0"}
                      </TableCell>

                      <TableCell>
                        ৳ {product.purchasePrice?.toString() || "0"}
                      </TableCell>

                      <TableCell>
                        ৳ {product.sellingPrice?.toString() || "0"}
                      </TableCell>

                      <TableCell>
                        {product.stockQuantity}
                      </TableCell>

                      <TableCell>
                        {product.status
                          ? "Active"
                          : "Inactive"}
                      </TableCell>

                      {/* ACTIONS */}

                      <TableCell>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(product)
                            }
                            style={editButtonStyle}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteProduct(product)
                            }
                            style={deleteButtonStyle}
                          >
                            Delete
                          </button>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ==========================================
          EDIT PRODUCT MODAL
      ========================================== */}

      {editingProduct && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>
                  Edit Product
                </h2>

                <p
                  style={{
                    marginTop: "5px",
                    color: "#777",
                  }}
                >
                  {editingProduct.productCode}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  resetForm();
                  setMessage("");
                }}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div style={gridStyle}>
                <InputField
                  label="Product Code"
                  name="productCode"
                  value={editingProduct.productCode}
                  onChange={() => {}}
                  placeholder=""
                />

                <div>
                  <label style={labelStyle}>
                    Barcode *
                  </label>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="text"
                      name="barcode"
                      value={form.barcode}
                      onChange={handleChange}
                      style={{
                        ...inputStyle,
                        flex: 1,
                      }}
                    />

                    <button
                      type="button"
                      onClick={generateBarcode}
                      style={barcodeButtonStyle}
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <InputField
                  label="Product Name *"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Gold Ring"
                />

                <div>
                  <label style={labelStyle}>
                    Category *
                  </label>

                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="">
                      Select Category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <InputField
                  label="Jewellery Type"
                  name="jewelleryType"
                  value={form.jewelleryType}
                  onChange={handleChange}
                  placeholder="Ring / Chain / Necklace"
                />

                <InputField
                  label="Karat"
                  name="karat"
                  value={form.karat}
                  onChange={handleChange}
                  placeholder="22K"
                />

                <InputField
                  label="Purity"
                  name="purity"
                  type="number"
                  step="0.001"
                  value={form.purity}
                  onChange={handleChange}
                  placeholder="91.600"
                />

                <InputField
                  label="Gross Weight"
                  name="grossWeight"
                  type="number"
                  step="0.001"
                  value={form.grossWeight}
                  onChange={handleChange}
                  placeholder="0.000"
                />

                <InputField
                  label="Stone Weight"
                  name="stoneWeight"
                  type="number"
                  step="0.001"
                  value={form.stoneWeight}
                  onChange={handleChange}
                  placeholder="0.000"
                />

                <InputField
                  label="Net Weight"
                  name="netWeight"
                  type="number"
                  step="0.001"
                  value={form.netWeight}
                  onChange={handleChange}
                  placeholder="0.000"
                />

                <InputField
                  label="Wastage %"
                  name="wastagePercent"
                  type="number"
                  step="0.001"
                  value={form.wastagePercent}
                  onChange={handleChange}
                  placeholder="0"
                />

                <InputField
                  label="Making Charge"
                  name="makingCharge"
                  type="number"
                  step="0.01"
                  value={form.makingCharge}
                  onChange={handleChange}
                  placeholder="0.00"
                />

                <InputField
                  label="Stone Charge"
                  name="stoneCharge"
                  type="number"
                  step="0.01"
                  value={form.stoneCharge}
                  onChange={handleChange}
                  placeholder="0.00"
                />

                <InputField
                  label="Purchase Price"
                  name="purchasePrice"
                  type="number"
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                />

                <InputField
                  label="Selling Price"
                  name="sellingPrice"
                  type="number"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                />

                <InputField
                  label="Stock Quantity"
                  name="stockQuantity"
                  type="number"
                  value={form.stockQuantity}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              {message && (
                <p
                  style={{
                    marginTop: "20px",
                    padding: "12px",
                    background: "#f5f5f5",
                    borderRadius: "7px",
                    color: "#333",
                  }}
                >
                  {message}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    resetForm();
                    setMessage("");
                  }}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  style={buttonStyle}
                >
                  {loading
                    ? "Updating..."
                    : "Update Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          DELETE CONFIRMATION
      ========================================== */}

      {deleteProduct && (
        <div style={overlayStyle}>
          <div
            style={{
              ...modalStyle,
              maxWidth: "450px",
            }}
          >
            <h2>Delete Product?</h2>

            <p
              style={{
                color: "#666",
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to delete{" "}
              <strong>
                {deleteProduct.name}
              </strong>
              ?
              <br />
              Product Code:{" "}
              <strong>
                {deleteProduct.productCode}
              </strong>
            </p>

            <p
              style={{
                color: "#b00020",
                fontSize: "14px",
              }}
            >
              This action cannot be undone.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "25px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setDeleteProduct(null)
                }
                style={cancelButtonStyle}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                style={deleteConfirmButtonStyle}
              >
                {loading
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ==========================================
// INPUT FIELD
// ==========================================

function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  step,
  placeholder,
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

// ==========================================
// TABLE HEADER
// ==========================================

function TableHeader({ children }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "13px 12px",
        background: "#f7f7f7",
        borderBottom: "1px solid #ddd",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

// ==========================================
// TABLE CELL
// ==========================================

function TableCell({ children }) {
  return (
    <td
      style={{
        padding: "13px 12px",
        borderBottom: "1px solid #eee",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </td>
  );
}

// ==========================================
// STYLES
// ==========================================

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "20px",
};

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  fontWeight: "600",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #ddd",
  borderRadius: "7px",
  fontSize: "15px",
  boxSizing: "border-box",
};

const searchInputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #ddd",
  borderRadius: "7px",
  fontSize: "15px",
  boxSizing: "border-box",
};

const buttonStyle = {
  marginTop: "20px",
  padding: "13px 28px",
  background: "#111",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  cursor: "pointer",
};

const barcodeButtonStyle = {
  padding: "0 16px",
  background: "#333",
  color: "#fff",
  border: "none",
  borderRadius: "7px",
  fontSize: "14px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const editButtonStyle = {
  padding: "7px 13px",
  background: "#f1f1f1",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
};

const deleteButtonStyle = {
  padding: "7px 13px",
  background: "#fff",
  color: "#b00020",
  border: "1px solid #e0b0b8",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 1000,
};

const modalStyle = {
  background: "#fff",
  width: "100%",
  maxWidth: "900px",
  maxHeight: "90vh",
  overflowY: "auto",
  borderRadius: "14px",
  padding: "28px",
  boxSizing: "border-box",
};

const closeButtonStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  border: "1px solid #ddd",
  background: "#fff",
  fontSize: "24px",
  cursor: "pointer",
  lineHeight: "30px",
};

const cancelButtonStyle = {
  padding: "12px 22px",
  background: "#f1f1f1",
  color: "#333",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "15px",
};

const deleteConfirmButtonStyle = {
  padding: "12px 22px",
  background: "#b00020",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "15px",
};