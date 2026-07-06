import {
  applyPendantImageOverrides,
  HEART_PENDANT_GALLERY,
  HEART_PENDANT_IMAGE,
  PENDANT_GPT_2,
  PENDANT_GPT_3,
} from "@/data/pendantAssets";
import { DOLPHIN_EARRING_IMAGE } from "@/data/earringAssets";

export type CollectionSlug =
  | "necklaces"
  | "bracelets"
  | "rings"
  | "earrings"
  | "pendants"
  | "mangalsutra"
  | "mens"
  | "womens"
  | "kids";

export type CollectionConfig = {
  slug: CollectionSlug;
  name: string;
  tagline: string;
  bannerImage: string;
  bannerAlt: string;
};

export type MetalType = "Rose Gold" | "Yellow Gold" | "White Gold";

import {
  calculatePriceBreakup,
  DEFAULT_GST_PERCENT,
  formatINR,
  parseNetWeightGrams,
  type GoldPurity,
  type PriceBreakup,
  type ProductMakingCharge,
} from "@/lib/pricing";

export type { GoldPurity };

export type CollectionProduct = {
  id: string;
  slug: string;
  name: string;
  category: CollectionSlug;
  image: string;
  alt: string;
  price: string;
  metal: MetalType;
  sku: string;
  /** e.g. "4.20 g" */
  weight: string;
  purity: GoldPurity;
  /** Primary image first, then angle / detail shots for thumbnails */
  gallery: string[];
  /** Short product copy for the detail page (3–4 lines) */
  description: string;
  makingCharge: ProductMakingCharge;
  gstPercent: number;
  priceBreakup: PriceBreakup;
  /** Set for ring products only */
  ringSize?: string;
  /** Current saleable stock. 0 = sold out. */
  stockCount?: number;
  /** Admin-configured "running low" threshold. */
  lowStockThreshold?: number;
  /** Derived from stockCount > 0. */
  inStock?: boolean;
};

export const collections: Record<CollectionSlug, CollectionConfig> = {
  rings: {
    slug: "rings",
    name: "Rings",
    tagline: "Elegance in every loop",
    bannerImage:
      "https://palmonas.com/cdn/shop/files/Rings_1.webp?v=1773063871&width=2000",
    bannerAlt: "Rings collection banner",
  },
  earrings: {
    slug: "earrings",
    name: "Earrings",
    tagline: "Statement for every occasion",
    bannerImage:
      "https://palmonas.com/cdn/shop/files/Earrings_1.webp?v=1773063871&width=2000",
    bannerAlt: "Earrings collection banner",
  },
  necklaces: {
    slug: "necklaces",
    name: "Necklaces",
    tagline: "Grace that rests close to the heart",
    bannerImage:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    bannerAlt: "Necklaces collection banner",
  },
  bracelets: {
    slug: "bracelets",
    name: "Bracelets",
    tagline: "Delicate layers of luminous charm",
    bannerImage:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    bannerAlt: "Bracelets collection banner",
  },
  pendants: {
    slug: "pendants",
    name: "Pendants",
    tagline: "A focal point of refined brilliance",
    bannerImage: HEART_PENDANT_IMAGE,
    bannerAlt: "Pendants collection banner",
  },
  mangalsutra: {
    slug: "mangalsutra",
    name: "Mangalsutra",
    tagline: "Tradition woven in timeless gold",
    bannerImage:
      "https://i.pinimg.com/736x/49/7f/69/497f699de95ec3c83a814eeb1be0ecee.jpg",
    bannerAlt: "Mangalsutra collection banner",
  },
  mens: {
    slug: "mens",
    name: "Men's Collection",
    tagline: "Refined pieces for the modern gentleman",
    bannerImage:
      "https://i.pinimg.com/1200x/68/03/68/680368afb5ddc5a9759a847ad600afaa.jpg",
    bannerAlt: "Men's jewelry collection banner",
  },
  womens: {
    slug: "womens",
    name: "Women's Collection",
    tagline: "Elegance designed for every moment",
    bannerImage:
      "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
    bannerAlt: "Women's jewelry collection banner",
  },
  kids: {
    slug: "kids",
    name: "Kids Collection",
    tagline: "Charming keepsakes they will treasure",
    bannerImage:
      "https://i.pinimg.com/1200x/89/46/14/8946149ece712e63fd4cd89e3d051dbc.jpg",
    bannerAlt: "Kids jewelry collection banner",
  },
};

const metals: MetalType[] = ["Yellow Gold", "Rose Gold", "White Gold"];
const purities: GoldPurity[] = ["18kt", "22kt", "14kt"];

type CollectionProductBase = Omit<
  CollectionProduct,
  | "metal"
  | "sku"
  | "weight"
  | "purity"
  | "gallery"
  | "description"
  | "makingCharge"
  | "gstPercent"
  | "priceBreakup"
>;

const ringSizes = [
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
];

function buildRingSize(index: number): string {
  return ringSizes[index % ringSizes.length]!;
}

function buildMakingCharge(index: number): ProductMakingCharge {
  if (index % 3 === 0) {
    return { type: "fixed", value: 650 + (index % 6) * 125 };
  }
  return { type: "percentage", value: 10 + (index % 5) * 2 };
}

function buildProductDescription(
  product: CollectionProductBase,
  metal: MetalType,
): string {
  const collectionName = collections[product.category].name.toLowerCase();
  return [
    `Crafted in ${metal.toLowerCase()}, the ${product.name} pairs a refined silhouette with everyday wearability.`,
    `Finished by hand for a smooth, lasting shine and a comfortable fit you can wear from morning to evening.`,
    `A versatile piece from our ${collectionName}—designed to layer easily or stand alone as a quiet statement.`,
    `Each detail is checked for quality so your jewelry keeps its brilliance with gentle care.`,
  ].join(" ");
}

const galleryPool = [
  "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
  "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
  "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
  "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
  "https://i.pinimg.com/736x/91/7b/6b/917b6b5f464c44229dcc2bbfa2a954d7.jpg",
  "https://i.pinimg.com/1200x/89/46/14/8946149ece712e63fd4cd89e3d051dbc.jpg",
];

function buildProductGallery(primary: string, index: number): string[] {
  const a = galleryPool[index % galleryPool.length]!;
  const b = galleryPool[(index + 2) % galleryPool.length]!;
  const c = galleryPool[(index + 4) % galleryPool.length]!;
  return [...new Set([primary, a, b, c])];
}

const collectionProductsRaw: CollectionProductBase[] = [
  {
    id: "ring-1",
    slug: "solitaire-ring",
    name: "Solitaire Ring",
    category: "rings",
    image:
      "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
    alt: "Solitaire diamond ring",
    price: "₹12,900",
  },
  {
    id: "ring-2",
    slug: "celestial-band-ring",
    name: "Celestial Band Ring",
    category: "rings",
    image:
      "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
    alt: "Gold celestial band ring",
    price: "₹8,450",
  },
  {
    id: "ring-3",
    slug: "pink-gem-ring",
    name: "Pink Gem Ring",
    category: "rings",
    image:
      "https://i.pinimg.com/736x/91/7b/6b/917b6b5f464c44229dcc2bbfa2a954d7.jpg",
    alt: "Pink gemstone gold ring",
    price: "₹9,200",
  },
  {
    id: "ring-4",
    slug: "minimal-gold-ring",
    name: "Minimal Gold Ring",
    category: "rings",
    image:
      "https://i.pinimg.com/1200x/89/46/14/8946149ece712e63fd4cd89e3d051dbc.jpg",
    alt: "Minimal gold ring",
    price: "₹5,600",
  },
  {
    id: "ring-5",
    slug: "stackable-ring-set",
    name: "Stackable Ring Set",
    category: "rings",
    image:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    alt: "Stackable gold ring set",
    price: "₹7,800",
  },
  {
    id: "ring-6",
    slug: "vintage-band-ring",
    name: "Vintage Band Ring",
    category: "rings",
    image:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    alt: "Vintage gold band ring",
    price: "₹6,950",
  },
  {
    id: "ring-7",
    slug: "pave-halo-ring",
    name: "Pavé Halo Ring",
    category: "rings",
    image:
      "https://i.pinimg.com/736x/49/7f/69/497f699de95ec3c83a814eeb1be0ecee.jpg",
    alt: "Pavé halo diamond ring",
    price: "₹14,500",
  },
  {
    id: "ring-8",
    slug: "twist-band-ring",
    name: "Twist Band Ring",
    category: "rings",
    image:
      "https://i.pinimg.com/736x/83/25/35/832535b7d7324df0308d6e62ff04df67.jpg",
    alt: "Twist band gold ring",
    price: "₹4,200",
  },
  {
    id: "earring-1",
    slug: "pearl-drop-earrings",
    name: "Pearl Drop Earrings",
    category: "earrings",
    image: DOLPHIN_EARRING_IMAGE,
    alt: "Gold dolphin earrings and pendant set",
    price: "₹4,850",
  },
  {
    id: "earring-2",
    slug: "classic-hoop-earrings",
    name: "Classic Hoop Earrings",
    category: "earrings",
    image:
      "https://i.pinimg.com/1200x/89/46/14/8946149ece712e63fd4cd89e3d051dbc.jpg",
    alt: "Classic gold hoop earrings",
    price: "₹5,100",
  },
  {
    id: "earring-3",
    slug: "star-charm-hoops",
    name: "Star Charm Hoops",
    category: "earrings",
    image:
      "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
    alt: "Star charm hoop earrings",
    price: "₹6,400",
  },
  {
    id: "earring-4",
    slug: "pave-huggie-earrings",
    name: "Pavé Huggie Earrings",
    category: "earrings",
    image:
      "https://i.pinimg.com/736x/91/7b/6b/917b6b5f464c44229dcc2bbfa2a954d7.jpg",
    alt: "Pavé huggie earrings",
    price: "₹7,250",
  },
  {
    id: "earring-5",
    slug: "triangle-stud-earrings",
    name: "Triangle Stud Earrings",
    category: "earrings",
    image:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    alt: "Triangle stud earrings",
    price: "₹3,900",
  },
  {
    id: "earring-6",
    slug: "layered-drop-earrings",
    name: "Layered Drop Earrings",
    category: "earrings",
    image:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    alt: "Layered drop earrings",
    price: "₹8,100",
  },
  {
    id: "earring-7",
    slug: "chandelier-earrings",
    name: "Chandelier Earrings",
    category: "earrings",
    image:
      "https://i.pinimg.com/736x/49/7f/69/497f699de95ec3c83a814eeb1be0ecee.jpg",
    alt: "Chandelier earrings",
    price: "₹9,750",
  },
  {
    id: "earring-8",
    slug: "minimal-stud-earrings",
    name: "Minimal Stud Earrings",
    category: "earrings",
    image:
      "https://i.pinimg.com/736x/83/25/35/832535b7d7324df0308d6e62ff04df67.jpg",
    alt: "Minimal stud earrings",
    price: "₹2,980",
  },
  {
    id: "necklace-1",
    slug: "gold-chain-necklace",
    name: "Gold Chain Necklace",
    category: "necklaces",
    image:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    alt: "Gold chain necklace",
    price: "₹6,200",
  },
  {
    id: "necklace-2",
    slug: "diamond-pendant-necklace",
    name: "Diamond Pendant Necklace",
    category: "necklaces",
    image:
      "https://i.pinimg.com/736x/91/7b/6b/917b6b5f464c44229dcc2bbfa2a954d7.jpg",
    alt: "Diamond pendant necklace",
    price: "₹8,750",
  },
  {
    id: "necklace-3",
    slug: "layered-chain-necklace",
    name: "Layered Chain Necklace",
    category: "necklaces",
    image:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    alt: "Layered chain necklace",
    price: "₹5,400",
  },
  {
    id: "necklace-4",
    slug: "pearl-strand-necklace",
    name: "Pearl Strand Necklace",
    category: "necklaces",
    image:
      "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
    alt: "Pearl strand necklace",
    price: "₹7,100",
  },
  {
    id: "necklace-5",
    slug: "choker-necklace",
    name: "Choker Necklace",
    category: "necklaces",
    image:
      "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
    alt: "Gold choker necklace",
    price: "₹9,300",
  },
  {
    id: "necklace-6",
    slug: "statement-necklace",
    name: "Statement Necklace",
    category: "necklaces",
    image:
      "https://i.pinimg.com/1200x/89/46/14/8946149ece712e63fd4cd89e3d051dbc.jpg",
    alt: "Statement necklace",
    price: "₹11,200",
  },
  {
    id: "necklace-7",
    slug: "minimal-pendant-necklace",
    name: "Minimal Pendant Necklace",
    category: "necklaces",
    image:
      "https://i.pinimg.com/736x/49/7f/69/497f699de95ec3c83a814eeb1be0ecee.jpg",
    alt: "Minimal pendant necklace",
    price: "₹4,650",
  },
  {
    id: "necklace-8",
    slug: "coin-necklace",
    name: "Coin Necklace",
    category: "necklaces",
    image:
      "https://i.pinimg.com/736x/83/25/35/832535b7d7324df0308d6e62ff04df67.jpg",
    alt: "Coin necklace",
    price: "₹5,850",
  },
  {
    id: "bracelet-1",
    slug: "layered-bracelet-set",
    name: "Layered Bracelet Set",
    category: "bracelets",
    image:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    alt: "Layered bracelet set",
    price: "₹3,450",
  },
  {
    id: "bracelet-2",
    slug: "gold-cuff-bracelet",
    name: "Gold Cuff Bracelet",
    category: "bracelets",
    image:
      "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
    alt: "Gold cuff bracelet",
    price: "₹6,800",
  },
  {
    id: "bracelet-3",
    slug: "tennis-bracelet",
    name: "Tennis Bracelet",
    category: "bracelets",
    image:
      "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
    alt: "Tennis bracelet",
    price: "₹12,400",
  },
  {
    id: "bracelet-4",
    slug: "pearl-bracelet",
    name: "Pearl Bracelet",
    category: "bracelets",
    image:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    alt: "Pearl bracelet",
    price: "₹4,900",
  },
  {
    id: "bracelet-5",
    slug: "chain-bracelet",
    name: "Chain Bracelet",
    category: "bracelets",
    image:
      "https://i.pinimg.com/736x/91/7b/6b/917b6b5f464c44229dcc2bbfa2a954d7.jpg",
    alt: "Chain bracelet",
    price: "₹3,750",
  },
  {
    id: "bracelet-6",
    slug: "charm-bracelet",
    name: "Charm Bracelet",
    category: "bracelets",
    image:
      "https://i.pinimg.com/1200x/89/46/14/8946149ece712e63fd4cd89e3d051dbc.jpg",
    alt: "Charm bracelet",
    price: "₹5,200",
  },
  {
    id: "bracelet-7",
    slug: "bangle-bracelet",
    name: "Bangle Bracelet",
    category: "bracelets",
    image:
      "https://i.pinimg.com/736x/49/7f/69/497f699de95ec3c83a814eeb1be0ecee.jpg",
    alt: "Bangle bracelet",
    price: "₹7,600",
  },
  {
    id: "bracelet-8",
    slug: "minimal-bracelet",
    name: "Minimal Bracelet",
    category: "bracelets",
    image:
      "https://i.pinimg.com/736x/83/25/35/832535b7d7324df0308d6e62ff04df67.jpg",
    alt: "Minimal gold bracelet",
    price: "₹2,650",
  },
  {
    id: "pendant-1",
    slug: "heart-pendant",
    name: "Heart Pendant",
    category: "pendants",
    image: HEART_PENDANT_IMAGE,
    alt: "Heart pendant",
    price: "₹4,400",
  },
  {
    id: "pendant-2",
    slug: "initial-pendant",
    name: "Initial Pendant",
    category: "pendants",
    image: PENDANT_GPT_2,
    alt: "Gold dolphin pendant and earring set",
    price: "₹3,800",
  },
  {
    id: "pendant-3",
    slug: "solitaire-pendant",
    name: "Solitaire Pendant",
    category: "pendants",
    image: PENDANT_GPT_3,
    alt: "Gold abstract pendant and earring set",
    price: "₹9,900",
  },
  {
    id: "pendant-4",
    slug: "locket-pendant",
    name: "Locket Pendant",
    category: "pendants",
    image:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    alt: "Locket pendant",
    price: "₹6,300",
  },
  {
    id: "pendant-5",
    slug: "coin-pendant",
    name: "Coin Pendant",
    category: "pendants",
    image:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    alt: "Coin pendant",
    price: "₹5,100",
  },
  {
    id: "pendant-6",
    slug: "teardrop-pendant",
    name: "Teardrop Pendant",
    category: "pendants",
    image:
      "https://i.pinimg.com/1200x/89/46/14/8946149ece712e63fd4cd89e3d051dbc.jpg",
    alt: "Teardrop pendant",
    price: "₹7,400",
  },
  {
    id: "pendant-7",
    slug: "floral-pendant",
    name: "Floral Pendant",
    category: "pendants",
    image:
      "https://i.pinimg.com/736x/49/7f/69/497f699de95ec3c83a814eeb1be0ecee.jpg",
    alt: "Floral pendant",
    price: "₹4,950",
  },
  {
    id: "pendant-8",
    slug: "minimal-pendant",
    name: "Minimal Pendant",
    category: "pendants",
    image:
      "https://i.pinimg.com/736x/83/25/35/832535b7d7324df0308d6e62ff04df67.jpg",
    alt: "Minimal pendant",
    price: "₹3,200",
  },
  {
    id: "mangalsutra-1",
    slug: "classic-mangalsutra",
    name: "Classic Mangalsutra",
    category: "mangalsutra",
    image:
      "https://i.pinimg.com/736x/49/7f/69/497f699de95ec3c83a814eeb1be0ecee.jpg",
    alt: "Classic mangalsutra",
    price: "₹9,400",
  },
  {
    id: "mangalsutra-2",
    slug: "diamond-mangalsutra",
    name: "Diamond Mangalsutra",
    category: "mangalsutra",
    image:
      "https://i.pinimg.com/736x/91/7b/6b/917b6b5f464c44229dcc2bbfa2a954d7.jpg",
    alt: "Diamond mangalsutra",
    price: "₹14,800",
  },
  {
    id: "mangalsutra-3",
    slug: "minimal-mangalsutra",
    name: "Minimal Mangalsutra",
    category: "mangalsutra",
    image:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    alt: "Minimal mangalsutra",
    price: "₹7,200",
  },
  {
    id: "mangalsutra-4",
    slug: "black-bead-mangalsutra",
    name: "Black Bead Mangalsutra",
    category: "mangalsutra",
    image:
      "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
    alt: "Black bead mangalsutra",
    price: "₹8,600",
  },
  {
    id: "mangalsutra-5",
    slug: "layered-mangalsutra",
    name: "Layered Mangalsutra",
    category: "mangalsutra",
    image:
      "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
    alt: "Layered mangalsutra",
    price: "₹10,500",
  },
  {
    id: "mangalsutra-6",
    slug: "modern-mangalsutra",
    name: "Modern Mangalsutra",
    category: "mangalsutra",
    image:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    alt: "Modern mangalsutra",
    price: "₹11,900",
  },
  {
    id: "mangalsutra-7",
    slug: "gold-pendant-mangalsutra",
    name: "Gold Pendant Mangalsutra",
    category: "mangalsutra",
    image:
      "https://i.pinimg.com/1200x/89/46/14/8946149ece712e63fd4cd89e3d051dbc.jpg",
    alt: "Gold pendant mangalsutra",
    price: "₹12,300",
  },
  {
    id: "mangalsutra-8",
    slug: "delicate-mangalsutra",
    name: "Delicate Mangalsutra",
    category: "mangalsutra",
    image:
      "https://i.pinimg.com/736x/83/25/35/832535b7d7324df0308d6e62ff04df67.jpg",
    alt: "Delicate mangalsutra",
    price: "₹6,750",
  },
  {
    id: "mens-1",
    slug: "mens-gold-band-ring",
    name: "Gold Band Ring",
    category: "mens",
    image:
      "https://i.pinimg.com/1200x/68/03/68/680368afb5ddc5a9759a847ad600afaa.jpg",
    alt: "Men's gold band ring and chain",
    price: "₹8,900",
  },
  {
    id: "mens-2",
    slug: "mens-chain-necklace",
    name: "Gold Chain Necklace",
    category: "mens",
    image:
      "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
    alt: "Men's gold chain necklace",
    price: "₹7,400",
  },
  {
    id: "mens-3",
    slug: "mens-signet-ring",
    name: "Signet Ring",
    category: "mens",
    image:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    alt: "Men's gold signet ring",
    price: "₹10,200",
  },
  {
    id: "mens-4",
    slug: "mens-cuff-bracelet",
    name: "Cuff Bracelet",
    category: "mens",
    image:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    alt: "Men's gold cuff bracelet",
    price: "₹9,600",
  },
  {
    id: "mens-5",
    slug: "mens-minimal-ring",
    name: "Minimal Band Ring",
    category: "mens",
    image:
      "https://i.pinimg.com/736x/91/7b/6b/917b6b5f464c44229dcc2bbfa2a954d7.jpg",
    alt: "Men's minimal gold ring",
    price: "₹5,800",
  },
  {
    id: "mens-6",
    slug: "mens-diamond-stud",
    name: "Diamond Stud Earring",
    category: "mens",
    image:
      "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
    alt: "Men's diamond stud earring",
    price: "₹6,500",
  },
  {
    id: "mens-7",
    slug: "mens-textured-band",
    name: "Textured Band Ring",
    category: "mens",
    image:
      "https://i.pinimg.com/1200x/89/46/14/8946149ece712e63fd4cd89e3d051dbc.jpg",
    alt: "Men's textured gold band",
    price: "₹7,950",
  },
  {
    id: "mens-8",
    slug: "mens-chain-bracelet",
    name: "Chain Bracelet",
    category: "mens",
    image:
      "https://i.pinimg.com/736x/83/25/35/832535b7d7324df0308d6e62ff04df67.jpg",
    alt: "Men's gold chain bracelet",
    price: "₹6,200",
  },
  {
    id: "womens-1",
    slug: "womens-pearl-drop-earrings",
    name: "Pearl Drop Earrings",
    category: "womens",
    image:
      "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
    alt: "Women's pearl drop earrings",
    price: "₹4,850",
  },
  {
    id: "womens-2",
    slug: "womens-gold-chain",
    name: "Gold Chain Necklace",
    category: "womens",
    image:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    alt: "Women's gold chain necklace",
    price: "₹6,200",
  },
  {
    id: "womens-3",
    slug: "womens-solitaire-ring",
    name: "Solitaire Ring",
    category: "womens",
    image:
      "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
    alt: "Women's solitaire ring",
    price: "₹12,900",
  },
  {
    id: "womens-4",
    slug: "womens-layered-bracelet",
    name: "Layered Bracelet Set",
    category: "womens",
    image:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    alt: "Women's layered bracelet set",
    price: "₹3,450",
  },
  {
    id: "womens-5",
    slug: "womens-diamond-pendant",
    name: "Diamond Pendant",
    category: "womens",
    image:
      "https://i.pinimg.com/736x/91/7b/6b/917b6b5f464c44229dcc2bbfa2a954d7.jpg",
    alt: "Women's diamond pendant",
    price: "₹8,750",
  },
  {
    id: "womens-6",
    slug: "womens-hoop-earrings",
    name: "Hoop Earrings",
    category: "womens",
    image:
      "https://i.pinimg.com/1200x/89/46/14/8946149ece712e63fd4cd89e3d051dbc.jpg",
    alt: "Women's hoop earrings",
    price: "₹5,100",
  },
  {
    id: "womens-7",
    slug: "womens-charm-necklace",
    name: "Charm Necklace",
    category: "womens",
    image:
      "https://i.pinimg.com/736x/49/7f/69/497f699de95ec3c83a814eeb1be0ecee.jpg",
    alt: "Women's charm necklace",
    price: "₹7,300",
  },
  {
    id: "womens-8",
    slug: "womens-stackable-rings",
    name: "Stackable Rings",
    category: "womens",
    image:
      "https://i.pinimg.com/736x/83/25/35/832535b7d7324df0308d6e62ff04df67.jpg",
    alt: "Women's stackable rings",
    price: "₹4,600",
  },
  {
    id: "kids-1",
    slug: "kids-gold-pendant",
    name: "Gold Pendant",
    category: "kids",
    image:
      "https://i.pinimg.com/1200x/89/46/14/8946149ece712e63fd4cd89e3d051dbc.jpg",
    alt: "Kids gold pendant",
    price: "₹2,800",
  },
  {
    id: "kids-2",
    slug: "kids-bracelet",
    name: "Charm Bracelet",
    category: "kids",
    image:
      "https://i.pinimg.com/1200x/47/17/32/4717327a9027cc7f683ae86644b18905.jpg",
    alt: "Kids charm bracelet",
    price: "₹2,450",
  },
  {
    id: "kids-3",
    slug: "kids-stud-earrings",
    name: "Stud Earrings",
    category: "kids",
    image:
      "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg",
    alt: "Kids stud earrings",
    price: "₹1,950",
  },
  {
    id: "kids-4",
    slug: "kids-minimal-chain",
    name: "Minimal Chain",
    category: "kids",
    image:
      "https://i.pinimg.com/1200x/76/a4/5a/76a45a09a561e900917c4ee660f27e45.jpg",
    alt: "Kids minimal gold chain",
    price: "₹3,100",
  },
  {
    id: "kids-5",
    slug: "kids-enamel-pendant",
    name: "Enamel Pendant",
    category: "kids",
    image:
      "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg",
    alt: "Kids enamel pendant",
    price: "₹2,650",
  },
  {
    id: "kids-6",
    slug: "kids-star-earrings",
    name: "Star Earrings",
    category: "kids",
    image:
      "https://i.pinimg.com/736x/91/7b/6b/917b6b5f464c44229dcc2bbfa2a954d7.jpg",
    alt: "Kids star earrings",
    price: "₹2,200",
  },
  {
    id: "kids-7",
    slug: "kids-bangle",
    name: "Gold Bangle",
    category: "kids",
    image:
      "https://i.pinimg.com/736x/49/7f/69/497f699de95ec3c83a814eeb1be0ecee.jpg",
    alt: "Kids gold bangle",
    price: "₹3,400",
  },
  {
    id: "kids-8",
    slug: "kids-initial-pendant",
    name: "Initial Pendant",
    category: "kids",
    image:
      "https://i.pinimg.com/736x/83/25/35/832535b7d7324df0308d6e62ff04df67.jpg",
    alt: "Kids initial pendant",
    price: "₹2,900",
  },
];

export const collectionProducts: CollectionProduct[] = collectionProductsRaw.map(
  (product, index) => {
    const metal = metals[index % metals.length]!;
    const purity = purities[index % purities.length]!;
    const weight = `${(0.5 + (index % 11) * 0.01).toFixed(2)} g`;
    const netWeightGrams = parseNetWeightGrams(weight);
    const makingCharge = buildMakingCharge(index);
    const gstPercent = DEFAULT_GST_PERCENT;
    const priceBreakup = calculatePriceBreakup({
      netWeightGrams,
      purity,
      makingCharge,
      gstPercent,
    });

    return {
      ...product,
      metal,
      sku: `JL-${product.category.slice(0, 2).toUpperCase()}${String(index + 1).padStart(4, "0")}`,
      weight,
      purity,
      gallery:
        product.slug === "heart-pendant"
          ? [...HEART_PENDANT_GALLERY]
          : product.slug === "initial-pendant"
            ? [PENDANT_GPT_2]
            : product.slug === "solitaire-pendant"
              ? [PENDANT_GPT_3]
              : product.slug === "pearl-drop-earrings"
                ? [DOLPHIN_EARRING_IMAGE]
                : buildProductGallery(product.image, index),
      description: buildProductDescription(product, metal),
      makingCharge,
      gstPercent,
      priceBreakup,
      price: formatINR(priceBreakup.total),
      ...(product.category === "rings"
        ? { ringSize: buildRingSize(index) }
        : {}),
    };
  },
);

export const collectionSlugs = Object.keys(collections) as CollectionSlug[];

export function isCollectionSlug(slug: string): slug is CollectionSlug {
  return collectionSlugs.includes(slug as CollectionSlug);
}

export function getCollection(slug: CollectionSlug) {
  return collections[slug];
}

export function getProductsByCategory(category: CollectionSlug) {
  return collectionProducts.filter((product) => product.category === category);
}

export function getRelatedProducts(currentSlug: string, limit = 4) {
  const current = collectionProducts.find((product) => product.slug === currentSlug);
  if (!current) {
    return collectionProducts.filter((product) => product.slug !== currentSlug).slice(0, limit);
  }

  const sameCategory = collectionProducts.filter(
    (product) =>
      product.category === current.category && product.slug !== currentSlug,
  );
  const other = collectionProducts.filter(
    (product) =>
      product.category !== current.category && product.slug !== currentSlug,
  );

  return [...sameCategory, ...other].slice(0, limit);
}
