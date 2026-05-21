import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ConditionalFooter from "@/components/ConditionalFooter";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import "@fortawesome/fontawesome-free/css/all.min.css";
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
  title: "Fashion Jewelry & Luxury Accessories",
  description:
    "Fashion jewelry and plated luxury accessories — rings, necklaces, earrings, and bracelets.",
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
        <Providers>
          <Navbar />
          <main className="flex flex-1 flex-col">{children}</main>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
