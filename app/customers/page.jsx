"use client";

import { useEffect, useMemo, useState } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    openingDue: "",
    openingAdvance: "",
    status: true,
  });

  // =====================================================
  // FETCH CUSTOMERS
  // =====================================================

  async function fetchCustomers() {
    try {
      setLoading(true);

      const response = await fetch("/api/customers");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch customers."
        );
      }

      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  // =====================================================
  // FORM HANDLER
  // =====================================================

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // =====================================================
  // OPEN ADD MODAL
  // =====================================================

  function openAddModal() {
    setEditingCustomer(null);

    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      openingDue: "",
      openingAdvance: "",
      status: true,
    });

    setShowModal(true);
  }

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  function openEditModal(customer) {
    setEditingCustomer(customer);

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      openingDue:
        customer.openingDue !== undefined &&
        customer.openingDue !== null
          ? customer.openingDue
          : "",
      openingAdvance:
        customer.openingAdvance !== undefined &&
        customer.openingAdvance !== null
          ? customer.openingAdvance
          : "",
      status: Boolean(customer.status),
    });

    setShowModal(true);
  }

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingCustomer(null);
  }

  // =====================================================
  // SUBMIT FORM
  // =====================================================

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Customer name is required.");
      return;
    }

    const due = Number(form.openingDue || 0);
    const advance = Number(form.openingAdvance || 0);

    if (due < 0) {
      alert("Opening due cannot be negative.");
      return;
    }

    if (advance < 0) {
      alert("Opening advance cannot be negative.");
      return;
    }

    if (due > 0 && advance > 0) {
      alert(
        "Opening Due এবং Opening Advance একসাথে দেওয়া যাবে না."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        openingDue: due,
        openingAdvance: advance,
        status: form.status,
      };

      if (editingCustomer) {
        payload.id = editingCustomer.id;
      }

      const response = await fetch("/api/customers", {
        method: editingCustomer ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Something went wrong."
        );
      }

      alert(
        editingCustomer
          ? "Customer updated successfully."
          : "Customer created successfully."
      );

      setShowModal(false);
      setEditingCustomer(null);

      await fetchCustomers();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // DELETE CUSTOMER
  // =====================================================

  async function handleDelete(customer) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${customer.name}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/customers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: customer.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete customer."
        );
      }

      alert("Customer deleted successfully.");

      await fetchCustomers();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  // =====================================================
  // FILTER CUSTOMERS
  // =====================================================

  const filteredCustomers = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !searchText ||
        customer.name
          ?.toLowerCase()
          .includes(searchText) ||
        customer.customerCode
          ?.toLowerCase()
          .includes(searchText) ||
        customer.phone
          ?.toLowerCase()
          .includes(searchText) ||
        customer.email
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          customer.status === true) ||
        (statusFilter === "INACTIVE" &&
          customer.status === false);

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const summary = useMemo(() => {
    const totalCustomers = customers.length;

    const activeCustomers = customers.filter(
      (customer) => customer.status === true
    ).length;

    const totalDue = customers.reduce(
      (sum, customer) =>
        sum + Number(customer.dueBalance || 0),
      0
    );

    const totalAdvance = customers.reduce(
      (sum, customer) =>
        sum + Number(customer.advanceBalance || 0),
      0
    );

    return {
      totalCustomers,
      activeCustomers,
      totalDue,
      totalAdvance,
    };
  }, [customers]);

  // =====================================================
  // MONEY FORMAT
  // =====================================================

  function formatMoney(value) {
    return Number(value || 0).toLocaleString(
      "en-BD",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage customers, opening balances and account status.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          + Add Customer
        </button>
      </div>

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Customers */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Customers
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {summary.totalCustomers}
          </h2>
        </div>

        {/* Active Customers */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Active Customers
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {summary.activeCustomers}
          </h2>
        </div>

        {/* Total Due */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Due
          </p>

          <h2 className="mt-2 text-2xl font-bold text-red-600">
            ৳ {formatMoney(summary.totalDue)}
          </h2>
        </div>

        {/* Total Advance */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Advance
          </p>

          <h2 className="mt-2 text-2xl font-bold text-green-600">
            ৳ {formatMoney(summary.totalAdvance)}
          </h2>
        </div>
      </div>

      {/* =================================================
          SEARCH / FILTER
      ================================================= */}

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by customer name, code, phone or email..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
            >
              <option value="ALL">
                All Status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-5 py-4 font-semibold text-gray-700">
                  Code
                </th>

                <th className="px-5 py-4 font-semibold text-gray-700">
                  Customer
                </th>

                <th className="px-5 py-4 font-semibold text-gray-700">
                  Phone
                </th>

                <th className="px-5 py-4 text-right font-semibold text-gray-700">
                  Opening Due
                </th>

                <th className="px-5 py-4 text-right font-semibold text-gray-700">
                  Opening Advance
                </th>

                <th className="px-5 py-4 text-right font-semibold text-gray-700">
                  Current Due
                </th>

                <th className="px-5 py-4 text-right font-semibold text-gray-700">
                  Advance
                </th>

                <th className="px-5 py-4 text-center font-semibold text-gray-700">
                  Status
                </th>

                <th className="px-5 py-4 text-center font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(
                  (customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* Code */}

                      <td className="px-5 py-4 font-medium text-gray-900">
                        {customer.customerCode}
                      </td>

                      {/* Customer */}

                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {customer.name}
                          </p>

                          {customer.email && (
                            <p className="mt-1 text-xs text-gray-500">
                              {customer.email}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Phone */}

                      <td className="px-5 py-4 text-gray-600">
                        {customer.phone || "-"}
                      </td>

                      {/* Opening Due */}

                      <td className="px-5 py-4 text-right font-medium text-red-600">
                        ৳{" "}
                        {formatMoney(
                          customer.openingDue
                        )}
                      </td>

                      {/* Opening Advance */}

                      <td className="px-5 py-4 text-right font-medium text-green-600">
                        ৳{" "}
                        {formatMoney(
                          customer.openingAdvance
                        )}
                      </td>

                      {/* Current Due */}

                      <td className="px-5 py-4 text-right font-semibold text-red-600">
                        ৳{" "}
                        {formatMoney(
                          customer.dueBalance
                        )}
                      </td>

                      {/* Advance */}

                      <td className="px-5 py-4 text-right font-semibold text-green-600">
                        ৳{" "}
                        {formatMoney(
                          customer.advanceBalance
                        )}
                      </td>

                      {/* Status */}

                      <td className="px-5 py-4 text-center">
                        {customer.status ? (
                          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              openEditModal(
                                customer
                              )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                customer
                              )
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCustomer
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter customer information below.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Name */}

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Customer Name
                    <span className="text-red-500">
                      {" "}
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    required
                  />
                </div>

                {/* Phone */}

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
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                  />
                </div>

                {/* Email */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="customer@email.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                  />
                </div>

                {/* Address */}

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter customer address"
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                  />
                </div>

                {/* Opening Due */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Opening Due
                  </label>

                  <input
                    type="number"
                    name="openingDue"
                    value={form.openingDue}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        openingDue:
                          e.target.value,
                        openingAdvance:
                          e.target.value
                            ? ""
                            : prev.openingAdvance,
                      }));
                    }}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Customer owes us this amount.
                  </p>
                </div>

                {/* Opening Advance */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Opening Advance
                  </label>

                  <input
                    type="number"
                    name="openingAdvance"
                    value={form.openingAdvance}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        openingAdvance:
                          e.target.value,
                        openingDue:
                          e.target.value
                            ? ""
                            : prev.openingDue,
                      }));
                    }}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Customer has advance balance.
                  </p>
                </div>

                {/* Status */}

                <div className="md:col-span-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <input
                      type="checkbox"
                      name="status"
                      checked={form.status}
                      onChange={handleChange}
                      className="h-4 w-4"
                    />

                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Active Customer
                      </p>

                      <p className="text-xs text-gray-500">
                        Inactive customers can remain in the database but
                        won't normally be used for new transactions.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Footer */}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingCustomer
                    ? "Update Customer"
                    : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}