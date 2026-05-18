"use client";

import { useEffect, useState } from "react";
import { fetchAdminCustomers } from "@/lib/adminApi";

export default function AdminCustomersTable() {
  const [customers, setCustomers] = useState<
    Awaited<ReturnType<typeof fetchAdminCustomers>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminCustomers()
      .then(setCustomers)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load customers"),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm font-light text-zinc-500">Loading customers…</p>;
  if (error) return <p className="text-sm font-light text-red-700">{error}</p>;

  if (customers.length === 0) {
    return <p className="text-sm font-light text-zinc-600">No customers found.</p>;
  }

  return (
    <div className="overflow-x-auto border border-zinc-200 bg-white">
      <table className="w-full min-w-[560px] text-left text-sm font-light">
        <thead className="border-b border-zinc-100 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          <tr>
            <th className="px-5 py-3 font-normal">Name</th>
            <th className="px-5 py-3 font-normal">Phone</th>
            <th className="px-5 py-3 font-normal">Email</th>
            <th className="px-5 py-3 font-normal">Orders</th>
            <th className="px-5 py-3 font-normal">Addresses</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td className="px-5 py-4 text-zinc-900">{customer.name ?? "—"}</td>
              <td className="px-5 py-4 text-zinc-700">{customer.phone}</td>
              <td className="px-5 py-4 text-zinc-600">{customer.email ?? "—"}</td>
              <td className="px-5 py-4 text-zinc-700">{customer.orderCount}</td>
              <td className="px-5 py-4 text-zinc-700">{customer.addressCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
