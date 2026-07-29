"use client";

import { motion } from "framer-motion";
import type { SermonSeries } from "@/lib/sermons";
import { SeriesCard } from "./series-card";
import { SectionHeading } from "./section-heading";

interface SeriesGridProps {
  series: SermonSeries[];
}

export function SeriesGrid({ series }: SeriesGridProps) {
  return (
    <section
      id="series"
      className="relative scroll-mt-20 bg-mesh-light py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Sermon Library"
          title="Explore Our Sermon Series"
          description="Each series takes you on a verse-by-verse journey through Scripture. Click any series to listen to its messages in sequence."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((s, i) => (
            <SeriesCard key={s.id} series={s} index={i} />
          ))}
        </div>

        {series.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-16 text-center"
          >
            <p className="text-slate-500">No sermon series available yet.</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
