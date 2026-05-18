"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAdminProducts } from "@/lib/adminApi";

export default function AdminProductsTable() {
  const [products, setProducts] = useState<
    Awaited<ReturnType<typeof fetchAdminProducts>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminProducts()
      .then(setProducts)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load products"),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm font-light text-zinc-500">Loading products…</p>;
  if (error) return <p className="text-sm font-light text-red-700">{error}</p>;

  return (
    <div className="overflow-x-auto border border-zinc-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm font-light">
        <thead className="border-b border-zinc-100 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          <tr>
            <th className="px-5 py-3 font-normal">Product</th>
            <th className="px-5 py-3 font-normal">SKU</th>
            <th className="px-5 py-3 font-normal">Category</th>
            <th className="px-5 py-3 font-normal">Price</th>
            <th className="px-5 py-3 font-normal">Status</th>
            <th className="px-5 py-3 font-normal">Store</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="px-5 py-4 text-zinc-900">{product.name}</td>
              <td className="px-5 py-4 text-zinc-600">{product.sku}</td>
              <td className="px-5 py-4 capitalize text-zinc-700">{product.category}</td>
              <td className="px-5 py-4 text-zinc-900">{product.price}</td>
              <td className="px-5 py-4">
                <span
                  className={`text-[10px] uppercase tracking-[0.14em] ${
                    product.isActive ? "text-emerald-700" : "text-zinc-400"
                  }`}
                >
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-5 py-4">
                <Link
                  href={`/products/${product.slug}`}
                  className="text-[10px] uppercase tracking-[0.14em] text-zinc-600 hover:text-zinc-900"
                >
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
