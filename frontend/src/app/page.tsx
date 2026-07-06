import AudienceCollections from "@/components/AudienceCollections";
import CustomDesignPoster from "@/components/CustomDesignPoster";
import Reels, { type ReelItem } from "@/components/Reels";
import HeroBanner from "@/components/HeroBanner";
import NewArrivals, { type ProductItem } from "@/components/NewArrivals";
import PromoBanner from "@/components/PromoBanner";
import PromoVideo from "@/components/PromoVideo";
import ShopByCategory from "@/components/ShopByCategory";
import TopStyles, { type TopStyleProduct } from "@/components/TopStyles";
import ShopByCollection from "@/components/ShopByCollection";
import ShopByRecipient from "@/components/ShopByRecipient";
import { fetchHomepage } from "@/lib/homepageApi";

function mapProductCards(
  items: Awaited<ReturnType<typeof fetchHomepage>>["newArrivals"],
): ProductItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    href: item.href,
    image: item.image,
    alt: item.alt,
    price: item.price,
    metal: item.metal,
  }));
}

function mapTopStyles(
  items: Awaited<ReturnType<typeof fetchHomepage>>["topStyles"],
): TopStyleProduct[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    href: item.href,
    image: item.image,
    alt: item.alt,
    price: item.price,
    metal: item.metal,
  }));
}

function mapVideos(
  items: Awaited<ReturnType<typeof fetchHomepage>>["eleganceInMotion"],
): ReelItem[] {
  return items.map((item) => ({
    id: item.id,
    href: item.href,
    image: item.image,
    alt: item.alt,
    caption: item.caption ?? undefined,
    videoUrl: item.videoUrl,
  }));
}

export const revalidate = 60;

export default async function Home() {
  let homepage: Awaited<ReturnType<typeof fetchHomepage>> | null = null;
  try {
    homepage = await fetchHomepage();
  } catch {
    homepage = null;
  }

  const newArrivalItems =
    homepage && homepage.newArrivals.length > 0
      ? mapProductCards(homepage.newArrivals)
      : undefined;
  const topStyleItems =
    homepage && homepage.topStyles.length > 0
      ? mapTopStyles(homepage.topStyles)
      : undefined;
  const reelItems =
    homepage && homepage.eleganceInMotion.length > 0
      ? mapVideos(homepage.eleganceInMotion)
      : undefined;

  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <HeroBanner />
      <ShopByCategory />
      <TopStyles items={topStyleItems} />
      <PromoBanner />
      <CustomDesignPoster />
      <ShopByRecipient />
      <ShopByCollection />
      <NewArrivals items={newArrivalItems} />
      <PromoVideo />
      <AudienceCollections />
      <Reels items={reelItems} />
    </div>
  );
}
