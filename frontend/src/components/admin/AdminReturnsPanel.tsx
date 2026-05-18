"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { getStatusLabel } from "@/data/returnRequest";
import type { ReturnAdminStatus } from "@/data/returnRequest";
import {
  fetchAdminReturns,
  patchAdminReturn,
  saveAdminReturnNotes,
  updateReturnStatus,
  type AdminReturn,
} from "@/lib/adminApi";

function statusClass(status: string): string {
  const map: Record<string, string> = {
    under_review: "bg-amber-50 text-amber-800 border-amber-200",
    approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
    rejected: "bg-red-50 text-red-800 border-red-200",
    pickup_scheduled: "bg-sky-50 text-sky-800 border-sky-200",
    item_received: "bg-violet-50 text-violet-800 border-violet-200",
    refund_processed: "bg-zinc-100 text-zinc-800 border-zinc-200",
  };
  return map[status] ?? "bg-zinc-50 text-zinc-700 border-zinc-200";
}

export default function AdminReturnsPanel() {
  const [requests, setRequests] = useState<AdminReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminReturns(filter || undefined);
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load returns");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleApprove = async (id: string) => {
    setApproveError(null);
    try {
      await patchAdminReturn(id, { status: "approved" });
      await refresh();
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : "Approval failed");
    }
  };

  const handleReject = async (id: string) => {
    await patchAdminReturn(id, { status: "rejected" });
    await refresh();
  };

  const handleMarkReceived = async (id: string) => {
    setApproveError(null);
    try {
      await updateReturnStatus(id, { status: "item_received" });
      await refresh();
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : "Failed to start refund");
    }
  };

  const handleMarkRefunded = async (id: string) => {
    await updateReturnStatus(id, { status: "refund_processed" });
    await refresh();
  };

  const handleSaveNotes = async (id: string) => {
    const notes = notesDraft[id];
    if (notes === undefined) return;
    await saveAdminReturnNotes(id, notes);
    await refresh();
  };

  if (loading) {
    return <p className="text-sm font-light text-zinc-500">Loading returns…</p>;
  }

  if (error) {
    return (
      <div className="border border-amber-200 bg-amber-50/50 px-5 py-6">
        <p className="text-sm font-light text-zinc-800">{error}</p>
        <p className="mt-2 text-xs font-light text-zinc-600">
          Ensure the backend is running on localhost:4000.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {approveError ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-light text-red-900">
          {approveError}
        </p>
      ) : null}
      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            Filter by status
          </span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-1 border border-zinc-200 bg-white px-3 py-2 text-sm font-light"
          >
            <option value="">All</option>
            <option value="under_review">Under review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pickup_scheduled">Pickup scheduled</option>
            <option value="item_received">Item received</option>
            <option value="refund_processed">Refund processed</option>
          </select>
        </label>
      </div>

      <p className="text-sm font-light text-zinc-600">
        Review each request before approving. Jewellery returns are never auto-approved.
      </p>

      {requests.length === 0 ? (
        <p className="text-sm font-light text-zinc-600">
          No return requests yet. When a customer submits a return via the API, it will
          appear here.
        </p>
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => {
            const expanded = expandedId === request.id;
            const hasImages =
              request.productImageUrls.length > 0 ||
              request.packagingImageUrls.length > 0;
            const status = request.status as ReturnAdminStatus;

            return (
              <li key={request.id} className="border border-zinc-200 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedId(expanded ? null : request.id);
                    if (!expanded && !notesDraft[request.id]) {
                      setNotesDraft((prev) => ({
                        ...prev,
                        [request.id]: request.adminNotes,
                      }));
                    }
                  }}
                  className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div>
                    <p className="text-xs font-normal uppercase tracking-[0.14em] text-zinc-900">
                      {request.orderNumber} · {request.product.name}
                    </p>
                    <p className="mt-1 text-[11px] font-light text-zinc-500">
                      {request.customer.name ?? request.customer.phone} · {request.reason}
                    </p>
                  </div>
                  <span
                    className={`border px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${statusClass(request.status)}`}
                  >
                    {getStatusLabel(status)}
                  </span>
                </button>

                {expanded ? (
                  <div className="border-t border-zinc-100 px-5 py-6">
                    <dl className="grid gap-4 text-sm font-light sm:grid-cols-2">
                      <div>
                        <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                          Customer
                        </dt>
                        <dd className="mt-1 text-zinc-900">
                          {request.customer.name ?? "—"} · {request.customer.phone}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                          Return reason
                        </dt>
                        <dd className="mt-1 text-zinc-900">{request.reason}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                          Product
                        </dt>
                        <dd className="mt-1 text-zinc-900">
                          {request.product.name} · {request.product.metal} ·{" "}
                          {request.product.purity}
                          {request.product.size ? ` · Size ${request.product.size}` : ""} ·{" "}
                          {request.product.price}
                        </dd>
                      </div>
                      {request.customerNotes ? (
                        <div className="sm:col-span-2">
                          <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                            Customer notes
                          </dt>
                          <dd className="mt-1 text-zinc-800">{request.customerNotes}</dd>
                        </div>
                      ) : null}
                      <div className="sm:col-span-2">
                        <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                          Pickup address
                        </dt>
                        <dd className="mt-1 text-zinc-800">
                          {request.pickupAddress.name}, {request.pickupAddress.line1},{" "}
                          {request.pickupAddress.city} {request.pickupAddress.pincode} ·{" "}
                          {request.pickupAddress.phone}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-6">
                      <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                        Admin notes
                      </label>
                      <textarea
                        value={notesDraft[request.id] ?? request.adminNotes}
                        onChange={(e) =>
                          setNotesDraft((prev) => ({
                            ...prev,
                            [request.id]: e.target.value,
                          }))
                        }
                        rows={3}
                        className="mt-2 w-full border border-zinc-200 px-3 py-2 text-sm font-light"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveNotes(request.id)}
                        className="mt-2 cursor-pointer border border-zinc-300 px-3 py-2 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-800 hover:border-zinc-500"
                      >
                        Save notes
                      </button>
                    </div>

                    {hasImages ? (
                      <div className="mt-6">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                          Uploaded images
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {request.productImageUrls.map((url, i) => (
                            <div
                              key={`prod-${i}`}
                              className="relative h-20 w-20 overflow-hidden bg-zinc-100"
                            >
                              <Image
                                src={url}
                                alt={`Product ${i + 1}`}
                                fill
                                className="object-cover"
                                sizes="80px"
                                unoptimized
                              />
                            </div>
                          ))}
                          {request.packagingImageUrls.map((url, i) => (
                            <div
                              key={`pack-${i}`}
                              className="relative h-20 w-20 overflow-hidden bg-zinc-100"
                            >
                              <Image
                                src={url}
                                alt={`Packaging ${i + 1}`}
                                fill
                                className="object-cover"
                                sizes="80px"
                                unoptimized
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-6 text-xs font-light text-zinc-500">
                        No images uploaded for this return.
                      </p>
                    )}

                    {request.status === "under_review" ? (
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleApprove(request.id)}
                          className="cursor-pointer border border-emerald-700 bg-emerald-700 px-4 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-white hover:bg-emerald-800"
                        >
                          Approve & schedule pickup
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(request.id)}
                          className="cursor-pointer border border-zinc-300 px-4 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-800 hover:border-zinc-500"
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}

                    {request.pickupScheduledFor &&
                    (request.status === "pickup_scheduled" ||
                      request.status === "item_received" ||
                      request.status === "refund_processed") ? (
                      <p className="mt-6 text-sm font-light text-zinc-700">
                        Shiprocket reverse pickup:{" "}
                        <span className="text-zinc-900">{request.pickupScheduledFor}</span>
                      </p>
                    ) : null}

                    {request.refundStatus ? (
                      <p className="mt-2 text-xs font-light text-zinc-600">
                        Razorpay refund: {request.refundStatus}
                        {request.razorpayRefundId
                          ? ` (${request.razorpayRefundId})`
                          : ""}
                      </p>
                    ) : null}

                    {request.status === "pickup_scheduled" ? (
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => handleMarkReceived(request.id)}
                          className="cursor-pointer border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-white hover:bg-zinc-800"
                        >
                          Item received — start refund
                        </button>
                      </div>
                    ) : null}

                    {request.status === "item_received" ? (
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => handleMarkRefunded(request.id)}
                          className="cursor-pointer border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-white hover:bg-zinc-800"
                        >
                          Mark refund processed
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
