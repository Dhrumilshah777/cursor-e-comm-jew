import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AccountSectionContent from "@/components/account/AccountSectionContent";
import {
  accountSectionSlugs,
  getAccountItemById,
  isAccountSectionSlug,
} from "@/data/accountSections";

type PageProps = {
  params: Promise<{ section: string }>;
};

export function generateStaticParams() {
  return accountSectionSlugs.map((section) => ({ section }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  if (!isAccountSectionSlug(section)) {
    return { title: "My Account | Jewelry" };
  }

  const match = getAccountItemById(section);
  return {
    title: `${match?.item.label ?? "Account"} | Jewelry`,
    description: `Manage ${match?.item.label.toLowerCase() ?? "your account"}.`,
  };
}

export default async function AccountSectionPage({ params }: PageProps) {
  const { section } = await params;

  if (!isAccountSectionSlug(section)) {
    notFound();
  }

  return <AccountSectionContent sectionId={section} />;
}
