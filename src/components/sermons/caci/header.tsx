"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, BookOpen, Home as HomeIcon } from "lucide-react";
import { CaciLogo } from "./logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", target: "home" as const, icon: HomeIcon },
  { label: "Sermons", target: "sermons" as const, icon: BookOpen },
  { label: "About", target: "about" as const, icon: BookOpen },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = true;
  const transparent = isHome && !scrolled && !mobileOpen;

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
          onClick={() => scrollTo("home")}
          className="flex items-center transition-transform hover:scale-[1.02]"
        >
          <CaciLogo theme={transparent ? "dark" : "light"} />
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.target}
              onClick={() => scrollTo(link.target)}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors group",
                transparent
                  ? "text-white/90 hover:text-white"
                  : "text-slate-700 hover:text-[#004BA0]"
              )}
            >
              {link.label}
              <span
                className={cn(
                  "absolute inset-x-4 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100",
                  transparent
                    ? "bg-gradient-to-r from-white to-amber-200"
                    : "bg-gradient-to-r from-[#004BA0] to-[#4D9FFF]"
                )}
              />
            </button>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button
            onClick={() => scrollTo("sermons")}
            className={cn(
              "transition-all shadow-lg",
              transparent
                ? "bg-white text-[#004BA0] shadow-blue-900/30 hover:bg-blue-50 hover:shadow-blue-900/40"
                : "bg-[#004BA0] text-white shadow-blue-500/20 hover:bg-[#003578] hover:shadow-blue-500/30"
            )}
          >
            Explore Sermons
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
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-blue-50 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {navLinks.map((link) => (
                <button
                  key={link.target}
                  onClick={() => scrollTo(link.target)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#004BA0]"
                >
                  <link.icon className="size-4 text-[#004BA0]" />
                  {link.label}
                </button>
              ))}
              <Button
                onClick={() => scrollTo("sermons")}
                className="mt-2 w-full bg-[#004BA0] text-[#FFFFFF] hover:bg-[#003578]"
              >
                Explore Sermons
              </Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
