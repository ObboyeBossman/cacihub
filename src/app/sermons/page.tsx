"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/sermons/caci/header";
import { Hero } from "@/components/sermons/caci/hero";
import { SeriesGrid } from "@/components/sermons/caci/series-grid";
import { MinistrySection } from "@/components/sermons/caci/ministry-section";
import { Footer } from "@/components/sermons/caci/footer";
import { SeriesDetail } from "@/components/sermons/caci/series-detail";
import { SermonDetail } from "@/components/sermons/caci/sermon-detail";
import { useSeries, useMinistries } from "@/hooks/use-sermons";
import { useSermonStore } from "@/store/sermons";

export default function SermonsPage() {
  const { series, loading } = useSeries();
  const { ministries, loading: ministriesLoading } = useMinistries();
  const view = useSermonStore((s) => s.view);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  const featured = series.find((s) => s.status === "ongoing") ?? series[0] ?? null;
  const totalSermons = series.reduce((acc, s) => acc + s.sermonCount, 0);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {view.name === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Hero
                featured={featured}
                totalSermons={totalSermons}
                totalSeries={series.length}
              />
              {loading ? (
                <div className="py-24 text-center text-slate-500">
                  Loading sermon series…
                </div>
              ) : (
                <SeriesGrid series={series} />
              )}
              <MinistrySection
                ministries={ministries}
                loading={ministriesLoading}
              />
            </motion.div>
          )}

          {view.name === "series" && (
            <motion.div
              key={`series-${view.seriesId}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {(() => {
                const s = series.find((x) => x.id === view.seriesId);
                if (!s) {
                  return (
                    <div className="flex min-h-[60vh] items-center justify-center">
                      <p className="text-slate-500">Series not found.</p>
                    </div>
                  );
                }
                return <SeriesDetail series={s} />;
              })()}
            </motion.div>
          )}

          {view.name === "sermon" && (
            <motion.div
              key={`sermon-${view.sermonId}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SermonDetail
                sermonId={view.sermonId}
                seriesId={view.seriesId}
                series={
                  view.seriesId
                    ? series.find((x) => x.id === view.seriesId) ?? null
                    : null
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer only on home view */}
      <AnimatePresence>
        {view.name === "home" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
