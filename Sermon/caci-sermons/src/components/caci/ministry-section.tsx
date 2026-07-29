"use client";

import { motion } from "framer-motion";
import {
  Baby,
  Flame,
  Heart,
  Shield,
  Globe,
  Music,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Ministry } from "@/lib/sermons";
import { SectionHeading } from "./section-heading";

const iconMap: Record<string, LucideIcon> = {
  baby: Baby,
  flame: Flame,
  heart: Heart,
  shield: Shield,
  globe: Globe,
  music: Music,
};

const gradients = [
  "from-blue-500 to-blue-700",
  "from-red-500 to-red-700",
  "from-cyan-500 to-blue-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
];

interface MinistrySectionProps {
  ministries: Ministry[];
  loading: boolean;
}

export function MinistrySection({ ministries, loading }: MinistrySectionProps) {
  return (
    <section
      id="ministries"
      className="relative scroll-mt-20 overflow-hidden bg-white py-20 sm:py-28"
    >
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/4 size-96 rounded-full bg-blue-50 blur-3xl" />
        <div className="absolute right-0 bottom-1/4 size-96 rounded-full bg-red-50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Ministries"
          title="Serving Together, Growing Together"
          description="Every member has a place to belong and serve. Explore our ministries and find where you can grow and contribute."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-2xl bg-slate-100"
                />
              ))
            : ministries.map((m, i) => {
                const Icon = iconMap[m.icon ?? ""] ?? Users;
                const gradient = gradients[i % gradients.length];
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: Math.min(i * 0.08, 0.4) }}
                    whileHover={{ y: -6 }}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl hover:shadow-blue-500/10"
                  >
                    {/* Icon */}
                    <div
                      className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                    >
                      <Icon className="size-7 text-white" />
                    </div>

                    <h3 className="mt-4 font-display text-lg font-bold text-slate-900">
                      {m.name}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {m.description}
                    </p>

                    {m.leader && (
                      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#004BA0]">
                          {m.leader
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-400">
                            Lead
                          </div>
                          <div className="text-xs font-medium text-slate-700">
                            {m.leader}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hover gradient line */}
                    <div
                      className={`absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r ${gradient} transition-transform duration-300 group-hover:scale-x-100`}
                    />
                  </motion.div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
