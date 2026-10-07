"use client";

import { useEffect, useState } from "react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    openingDue: "",
    status: true,
  });

  // =========================
  // FETCH SUPPLIERS
  // =========================
  const fetchSuppliers = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/suppliers");
      const data = await res.json();

      if (res.ok) {
        setSuppliers(data);
      } else {
        alert(data.message || "Failed to fetch suppliers.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // =========================
  // FORM CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // =========================
  // OPEN ADD MODAL
  // =========================
  const openAddModal = () => {
    setEditingSupplier(null);

    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      openingDue: "",
      status: true,
    });

    setShowModal(true);
  };

  // =========================
  // OPEN EDIT MODAL
  // =========================
  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);

    setForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      openingDue: supplier.openingDue || "",
      status: supplier.status,
    });

    setShowModal(true);
  };

  // =========================
  // SAVE SUPPLIER
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Supplier name is required.");
      return;
    }

    try {
      setLoading(true);

      const method = editingSupplier ? "PUT" : "POST";

      const body = editingSupplier
        ? {
            id: editingSupplier.id,
            ...form,
          }
        : form;

      const res = await fetch("/api/suppliers", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Operation failed.");
        return;
      }

      alert(
        editingSupplier
          ? "Supplier updated successfully."
          : "Supplier added successfully."
      );

      setShowModal(false);
      setEditingSupplier(null);

      setForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        openingDue: "",
        status: true,
      });

      fetchSuppliers();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DELETE SUPPLIER
  // =========================
  const handleDelete = async (id) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this supplier?"
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);

      const res = await fetch("/api/suppliers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete supplier.");
        return;
      }

      alert("Supplier deleted successfully.");

      fetchSuppliers();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SEARCH
  // =========================
  const filteredSuppliers = suppliers.filter((supplier) => {
    const keyword = search.toLowerCase();

    return (
      supplier.name?.toLowerCase().includes(keyword) ||
      supplier.supplierCode?.toLowerCase().includes(keyword) ||
      supplier.phone?.toLowerCase().includes(keyword) ||
      supplier.email?.toLowerCase().includes(keyword)
    );
  });

  // =========================
  // SUMMARY
  // =========================
  const totalSuppliers = suppliers.length;

  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.status
  ).length;

  const inactiveSuppliers = suppliers.filter(
    (supplier) => !supplier.status
  ).length;

  const totalDue = suppliers.reduce(
    (sum, supplier) => sum + Number(supplier.openingDue || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* ================= HEADER ================= */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Supplier Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage suppliers, contact information and opening dues.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          + Add Supplier
        </button>

      </div>

      {/* ================= SUMMARY CARDS ================= */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Suppliers
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-800">
            {totalSuppliers}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Active Suppliers
          </p>

          <h2 className="mt-2 text-2xl font-bold text-green-600">
            {activeSuppliers}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Inactive Suppliers
          </p>

          <h2 className="mt-2 text-2xl font-bold text-red-500">
            {inactiveSuppliers}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Opening Due
          </p>

          <h2 className="mt-2 text-2xl font-bold text-orange-600">
            ৳ {totalDue.toFixed(2)}
          </h2>
        </div>

      </div>

      {/* ================= SEARCH ================= */}
      <div className="mb-5 rounded-xl border bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 md:flex-row md:items-center">

          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by supplier name, code, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div className="text-sm text-gray-500">
            {filteredSuppliers.length} supplier(s) found
          </div>

        </div>

      </div>

      {/* ================= TABLE ================= */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[950px] text-left">

            <thead className="border-b bg-gray-100">

              <tr>
                <th className="px-5 py-4 text-xs font-semibold uppercase text-gray-600">
                  Supplier
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-gray-600">
                  Code
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-gray-600">
                  Phone
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-gray-600">
                  Email
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-gray-600">
                  Opening Due
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-gray-600">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-gray-600">
                  Actions
                </th>
              </tr>

            </thead>

            <tbody className="divide-y">

              {loading && suppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Loading suppliers...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="transition hover:bg-gray-50"
                  >

                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-800">
                        {supplier.name}
                      </div>

                      {supplier.address && (
                        <div className="mt-1 max-w-[220px] truncate text-xs text-gray-500">
                          {supplier.address}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-gray-600">
                      {supplier.supplierCode}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {supplier.phone || "-"}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {supplier.email || "-"}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-orange-600">
                      ৳ {Number(supplier.openingDue || 0).toFixed(2)}
                    </td>

                    <td className="px-5 py-4">

                      {supplier.status ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          Inactive
                        </span>
                      )}

                    </td>

                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() => openEditModal(supplier)}
                          className="rounded-lg border px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingSupplier
                    ? "Edit Supplier"
                    : "Add New Supplier"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Enter supplier information below.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-2xl leading-none text-gray-400 hover:text-gray-700"
              >
                ×
              </button>

            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>

              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

                {/* NAME */}
                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Supplier Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter supplier name"
                    className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                    required
                  />

                </div>

                {/* PHONE */}
                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="01XXXXXXXXX"
                    className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                  />

                </div>

                {/* EMAIL */}
                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="supplier@example.com"
                    className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                  />

                </div>

                {/* OPENING DUE */}
                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Opening Due
                  </label>

                  <input
                    type="number"
                    name="openingDue"
                    value={form.openingDue}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                  />

                </div>

                {/* STATUS */}
                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Status
                  </label>

                  <label className="flex h-[46px] cursor-pointer items-center gap-3 rounded-lg border px-4">

                    <input
                      type="checkbox"
                      name="status"
                      checked={form.status}
                      onChange={handleChange}
                      className="h-4 w-4"
                    />

                    <span className="text-sm text-gray-700">
                      Active Supplier
                    </span>

                  </label>

                </div>

                {/* ADDRESS */}
                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter supplier address"
                    rows="3"
                    className="w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                  />

                </div>

              </div>

              {/* MODAL FOOTER */}
              <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : editingSupplier
                    ? "Update Supplier"
                    : "Save Supplier"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}