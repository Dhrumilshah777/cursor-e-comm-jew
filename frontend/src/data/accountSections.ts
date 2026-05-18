export type AccountNavItem = {
  id: string;
  label: string;
  optional?: boolean;
};

export type AccountNavGroup = {
  id: string;
  title: string;
  items: AccountNavItem[];
};

export const accountNavGroups: AccountNavGroup[] = [
  {
    id: "shopping",
    title: "Shopping",
    items: [
      { id: "my-orders", label: "My Orders" },
      { id: "track-order", label: "Track Order" },
      { id: "wishlist", label: "Wishlist / Saved Pieces" },
      { id: "returns", label: "Returns & Exchanges" },
      { id: "addresses", label: "Saved Addresses" },
      { id: "recently-viewed", label: "Recently Viewed" },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      { id: "personal-details", label: "Personal Details" },
      { id: "phone-number", label: "Phone Number" },
      { id: "email-preferences", label: "Email Preferences" },
      { id: "notifications", label: "Notifications" },
      {
        id: "saved-measurements",
        label: "Saved Measurements (Ring/Bangle Size)",
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [
      { id: "client-care", label: "Client Care" },
      { id: "contact-support", label: "Contact Support" },
      { id: "faq", label: "FAQ" },
      { id: "jewellery-care", label: "Jewellery Care Guide" },
      { id: "ring-size-guide", label: "Ring Size Guide" },
    ],
  },
  {
    id: "policies",
    title: "Policies",
    items: [
      { id: "shipping-policy", label: "Shipping & Delivery Policy" },
      { id: "return-policy", label: "Return & Refund Policy" },
      { id: "privacy-policy", label: "Privacy Policy" },
      { id: "terms", label: "Terms & Conditions" },
    ],
  },
  {
    id: "premium",
    title: "Premium Features",
    items: [
      { id: "certificates", label: "Jewellery Certificates" },
      { id: "recommended", label: "Recommended For You" },
      { id: "gift-orders", label: "Gift Orders" },
      { id: "loyalty", label: "Loyalty / Rewards", optional: true },
      {
        id: "occasion-reminders",
        label: "Occasion Reminders",
        optional: true,
      },
    ],
  },
];

export const defaultAccountSectionId = "overview";

export const accountSectionSlugs = accountNavGroups.flatMap((group) =>
  group.items.map((item) => item.id),
);

export function isAccountSectionSlug(slug: string): boolean {
  return accountSectionSlugs.includes(slug);
}

export function accountSectionPath(sectionId: string): string {
  return `/account/${sectionId}`;
}

export function getAccountItemById(id: string) {
  for (const group of accountNavGroups) {
    const item = group.items.find((entry) => entry.id === id);
    if (item) return { group, item };
  }
  return null;
}

export function getActiveSectionIdFromPathname(pathname: string): string {
  if (pathname === "/account") return defaultAccountSectionId;
  if (pathname.startsWith("/account/my-orders/")) return "my-orders";
  const match = pathname.match(/^\/account\/([^/]+)\/?$/);
  if (match?.[1] && isAccountSectionSlug(match[1])) return match[1];
  return defaultAccountSectionId;
}
