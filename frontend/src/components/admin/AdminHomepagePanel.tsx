"use client";

import { useCallback, useEffect, useState } from "react";
import { collections, collectionSlugs } from "@/data/collections";
import {
  createAdminHomepageFeature,
  deleteAdminHomepageFeature,
  fetchAdminHomepageFeatures,
  fetchAdminProducts,
  reorderAdminHomepageFeatures,
  type AdminHomepageFeature,
  type AdminProduct,
  type HomepageSectionCode,
} from "@/lib/adminApi";

const SECTIONS: {
  code: HomepageSectionCode;
  title: string;
  description: string;
}[] = [
  {
    code: "NEW_ARRIVALS",
    title: "New Arrivals",
    description: "Products shown in the homepage New Arrivals carousel.",
  },
  {
    code: "TOP_STYLES",
    title: "Top Styles",
    description: "Featured products in the Top Styles section.",
  },
  {
    code: "ELEGANCE_IN_MOTION",
    title: "Elegance in Motion",
    description: "Up to 4 vertical videos with optional captions and links.",
  },
];

function SectionBlock({
  section,
  features,
  products,
  onRefresh,
}: {
  section: (typeof SECTIONS)[number];
  features: AdminHomepageFeature[];
  products: AdminProduct[];
  onRefresh: () => Promise<void>;
}) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sectionFeatures = features
    .filter((f) => f.section === section.code)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const filteredProducts = products.filter(
    (p) =>
      p.isActive &&
      (!categoryFilter || p.category === categoryFilter) &&
      !sectionFeatures.some((f) => f.productId === p.id),
  );

  const handleAddProduct = async () => {
    if (!selectedProductId) return;
    setSaving(true);
    setError(null);
    try {
      await createAdminHomepageFeature({
        section: section.code,
        productId: selectedProductId,
      });
      setSelectedProductId("");
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setSaving(false);
    }
  };

  const handleAddVideo = async () => {
    setSaving(true);
    setError(null);
    try {
      await createAdminHomepageFeature({
        section: section.code,
        videoUrl,
        posterUrl: posterUrl || undefined,
        caption: caption || undefined,
        linkUrl: linkUrl || undefined,
      });
      setVideoUrl("");
      setPosterUrl("");
      setCaption("");
      setLinkUrl("");
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add video");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm("Remove this item from the homepage section?")) return;
    await deleteAdminHomepageFeature(id);
    await onRefresh();
  };

  const move = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sectionFeatures.length) return;
    const ordered = [...sectionFeatures];
    const [item] = ordered.splice(index, 1);
    ordered.splice(nextIndex, 0, item!);
    await reorderAdminHomepageFeatures(
      section.code,
      ordered.map((f) => f.id),
    );
    await onRefresh();
  };

  const isVideoSection = section.code === "ELEGANCE_IN_MOTION";

  return (
    <section className="border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h3 className="text-[11px] font-normal uppercase tracking-[0.2em] text-zinc-900">
          {section.title}
        </h3>
        <p className="mt-1 text-sm font-light text-zinc-600">{section.description}</p>
      </div>

      <div className="space-y-4 px-5 py-4">
        {isVideoSection ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Video URL *
              </span>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://…mp4 or hosted video URL"
                className="mt-1 w-full border border-zinc-300 px-3 py-2 text-sm font-light"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Poster image URL
              </span>
              <input
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                className="mt-1 w-full border border-zinc-300 px-3 py-2 text-sm font-light"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Link URL
              </span>
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/products/slug"
                className="mt-1 w-full border border-zinc-300 px-3 py-2 text-sm font-light"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Caption
              </span>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="mt-1 w-full border border-zinc-300 px-3 py-2 text-sm font-light"
              />
            </label>
            <button
              type="button"
              disabled={saving || !videoUrl.trim() || sectionFeatures.length >= 4}
              onClick={handleAddVideo}
              className="sm:col-span-2 cursor-pointer border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-white disabled:opacity-50"
            >
              Add video ({sectionFeatures.length}/4)
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <label className="block min-w-[160px]">
              <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Category filter
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setSelectedProductId("");
                }}
                className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm font-light"
              >
                <option value="">All categories</option>
                {collectionSlugs.map((slug) => (
                  <option key={slug} value={slug}>
                    {collections[slug].name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block min-w-[220px] flex-1">
              <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Product
              </span>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm font-light"
              >
                <option value="">Select product…</option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.category} · {product.price}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={saving || !selectedProductId}
              onClick={handleAddProduct}
              className="cursor-pointer border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-white disabled:opacity-50"
            >
              Add to section
            </button>
          </div>
        )}

        {error ? <p className="text-sm font-light text-red-700">{error}</p> : null}

        <ul className="divide-y divide-zinc-100 border border-zinc-100">
          {sectionFeatures.length === 0 ? (
            <li className="px-4 py-6 text-sm font-light text-zinc-500">
              No items yet. Add products or videos above.
            </li>
          ) : (
            sectionFeatures.map((feature, index) => (
              <li
                key={feature.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  {feature.product ? (
                    <p className="text-sm font-light text-zinc-900">
                      {feature.product.name}{" "}
                      <span className="text-zinc-500">
                        · {feature.product.category} · {feature.product.price}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm font-light text-zinc-900">
                      Video · {feature.caption ?? feature.videoUrl}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="border border-zinc-300 px-2 py-1 text-[10px] uppercase tracking-[0.12em] disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === sectionFeatures.length - 1}
                    className="border border-zinc-300 px-2 py-1 text-[10px] uppercase tracking-[0.12em] disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(feature.id)}
                    className="text-[10px] uppercase tracking-[0.12em] text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}

export default function AdminHomepagePanel() {
  const [features, setFeatures] = useState<AdminHomepageFeature[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextFeatures, nextProducts] = await Promise.all([
        fetchAdminHomepageFeatures(),
        fetchAdminProducts(),
      ]);
      setFeatures(nextFeatures);
      setProducts(nextProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load homepage settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return <p className="text-sm font-light text-zinc-500">Loading homepage sections…</p>;
  }

  if (error) {
    return <p className="text-sm font-light text-red-700">{error}</p>;
  }

  return (
    <div className="space-y-8">
      {SECTIONS.map((section) => (
        <SectionBlock
          key={section.code}
          section={section}
          features={features}
          products={products}
          onRefresh={refresh}
        />
      ))}
    </div>
  );
}
