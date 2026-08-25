"use client";

import { motion } from "framer-motion";
import { ChevronRight, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  totalSermons: number;
}

export function Hero({ totalSermons }: HeroProps) {
  return (
    <section className="relative min-h-[85vh] overflow-hidden bg-mesh-blue">
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

      <div className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-center px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
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
              Explore Spirit-filled messages from our assembly. Each sermon is a
              fresh encounter with Scripture — taught verse by verse, applied to
              everyday life, and anchored in God&apos;s unchanging truth.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Button
                size="lg"
                onClick={() => {
                  document
                    .getElementById("sermons")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group h-12 rounded-full bg-white px-7 text-caci-blue shadow-xl shadow-blue-900/30 hover:bg-blue-50 hover:shadow-blue-900/40"
              >
                Explore Sermons
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
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
                    Sermons Archived
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right — Scripture card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-amber-400/20 via-blue-400/20 to-red-400/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Sparkles className="size-4" /> Anchor Scripture
              </div>
              <blockquote className="mt-4 font-display text-xl italic leading-relaxed text-white">
                &ldquo;Thy word is a lamp unto my feet, and a light unto my path.&rdquo;
              </blockquote>
              <div className="mt-4 text-sm font-semibold text-blue-200">
                — Psalm 119:105 (KJV)
              </div>
            </div>
          </motion.div>
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
