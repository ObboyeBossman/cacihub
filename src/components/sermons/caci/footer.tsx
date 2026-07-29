"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, ArrowUp } from "lucide-react";
import { CaciLogo } from "./logo";

export function Footer() {
  const scrollTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer
      id="about"
      className="relative mt-auto overflow-hidden bg-[#0d1117] text-slate-300"
    >
      {/* Top gradient accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#004BA0] via-[#4D9FFF] to-[#C60026]" />

      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <CaciLogo theme="dark" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              A Spirit-filled assembly devoted to the teaching of God&apos;s
              Word, fervent prayer, and making disciples of all nations. Come
              grow with us.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {["Faith", "Prayer", "Word", "Mission"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Service times */}
          <div>
            <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-white">
              <Clock className="size-4 text-[#4D9FFF]" />
              Service Times
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <div className="font-medium text-slate-200">Sunday School</div>
                <div className="text-slate-400">8:00 AM — 9:00 AM</div>
              </li>
              <li>
                <div className="font-medium text-slate-200">Sunday Worship</div>
                <div className="text-slate-400">9:00 AM — 12:00 PM</div>
              </li>
              <li>
                <div className="font-medium text-slate-200">Bible Study</div>
                <div className="text-slate-400">Wednesday · 6:30 PM</div>
              </li>
              <li>
                <div className="font-medium text-slate-200">Prayer Meeting</div>
                <div className="text-slate-400">Friday · 7:00 PM</div>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {["Sermon Series", "Ministries", "About Us", "Contact"].map(
                (link) => (
                  <li key={link}>
                    <button
                      onClick={() => {
                        const id = link.toLowerCase().split(" ")[0];
                        const el = document.getElementById(id);
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-slate-400 transition-colors hover:text-[#4D9FFF]"
                    >
                      {link}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-3 text-slate-400">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#FF1A46]" />
                <span>
                  Assakae, near Effia-Kwesimintsim
                  <br />
                  Takoradi, Western Region
                  <br />
                  Ghana
                </span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Phone className="size-4 shrink-0 text-[#4D9FFF]" />
                <span>+233 50 123 4567</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Mail className="size-4 shrink-0 text-[#4D9FFF]" />
                <span>hello@assakaecentral.org</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Scripture banner */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-6 text-center"
        >
          <p className="scripture-text text-lg text-slate-300">
            &ldquo;All Scripture is given by inspiration of God, and is
            profitable for doctrine, for reproof, for correction, for
            instruction in righteousness.&rdquo;
          </p>
          <p className="mt-2 text-sm font-semibold text-[#4D9FFF]">
            — 2 Timothy 3:16
          </p>
        </motion.div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Assakae Central Assembly (CACI). All
            rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">
              &ldquo;Jesus Christ is Lord&rdquo;
            </span>
            <button
              onClick={scrollTop}
              className="flex size-9 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-all hover:border-[#4D9FFF] hover:bg-[#004BA0] hover:text-white"
              aria-label="Back to top"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
