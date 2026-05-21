"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Jost } from "next/font/google";
import { useEffect, useState, type FormEvent } from "react";
import { adminLogin, fetchAdminMe } from "@/lib/adminApi";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@jewelry.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdminMe()
      .then(() => router.replace("/admin"))
      .catch(() => undefined);
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await adminLogin(email, password);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${jost.className} mx-auto max-w-md px-4`}>
      <p className="text-[10px] font-normal uppercase tracking-[0.28em] text-zinc-500">
        Wholesale Jewelry
      </p>
      <h1 className="mt-2 text-2xl font-light uppercase tracking-[0.12em] text-zinc-950">
        Admin sign in
      </h1>
      <p className="mt-3 text-sm font-light text-zinc-600">
        Use your admin credentials to manage orders, returns, and catalog.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 border border-zinc-200 bg-white p-6">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-2 w-full border border-zinc-200 px-3 py-2.5 text-sm font-light"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-2 w-full border border-zinc-200 px-3 py-2.5 text-sm font-light"
          />
        </label>

        {error ? <p className="text-sm font-light text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer border border-zinc-900 bg-zinc-900 px-4 py-3 text-[11px] font-light uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs font-light text-zinc-500">
        <Link href="/" className="hover:text-zinc-800">
          ← Back to store
        </Link>
      </p>
    </div>
  );
}
