import CollectionsOverview, {
  CollectionsPageHero,
} from "@/components/CollectionsOverview";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Collections | Wholesale Jewelry",
  description:
    "Browse gold jewelry collections — rings, necklaces, earrings, bracelets, pendants, mangalsutra, and more.",
};

export default function CollectionsPage() {
  return (
    <>
      <div className="flex flex-col overflow-x-hidden">
        <CollectionsPageHero />
        <CollectionsOverview />
      </div>
      <Footer />
    </>
  );
}
