"use client";

import Link from "next/link";
import { Great_Vibes, Jost } from "next/font/google";
import { FormEvent, useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  IoCarOutline,
  IoCardOutline,
  IoLockClosedOutline,
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoPaypal,
  IoLogoPinterest,
  IoLogoWhatsapp,
  IoRibbonOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const logoScript = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
});

const shopLinks = [
  { href: "/new-arrivals", label: "New Arrivals" },
  { href: "/collections/rings", label: "Rings" },
  { href: "/collections/necklaces", label: "Necklaces" },
  { href: "/collections/earrings", label: "Earrings" },
  { href: "/collections/bracelets", label: "Bracelets" },
  { href: "/collections", label: "Collections" },
] as const;

const supportLinks = [
  { href: "/contact", label: "Contact Us" },
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/return-policy", label: "Return Policy" },
  { href: "/faqs", label: "FAQs" },
  { href: "/track-order", label: "Track Order" },
] as const;

const aboutLinks = [
  { href: "/about", label: "About Us" },
  { href: "/our-story", label: "Our Story" },
  { href: "/craftsmanship", label: "Craftsmanship" },
  { href: "/sustainability", label: "Sustainability" },
] as const;

const socialLinks = [
  {
    href: "https://instagram.com",
    label: "Instagram",
    Icon: IoLogoInstagram,
  },
  {
    href: "https://facebook.com",
    label: "Facebook",
    Icon: IoLogoFacebook,
  },
  {
    href: "https://pinterest.com",
    label: "Pinterest",
    Icon: IoLogoPinterest,
  },
] as const;

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
] as const;

const trustItems: { Icon: IconType; label: string }[] = [
  { Icon: IoLockClosedOutline, label: "SSL Secure" },
  { Icon: IoRibbonOutline, label: "Hallmarked Gold" },
  { Icon: IoCarOutline, label: "Insured Shipping" },
  { Icon: IoShieldCheckmarkOutline, label: "Secure Checkout" },
];

const paymentIcons: { Icon: IconType; label: string }[] = [
  { Icon: IoCardOutline, label: "Visa" },
  { Icon: IoCardOutline, label: "Mastercard" },
  { Icon: IoCardOutline, label: "American Express" },
  { Icon: IoLogoPaypal, label: "PayPal" },
];

const linkClass =
  "text-sm font-light text-zinc-600 transition-colors hover:text-zinc-900";

const headingClass =
  "text-[11px] font-normal uppercase tracking-[0.22em] text-zinc-900";

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className={headingClass}>{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FooterLinkList({
  links,
}: {
  links: readonly { href: string; label: string }[];
}) {
  return (
    <ul className="space-y-2.5">
      {links.map(({ href, label }) => (
        <li key={label}>
          <Link href={href} className={linkClass}>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("success");
    setEmail("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
    >
      <label htmlFor="footer-newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="footer-newsletter-email"
        type="email"
        name="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "success") setStatus("idle");
        }}
        placeholder="Your email address"
        required
        autoComplete="email"
        className="min-w-0 flex-1 border border-zinc-300 bg-white px-4 py-3 text-sm font-light text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 bg-zinc-900 px-6 py-3 text-[11px] font-normal uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
      >
        Subscribe
      </button>
      {status === "success" ? (
        <p className="w-full text-xs font-light text-zinc-600">
          Thank you for joining our world of jewellery.
        </p>
      ) : null}
    </form>
  );
}

export default function Footer() {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const whatsappHref = waNumber
    ? `https://wa.me/${waNumber}`
    : "https://wa.me/";

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`${jost.className} mt-auto w-full border-t border-zinc-200 bg-[#faf8f5]`}
      aria-label="Site footer"
    >
      <div className="border-b border-zinc-200/80">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-2xl text-center lg:max-w-3xl">
            <h2 className="text-xl font-light tracking-wide text-zinc-950 sm:text-2xl md:text-3xl">
              Join Our World of Jewellery
            </h2>
            <p className="mt-2 text-sm font-light text-zinc-600">
              Be the first to discover new arrivals, exclusive offers, and
              collection launches.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 xl:gap-10">
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="inline-block"
              aria-label="Home"
            >
              <span
                className={`${logoScript.className} block text-4xl leading-none text-zinc-950 sm:text-[2.75rem]`}
              >
                Jewelry
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm font-light leading-relaxed text-zinc-600">
              Timeless jewellery crafted with elegance and precision.
            </p>
            <div className="mt-6 flex items-center gap-4">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-900"
                  aria-label={label}
                >
                  <Icon className="text-sm" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:col-span-1 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-3">
            <FooterColumn title="Shop">
              <FooterLinkList links={shopLinks} />
            </FooterColumn>
            <FooterColumn title="Customer Support">
              <FooterLinkList links={supportLinks} />
            </FooterColumn>
            <FooterColumn title="About">
              <FooterLinkList links={aboutLinks} />
            </FooterColumn>
          </div>

          <div className="lg:col-span-3">
            <FooterColumn title="Contact">
              <ul className="space-y-3 text-sm font-light text-zinc-600">
                <li>
                  <a
                    href="mailto:hello@jewelry.com"
                    className="transition-colors hover:text-zinc-900"
                  >
                    hello@jewelry.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+919876543210"
                    className="transition-colors hover:text-zinc-900"
                  >
                    +91 98765 43210
                  </a>
                </li>
                <li>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 transition-colors hover:text-zinc-900"
                  >
                    <IoLogoWhatsapp className="text-base" aria-hidden="true" />
                    WhatsApp
                  </a>
                </li>
                <li className="leading-relaxed">
                  12, Jewellers Lane, Mumbai,
                  <br />
                  Maharashtra 400001, India
                </li>
              </ul>
            </FooterColumn>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200/80 bg-[#f5f1ed]/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 lg:flex-row lg:gap-8">
            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6">
              {trustItems.map(({ Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-2 text-xs font-light text-zinc-600"
                >
                  <Icon className="text-sm text-zinc-700" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {paymentIcons.map(({ Icon, label }) => (
                <span
                  key={label}
                  className="flex h-8 items-center justify-center text-2xl text-zinc-500"
                  title={label}
                >
                  <Icon aria-label={label} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p className="text-xs font-light text-zinc-400">
            © {currentYear} Jewelry. All Rights Reserved.
          </p>
          <nav
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
            aria-label="Legal"
          >
            {legalLinks.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className="text-xs font-light text-zinc-400 transition-colors hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

