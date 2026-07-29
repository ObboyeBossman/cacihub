"use client";

import { motion } from "framer-motion";
import { ChevronRight, Play, Sparkles, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SermonSeries } from "@/lib/sermons";
import { useSermonStore } from "@/store/sermons";

interface HeroProps {
  featured: SermonSeries | null;
  totalSermons: number;
  totalSeries: number;
}

export function Hero({ featured, totalSermons, totalSeries }: HeroProps) {
  const openSeries = useSermonStore((s) => s.openSeries);

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-mesh-blue">
      {/* Decorative floating shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-20 top-32 size-72 rounded-full bg-blue-400/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 40, 0], x: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute right-0 top-1/3 size-96 rounded-full bg-red-500/10 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 left-1/3 size-64 rounded-full bg-cyan-300/10 blur-3xl"
        />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          {/* Left — text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-blue-100 backdrop-blur-md"
            >
              <Sparkles className="size-3.5 text-amber-300" />
              Assakae Central Assembly · Takoradi, Ghana
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mt-6 font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl"
            >
              Feed on the
              <br />
              <span className="bg-gradient-to-r from-blue-200 via-white to-amber-200 bg-clip-text text-transparent">
                Word of God
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-blue-100/90"
            >
              Journey through our Spirit-filled sermon series. Each message is a
              fresh encounter with Scripture — taught verse by verse, applied to
              everyday life, and anchored in the unchanging truth of God&apos;s
              Word.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              {featured && (
                <Button
                  size="lg"
                  onClick={() => openSeries(featured.id)}
                  className="group h-12 rounded-full bg-white px-7 text-[#004BA0] shadow-xl shadow-blue-900/30 hover:bg-blue-50 hover:shadow-blue-900/40"
                >
                  <Play className="size-4 fill-current transition-transform group-hover:scale-110" />
                  Listen to Latest Series
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  document
                    .getElementById("series")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="h-12 rounded-full border-white/30 bg-white/5 text-white backdrop-blur-md hover:bg-white/15 hover:text-white"
              >
                Browse All Series
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="mt-12 flex gap-8"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                  <BookOpen className="size-5 text-amber-300" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-white">
                    {totalSermons}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-blue-200/70">
                    Sermons
                  </div>
                </div>
              </div>
              <div className="w-px bg-white/15" />
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                  <Sparkles className="size-5 text-amber-300" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-white">
                    {totalSeries}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-blue-200/70">
                    Series
                  </div>
                </div>
              </div>
              <div className="hidden w-px bg-white/15 sm:block" />
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex size-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                  <Users className="size-5 text-amber-300" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-white">
                    6
                  </div>
                  <div className="text-xs uppercase tracking-wider text-blue-200/70">
                    Ministries
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right — featured card */}
          {featured && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ y: -8 }}
              onClick={() => openSeries(featured.id)}
              className="group relative block text-left"
            >
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-amber-400/20 via-blue-400/20 to-red-400/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl">
                {/* Cover */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {featured.coverImage && (
                    <img
                      src={featured.coverImage}
                      alt={featured.title}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#004BA0] via-[#004BA0]/40 to-transparent" />
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[#C60026] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                    <span className="size-1.5 animate-pulse rounded-full bg-white" />
                    Ongoing Series
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-xs font-medium uppercase tracking-wider text-blue-100">
                      {featured.theme}
                    </div>
                    <h3 className="mt-1 font-display text-2xl font-bold text-white">
                      {featured.title}
                    </h3>
                  </div>
                </div>
                {/* Body */}
                <div className="space-y-4 p-5">
                  <p className="line-clamp-2 text-sm leading-relaxed text-blue-50/80">
                    {featured.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-blue-100">
                      <BookOpen className="size-3.5" />
                      {featured.sermonCount} messages ·{" "}
                      {featured.anchorText ?? ""}
                    </div>
                    <div className="flex size-9 items-center justify-center rounded-full bg-white text-[#004BA0] transition-transform group-hover:scale-110">
                      <Play className="size-4 fill-current" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          )}
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 100"
          className="size-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,50 C360,100 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,100 L0,100 Z"
            fill="#fbfcfe"
          />
        </svg>
      </div>
    </section>
  );
}
