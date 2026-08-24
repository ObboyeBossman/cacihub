"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { CaciLogo } from "./logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = !scrolled && !mobileOpen;

  const scrollToSermons = () => {
    setMobileOpen(false);
    document.getElementById("sermons")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        transparent
          ? "bg-transparent"
          : "bg-white/85 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,75,160,0.08)] border-b border-blue-50"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={scrollToTop}
          className="flex items-center transition-transform hover:scale-[1.02]"
        >
          <CaciLogo theme={transparent ? "dark" : "light"} />
        </button>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Button
            onClick={scrollToSermons}
            className={cn(
              "transition-all shadow-lg",
              transparent
                ? "bg-white text-[#004BA0] shadow-blue-900/30 hover:bg-blue-50 hover:shadow-blue-900/40"
                : "bg-[#004BA0] text-white shadow-blue-500/20 hover:bg-[#003578] hover:shadow-blue-500/30"
            )}
          >
            Browse Sermons
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className={cn(
            "flex size-10 items-center justify-center rounded-lg transition-colors md:hidden",
            transparent
              ? "text-white hover:bg-white/15"
              : "text-slate-700 hover:bg-slate-100"
          )}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-blue-50 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <div className="px-4 py-3">
              <Button
                onClick={scrollToSermons}
                className="w-full bg-[#004BA0] text-white hover:bg-[#003578]"
              >
                Browse Sermons
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
