import type { HomepageSection, Product } from "../generated/prisma/client.js";
import {
  cachedJson,
  HOMEPAGE_CACHE_TTL_SECONDS,
  invalidateCachedHomepage,
} from "../lib/cache.js";
import { prisma } from "../lib/prisma.js";
import { formatPaise, metalToDisplay } from "../lib/format.js";
import { calculateProductPricePaise } from "../lib/pricing.js";
import { redisKeys } from "../lib/redis.js";

export const MAX_ELEGANCE_VIDEOS = 4;

export type HomepageProductCardDto = {
  id: string;
  name: string;
  href: string;
  image: string;
  alt: string;
  price: string;
  metal: string;
  featureId: string;
  sortOrder: number;
  productId: string;
  category: string;
};

export type HomepageVideoDto = {
  id: string;
  featureId: string;
  href: string;
  videoUrl: string;
  image: string;
  alt: string;
  caption: string | null;
  sortOrder: number;
  linkUrl: string | null;
};

export type HomepageAdminFeatureDto = {
  id: string;
  section: HomepageSection;
  sortOrder: number;
  isActive: boolean;
  productId: string | null;
  videoUrl: string | null;
  posterUrl: string | null;
  caption: string | null;
  linkUrl: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    category: string;
    image: string;
    price: string;
    isActive: boolean;
  } | null;
};

function productCardFromFeature(
  feature: { id: string; sortOrder: number; product: Product },
): HomepageProductCardDto {
  const product = feature.product;
  const pricePaise = calculateProductPricePaise(product);
  return {
    id: product.id,
    featureId: feature.id,
    sortOrder: feature.sortOrder,
    productId: product.id,
    category: product.category,
    name: product.name,
    href: `/products/${product.slug}`,
    image: product.image,
    alt: product.alt,
    price: formatPaise(pricePaise),
    metal: metalToDisplay(product.metal),
  };
}

function mapAdminFeature(
  feature: Awaited<ReturnType<typeof loadFeatures>>[number],
): HomepageAdminFeatureDto {
  return {
    id: feature.id,
    section: feature.section,
    sortOrder: feature.sortOrder,
    isActive: feature.isActive,
    productId: feature.productId,
    videoUrl: feature.videoUrl,
    posterUrl: feature.posterUrl,
    caption: feature.caption,
    linkUrl: feature.linkUrl,
    product: feature.product
      ? {
          id: feature.product.id,
          name: feature.product.name,
          slug: feature.product.slug,
          category: feature.product.category,
          image: feature.product.image,
          price: formatPaise(calculateProductPricePaise(feature.product)),
          isActive: feature.product.isActive,
        }
      : null,
  };
}

async function loadFeatures(section?: HomepageSection) {
  return prisma.homepageFeature.findMany({
    where: {
      ...(section ? { section } : {}),
      isActive: true,
    },
    include: { product: true },
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

async function loadAdminFeatures(section?: HomepageSection) {
  return prisma.homepageFeature.findMany({
    where: section ? { section } : undefined,
    include: { product: true },
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getPublicHomepage() {
  return cachedJson(
    redisKeys.homepagePublic(),
    HOMEPAGE_CACHE_TTL_SECONDS,
    async () => {
      const features = await loadFeatures();

      const newArrivals: HomepageProductCardDto[] = [];
      const topStyles: HomepageProductCardDto[] = [];
      const eleganceInMotion: HomepageVideoDto[] = [];

      for (const feature of features) {
        if (feature.section === "NEW_ARRIVALS" && feature.product) {
          newArrivals.push(
            productCardFromFeature(feature as typeof feature & { product: Product }),
          );
        } else if (feature.section === "TOP_STYLES" && feature.product) {
          topStyles.push(
            productCardFromFeature(feature as typeof feature & { product: Product }),
          );
        } else if (feature.section === "ELEGANCE_IN_MOTION" && feature.videoUrl) {
          eleganceInMotion.push({
            id: feature.id,
            featureId: feature.id,
            sortOrder: feature.sortOrder,
            videoUrl: feature.videoUrl,
            image: feature.posterUrl ?? feature.product?.image ?? "",
            alt: feature.caption ?? feature.product?.alt ?? "Elegance in motion video",
            caption: feature.caption,
            href:
              feature.linkUrl ??
              (feature.product ? `/products/${feature.product.slug}` : "#"),
            linkUrl: feature.linkUrl,
          });
        }
      }

      return { newArrivals, topStyles, eleganceInMotion };
    },
  );
}

export async function listAdminHomepageFeatures(section?: HomepageSection) {
  const features = await loadAdminFeatures(section);
  return features.map(mapAdminFeature);
}

async function nextSortOrder(section: HomepageSection) {
  const last = await prisma.homepageFeature.findFirst({
    where: { section },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? -1) + 1;
}

export async function createHomepageFeature(input: {
  section: HomepageSection;
  productId?: string;
  videoUrl?: string;
  posterUrl?: string;
  caption?: string;
  linkUrl?: string;
}) {
  if (input.section === "ELEGANCE_IN_MOTION") {
    const count = await prisma.homepageFeature.count({
      where: { section: "ELEGANCE_IN_MOTION", isActive: true },
    });
    if (count >= MAX_ELEGANCE_VIDEOS) {
      return { error: "ELEGANCE_LIMIT" as const };
    }
    if (!input.videoUrl?.trim()) {
      return { error: "VIDEO_REQUIRED" as const };
    }
  } else {
    if (!input.productId) {
      return { error: "PRODUCT_REQUIRED" as const };
    }
    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!product) {
      return { error: "PRODUCT_NOT_FOUND" as const };
    }
    const duplicate = await prisma.homepageFeature.findFirst({
      where: {
        section: input.section,
        productId: input.productId,
        isActive: true,
      },
    });
    if (duplicate) {
      return { error: "DUPLICATE_PRODUCT" as const };
    }
  }

  const feature = await prisma.homepageFeature.create({
    data: {
      section: input.section,
      sortOrder: await nextSortOrder(input.section),
      productId: input.productId ?? null,
      videoUrl: input.videoUrl?.trim() || null,
      posterUrl: input.posterUrl?.trim() || null,
      caption: input.caption?.trim() || null,
      linkUrl: input.linkUrl?.trim() || null,
    },
    include: { product: true },
  });

  await invalidateCachedHomepage();

  return { feature: mapAdminFeature(feature) };
}

export async function updateHomepageFeature(
  id: string,
  data: {
    productId?: string | null;
    videoUrl?: string | null;
    posterUrl?: string | null;
    caption?: string | null;
    linkUrl?: string | null;
    isActive?: boolean;
    sortOrder?: number;
  },
) {
  const existing = await prisma.homepageFeature.findUnique({
    where: { id },
    include: { product: true },
  });
  if (!existing) return null;

  const feature = await prisma.homepageFeature.update({
    where: { id },
    data: {
      ...(data.productId !== undefined ? { productId: data.productId } : {}),
      ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl } : {}),
      ...(data.posterUrl !== undefined ? { posterUrl: data.posterUrl } : {}),
      ...(data.caption !== undefined ? { caption: data.caption } : {}),
      ...(data.linkUrl !== undefined ? { linkUrl: data.linkUrl } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
    include: { product: true },
  });

  await invalidateCachedHomepage();

  return mapAdminFeature(feature);
}

export async function deleteHomepageFeature(id: string) {
  const existing = await prisma.homepageFeature.findUnique({ where: { id } });
  if (!existing) return null;
  await prisma.homepageFeature.delete({ where: { id } });
  await invalidateCachedHomepage();
  return { ok: true as const };
}

export async function reorderHomepageFeatures(
  section: HomepageSection,
  orderedIds: string[],
) {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.homepageFeature.update({
        where: { id },
        data: { sortOrder: index, section },
      }),
    ),
  );
  await invalidateCachedHomepage();
  return listAdminHomepageFeatures(section);
}
