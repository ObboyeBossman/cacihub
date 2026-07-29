"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-[#EFF5FF] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#004BA0]",
            align === "center" ? "mx-auto" : ""
          )}
        >
          <span className="size-1.5 rounded-full bg-[#C60026]" />
          {eyebrow}
        </motion.div>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.1 }}
        className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-base leading-relaxed text-slate-600"
        >
          {description}
        </motion.p>
      )}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className={cn(
          "mt-6 h-1 origin-left rounded-full bg-gradient-to-r from-[#004BA0] via-[#4D9FFF] to-[#C60026]",
          align === "center" ? "mx-auto w-20" : "w-20"
        )}
      />
    </div>
  );
}
