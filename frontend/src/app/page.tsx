import AudienceCollections from "@/components/AudienceCollections";
import Reels from "@/components/Reels";
import HeroBanner from "@/components/HeroBanner";
import NewArrivals from "@/components/NewArrivals";
import PromoBanner from "@/components/PromoBanner";
import PromoVideo from "@/components/PromoVideo";
import ShopByCategory from "@/components/ShopByCategory";
import TopStyles from "@/components/TopStyles";
import ShopByCollection from "@/components/ShopByCollection";
import ShopByRecipient from "@/components/ShopByRecipient";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <HeroBanner />
      <ShopByCategory />
      <TopStyles />
      <PromoBanner />
      <ShopByRecipient />
      <ShopByCollection />
      <NewArrivals />
      <PromoVideo />
      <AudienceCollections />
      <Reels />
    </div>
  );
}
