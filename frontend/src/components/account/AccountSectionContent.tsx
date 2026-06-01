import MyOrdersContent from "@/components/account/MyOrdersContent";
import MyWishlistContent from "@/components/account/MyWishlistContent";
import { getAccountItemById } from "@/data/accountSections";

function sectionDescription(sectionId: string): string | null {
  if (sectionId === "overview") {
    return null;
  }
  const match = getAccountItemById(sectionId);
  if (!match) return "Manage your account.";
  return `View and manage ${match.item.label.toLowerCase()} from your account.`;
}

export default function AccountSectionContent({
  sectionId,
}: {
  sectionId: string;
}) {
  const match = getAccountItemById(sectionId);
  const title =
    sectionId === "overview" ? "My Account" : (match?.item.label ?? "My Account");
  const description = sectionDescription(sectionId);

  return (
    <>
      <h2 className="text-lg font-light uppercase tracking-[0.14em] text-zinc-900 sm:text-xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-zinc-600">
          {description}
        </p>
      ) : null}

      {sectionId === "my-orders" ? (
        <MyOrdersContent />
      ) : sectionId === "wishlist" ? (
        <MyWishlistContent />
      ) : sectionId === "overview" ? null : (
        <div className="mt-8 border border-zinc-100 bg-zinc-50/40 px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-sm font-light text-zinc-600">
            This section will be available soon. Check back for updates to{" "}
            {title.toLowerCase()}.
          </p>
        </div>
      )}
    </>
  );
}
