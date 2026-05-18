import type { Metadata } from "next";
import AccountSectionContent from "@/components/account/AccountSectionContent";

export const metadata: Metadata = {
  title: "My Account | Jewelry",
  description: "Manage your orders, wishlist, account details, and preferences.",
};

export default function AccountOverviewPage() {
  return <AccountSectionContent sectionId="overview" />;
}
