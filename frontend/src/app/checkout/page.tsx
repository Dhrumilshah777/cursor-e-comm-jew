import { Jost } from "next/font/google";
import CheckoutPageContent from "@/components/checkout/CheckoutPageContent";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata = {
  title: "Checkout | Wholesale Jewelry",
};

export default function CheckoutPage() {
  return (
    <div className={`${jost.className} flex-1`}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-light uppercase tracking-[0.12em] text-zinc-950 sm:text-3xl">
          Checkout
        </h1>
        <div className="mt-8">
          <CheckoutPageContent />
        </div>
      </div>
    </div>
  );
}
