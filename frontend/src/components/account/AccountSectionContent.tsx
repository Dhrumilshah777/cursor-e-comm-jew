import MyOrdersContent from "@/components/account/MyOrdersContent";
import { getAccountItemById } from "@/data/accountSections";

function sectionDescription(sectionId: string): string {
  if (sectionId === "overview") {
    return "Manage your profile, orders, and preferences in one place.";
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

  return (
    <>
      <h2 className="text-lg font-light uppercase tracking-[0.14em] text-zinc-900 sm:text-xl">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-zinc-600">
        {sectionDescription(sectionId)}
      </p>

      {sectionId === "my-orders" ? (
        <MyOrdersContent />
      ) : (
        <div className="mt-8 border border-zinc-100 bg-zinc-50/40 px-5 py-8 sm:px-8 sm:py-10">
          {sectionId === "overview" ? (
            <div className="space-y-4 text-sm font-light text-zinc-600">
              <p>
                Welcome back. Use the menu to view orders, update your details,
                manage wishlist items, and explore support resources.
              </p>
              <p className="text-zinc-500 lg:hidden">
                Select a section below to get started.
              </p>
              <p className="hidden text-zinc-500 lg:block">
                Select a section from the menu to get started.
              </p>
            </div>
          ) : (
            <p className="text-sm font-light text-zinc-600">
              This section will be available soon. Check back for updates to{" "}
              {title.toLowerCase()}.
            </p>
          )}
        </div>
      )}
    </>
  );
}
