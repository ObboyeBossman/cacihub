import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Assakae Central Assembly — Sermons & Ministry",
  description:
    "The official sermons and ministry hub of Assakae Central Assembly (CACI). Listen to Spirit-filled sermon series, explore God's Word, and grow in faith.",
  keywords: [
    "Assakae Central Assembly",
    "CACI",
    "sermons",
    "church",
    "ministry",
    "Ghana",
    "Pentecost",
  ],
  authors: [{ name: "Assakae Central Assembly" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Assakae Central Assembly — Sermons & Ministry",
    description:
      "Spirit-filled sermon series and ministry resources from Assakae Central Assembly.",
    siteName: "Assakae Central Assembly",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${cormorant.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
