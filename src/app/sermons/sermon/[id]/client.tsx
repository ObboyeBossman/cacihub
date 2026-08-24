"use client";

import { SermonDetail } from "@/components/sermons/caci/sermon-detail";
import { Header } from "@/components/sermons/caci/header";
import type { Sermon } from "@/lib/sermons";

interface Props {
  sermon: Sermon;
}

export function PublicSermonClient({ sermon }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <SermonDetail sermon={sermon} />
      </main>
    </div>
  );
}
