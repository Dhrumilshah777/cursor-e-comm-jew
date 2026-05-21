import { Jost } from "next/font/google";
import CartPageContent from "@/components/cart/CartPageContent";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata = {
  title: "Your bag | Wholesale Jewelry",
};

export default function CartPage() {
  return (
    <div className={`${jost.className} flex-1`}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-light uppercase tracking-[0.12em] text-zinc-950 sm:text-3xl">
          Your bag
        </h1>
        <div className="mt-8">
          <CartPageContent />
        </div>
      </div>
    </div>
  );
}
