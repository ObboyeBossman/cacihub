"use client";

import { motion } from "framer-motion";
import { BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  totalSermons: number;
}

export function Hero({ totalSermons }: HeroProps) {
  const scrollToSermons = () => {
    document.getElementById("sermons")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[60svh] overflow-hidden bg-mesh-blue flex items-center">
      {/* Decorative blobs */}
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
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
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
          Every message taught at Assakae Central Assembly — verse by verse,
          applied to everyday life, anchored in the unchanging truth of God&apos;s Word.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <Button
            size="lg"
            onClick={scrollToSermons}
            className="group h-12 rounded-full bg-white px-7 text-[#004BA0] shadow-xl shadow-blue-900/30 hover:bg-blue-50 hover:shadow-blue-900/40"
          >
            <BookOpen className="size-4" />
            Browse All Sermons
          </Button>
        </motion.div>

        {/* Sermon count stat */}
        {totalSermons > 0 && (
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
          </motion.div>
        )}
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" className="size-full" preserveAspectRatio="none">
          <path
            d="M0,30 C360,60 720,0 1080,25 C1260,38 1380,30 1440,25 L1440,60 L0,60 Z"
            fill="#fbfcfe"
          />
        </svg>
      </div>
    </section>
  );
}
