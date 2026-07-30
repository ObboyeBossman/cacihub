import type { Metadata } from "next";

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
  ],
  authors: [{ name: "Assakae Central Assembly" }],
  openGraph: {
    title: "Assakae Central Assembly — Sermons & Ministry",
    description:
      "Spirit-filled sermon series and ministry resources from Assakae Central Assembly.",
    siteName: "Assakae Central Assembly",
    type: "website",
  },
};

export default function SermonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="sermons-root">{children}</div>;
}
