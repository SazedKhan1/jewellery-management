"use client";

import { useEffect, useMemo, useState } from "react";

export default function PurchasesPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [discount, setDiscount] = useState("");
  const [vat, setVat] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [note, setNote] = useState("");

  const [items, setItems] = useState([]);

  const [itemForm, setItemForm] = useState({
    productId: "",
    quantity: 1,
    grossWeight: "",
    stoneWeight: "",
    netWeight: "",
    karat: "",
    rate: "",
    makingCharge: "",
    stoneCharge: "",
  });

  // ==========================================
  // LOAD SUPPLIERS + PRODUCTS
  // ==========================================
  useEffect(() => {
    const loadData = async () => {
      try {
        setPageLoading(true);

        const [supplierRes, productRes] = await Promise.all([
          fetch("/api/suppliers"),
          fetch("/api/products"),
        ]);

        const supplierData = await supplierRes.json();
        const productData = await productRes.json();

        if (supplierRes.ok) {
          setSuppliers(
            supplierData.filter((supplier) => supplier.status)
          );
        }

        if (productRes.ok) {
          setProducts(
            Array.isArray(productData)
              ? productData.filter((product) => product.status)
              : []
          );
        }
      } catch (error) {
        console.error(error);
        alert("Failed to load purchase data.");
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, []);

  // ==========================================
  // SELECT PRODUCT
  // ==========================================
  const handleProductChange = (e) => {
    const productId = e.target.value;

    const product = products.find(
      (item) => String(item.id) === String(productId)
    );

    setItemForm((prev) => ({
      ...prev,
      productId,
      karat: product?.karat || "",
    }));
  };

  // ==========================================
  // ITEM FORM CHANGE
  // ==========================================
  const handleItemChange = (e) => {
    const { name, value } = e.target;

    setItemForm((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === "grossWeight" || name === "stoneWeight") {
        const gross =
          name === "grossWeight"
            ? Number(value) || 0
            : Number(prev.grossWeight) || 0;

        const stone =
          name === "stoneWeight"
            ? Number(value) || 0
            : Number(prev.stoneWeight) || 0;

        updated.netWeight = Math.max(gross - stone, 0).toFixed(3);
      }

      return updated;
    });
  };

  // ==========================================
  // ADD ITEM
  // ==========================================
  const addItem = () => {
    if (!itemForm.productId) {
      alert("Please select a product.");
      return;
    }

    const quantity = Number(itemForm.quantity) || 0;

    if (quantity <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    const grossWeight = Number(itemForm.grossWeight) || 0;
    const stoneWeight = Number(itemForm.stoneWeight) || 0;
    const netWeight = Number(itemForm.netWeight) || 0;

    if (stoneWeight > grossWeight) {
      alert("Stone weight cannot be greater than gross weight.");
      return;
    }

    const rate = Number(itemForm.rate) || 0;
    const makingCharge = Number(itemForm.makingCharge) || 0;
    const stoneCharge = Number(itemForm.stoneCharge) || 0;

    const metalAmount = netWeight * rate;

    const totalAmount =
      metalAmount + makingCharge + stoneCharge;

    const product = products.find(
      (item) => String(item.id) === String(itemForm.productId)
    );

    const newItem = {
      ...itemForm,

      quantity,

      grossWeight,
      stoneWeight,
      netWeight,

      rate,
      makingCharge,
      stoneCharge,

      totalAmount,

      productName: product?.name || "",
      productCode: product?.productCode || "",
      categoryName: product?.category?.name || "",
    };

    setItems((prev) => [...prev, newItem]);

    setItemForm({
      productId: "",
      quantity: 1,
      grossWeight: "",
      stoneWeight: "",
      netWeight: "",
      karat: "",
      rate: "",
      makingCharge: "",
      stoneCharge: "",
    });
  };

  // ==========================================
  // REMOVE ITEM
  // ==========================================
  const removeItem = (index) => {
    setItems((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  // ==========================================
  // CALCULATIONS
  // ==========================================
  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0
    );
  }, [items]);

  const discountAmount = Number(discount) || 0;
  const vatAmount = Number(vat) || 0;
  const paid = Number(paidAmount) || 0;

  const totalAmount =
    subtotal - discountAmount + vatAmount;

  const dueAmount = Math.max(totalAmount - paid, 0);

  // ==========================================
  // RESET FORM
  // ==========================================
  const resetForm = () => {
    setSupplierId("");
    setPurchaseDate(
      new Date().toISOString().split("T")[0]
    );
    setDiscount("");
    setVat("");
    setPaidAmount("");
    setNote("");
    setItems([]);

    setItemForm({
      productId: "",
      quantity: 1,
      grossWeight: "",
      stoneWeight: "",
      netWeight: "",
      karat: "",
      rate: "",
      makingCharge: "",
      stoneCharge: "",
    });
  };

  // ==========================================
  // SAVE PURCHASE
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!supplierId) {
      alert("Please select a supplier.");
      return;
    }

    if (items.length === 0) {
      alert("Please add at least one product.");
      return;
    }

    if (paid > totalAmount) {
      alert("Paid amount cannot be greater than total amount.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        supplierId: Number(supplierId),
        purchaseDate,
        discount: discountAmount,
        vat: vatAmount,
        paidAmount: paid,
        note,

        items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),

          grossWeight: Number(item.grossWeight),
          stoneWeight: Number(item.stoneWeight),
          netWeight: Number(item.netWeight),

          karat: item.karat,

          rate: Number(item.rate),
          makingCharge: Number(item.makingCharge),
          stoneCharge: Number(item.stoneCharge),
        })),
      };

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to create purchase.");
        return;
      }

      alert(
        `Purchase ${data.data.purchaseNo} created successfully.`
      );

      resetForm();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
          <p className="text-sm text-gray-500">
            Loading purchase module...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-4 py-5 sm:px-6 lg:px-8">

      {/* ==========================================
          HEADER
      ========================================== */}
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gray-900" />

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
              Purchase Management
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Purchase Entry
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Record jewellery purchases and automatically update stock.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Purchase Date
          </p>

          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="mt-1 border-0 p-0 text-sm font-semibold text-gray-800 outline-none"
          />
        </div>

      </div>

      <form onSubmit={handleSubmit}>

        {/* ==========================================
            SUPPLIER SECTION
        ========================================== */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-bold text-gray-900">
              Purchase Information
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Select supplier and purchase details.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Supplier *
              </label>

              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-500 focus:bg-white"
                required
              >
                <option value="">Select Supplier</option>

                {suppliers.map((supplier) => (
                  <option
                    key={supplier.id}
                    value={supplier.id}
                  >
                    {supplier.name} — {supplier.supplierCode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Purchase Date
              </label>

              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-500 focus:bg-white"
              />
            </div>

          </div>
        </div>

        {/* ==========================================
            ADD PRODUCT SECTION
        ========================================== */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 px-5 py-4">

            <h2 className="text-sm font-bold text-gray-900">
              Add Purchase Item
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Add products with jewellery weight and pricing details.
            </p>

          </div>

          <div className="p-5">

            {/* PRODUCT + BASIC */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

              {/* PRODUCT */}
              <div className="xl:col-span-2">

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Product *
                </label>

                <select
                  name="productId"
                  value={itemForm.productId}
                  onChange={handleProductChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-500 focus:bg-white"
                >
                  <option value="">Select Product</option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name} — {product.productCode}
                    </option>
                  ))}
                </select>

              </div>

              {/* QUANTITY */}
              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  name="quantity"
                  value={itemForm.quantity}
                  onChange={handleItemChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:bg-white"
                />

              </div>

              {/* KARAT */}
              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Karat
                </label>

                <input
                  type="text"
                  name="karat"
                  value={itemForm.karat}
                  onChange={handleItemChange}
                  placeholder="22K"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:bg-white"
                />

              </div>

            </div>

            {/* WEIGHT */}
            <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">

              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                Weight Information
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-500">
                    Gross Weight (g)
                  </label>

                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    name="grossWeight"
                    value={itemForm.grossWeight}
                    onChange={handleItemChange}
                    placeholder="0.000"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-500">
                    Stone Weight (g)
                  </label>

                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    name="stoneWeight"
                    value={itemForm.stoneWeight}
                    onChange={handleItemChange}
                    placeholder="0.000"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-500">
                    Net Weight (g)
                  </label>

                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    name="netWeight"
                    value={itemForm.netWeight}
                    onChange={handleItemChange}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-gray-500"
                  />
                </div>

              </div>
            </div>

            {/* PRICING */}
            <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">

              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                Pricing & Charges
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-500">
                    Rate / Gram
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      ৳
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="rate"
                      value={itemForm.rate}
                      onChange={handleItemChange}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-500">
                    Making Charge
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      ৳
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="makingCharge"
                      value={itemForm.makingCharge}
                      onChange={handleItemChange}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-500">
                    Stone Charge
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      ৳
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="stoneCharge"
                      value={itemForm.stoneCharge}
                      onChange={handleItemChange}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-gray-500"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* ADD BUTTON */}
            <div className="mt-5 flex justify-end">

              <button
                type="button"
                onClick={addItem}
                className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-black active:scale-[0.98]"
              >
                + Add Item
              </button>

            </div>

          </div>
        </div>

        {/* ==========================================
            ITEMS TABLE
        ========================================== */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 px-5 py-4">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Purchase Items
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  {items.length} item(s) added
                </p>
              </div>

              <div className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                {items.length} Items
              </div>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Product
                  </th>

                  <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Qty
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Gross
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Stone
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Net
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Rate
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Making
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Stone Charge
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Total
                  </th>

                  <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {items.length === 0 ? (

                  <tr>
                    <td colSpan="10" className="px-5 py-14 text-center">

                      <div className="mx-auto max-w-sm">

                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xl text-gray-400">
                          +
                        </div>

                        <p className="text-sm font-semibold text-gray-700">
                          No purchase items added
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Select a product above and click Add Item.
                        </p>

                      </div>

                    </td>
                  </tr>

                ) : (

                  items.map((item, index) => (

                    <tr
                      key={index}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >

                      <td className="px-5 py-4">

                        <p className="text-sm font-semibold text-gray-800">
                          {item.productName}
                        </p>

                        <p className="mt-1 text-[11px] text-gray-400">
                          {item.productCode}
                          {item.karat
                            ? ` • ${item.karat}`
                            : ""}
                        </p>

                      </td>

                      <td className="px-5 py-4 text-center text-sm font-semibold">
                        {item.quantity}
                      </td>

                      <td className="px-5 py-4 text-right text-sm">
                        {Number(item.grossWeight).toFixed(3)}
                      </td>

                      <td className="px-5 py-4 text-right text-sm">
                        {Number(item.stoneWeight).toFixed(3)}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold">
                        {Number(item.netWeight).toFixed(3)}
                      </td>

                      <td className="px-5 py-4 text-right text-sm">
                        ৳ {Number(item.rate).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-right text-sm">
                        ৳ {Number(item.makingCharge).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-right text-sm">
                        ৳ {Number(item.stoneCharge).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-bold text-gray-900">
                        ৳ {Number(item.totalAmount).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-center">

                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="rounded-lg px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"
                        >
                          Remove
                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>
        </div>

        {/* ==========================================
            TOTAL + PAYMENT
        ========================================== */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

          {/* NOTES */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm xl:col-span-2">

            <div className="border-b border-gray-100 px-5 py-4">

              <h2 className="text-sm font-bold text-gray-900">
                Notes
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Add any additional purchase information.
              </p>

            </div>

            <div className="p-5">

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="6"
                placeholder="Write purchase notes..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:bg-white"
              />

            </div>

          </div>

          {/* SUMMARY */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-100 px-5 py-4">

              <h2 className="text-sm font-bold text-gray-900">
                Purchase Summary
              </h2>

            </div>

            <div className="p-5">

              <div className="space-y-4">

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-semibold text-gray-800">
                    ৳ {subtotal.toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-500">
                    Discount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-500">
                    VAT
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={vat}
                    onChange={(e) => setVat(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-500 focus:bg-white"
                  />
                </div>

                <div className="border-t border-gray-100 pt-4">

                  <div className="flex items-center justify-between">

                    <span className="text-sm font-bold text-gray-800">
                      Total Amount
                    </span>

                    <span className="text-xl font-bold text-gray-900">
                      ৳ {totalAmount.toFixed(2)}
                    </span>

                  </div>

                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-500">
                    Paid Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-500 focus:bg-white"
                  />
                </div>

                <div className="rounded-xl bg-orange-50 p-4">

                  <div className="flex items-center justify-between">

                    <span className="text-sm font-semibold text-orange-700">
                      Due Amount
                    </span>

                    <span className="text-lg font-bold text-orange-700">
                      ৳ {dueAmount.toFixed(2)}
                    </span>

                  </div>

                </div>

              </div>

              <button
                type="submit"
                disabled={loading || items.length === 0}
                className="mt-5 w-full rounded-xl bg-gray-900 py-3.5 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading
                  ? "Saving Purchase..."
                  : "Save Purchase"}
              </button>

            </div>

          </div>

        </div>

      </form>

    </div>
  );
}