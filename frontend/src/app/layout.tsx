import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ConditionalFooter from "@/components/ConditionalFooter";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import AnalyticsScripts from "@/components/analytics/AnalyticsScripts";
import InitialSiteLoader from "@/components/InitialSiteLoader";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wholesale Gold Jewelry",
  description:
    "Fine gold jewelry — rings, necklaces, earrings, bracelets, and mangalsutra.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col font-sans"
        suppressHydrationWarning
      >
        <AnalyticsScripts />
        <InitialSiteLoader />
        <Providers>
          <ConditionalNavbar />
          <main className="flex flex-1 flex-col">{children}</main>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
