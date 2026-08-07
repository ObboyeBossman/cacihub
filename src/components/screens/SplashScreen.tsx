"use client";

import { useEffect, useState } from "react";

// Status messages that cycle during the boot sequence
const STATUS_MESSAGES = [
  "Checking session…",
  "Loading assembly data…",
  "Almost ready…",
];

interface SplashScreenProps {
  /** Called once the splash has completed its minimum display time */
  onReady: () => void;
  /** Pass the session-check promise so splash resolves with it */
  sessionReady: boolean;
}

export function SplashScreen({ onReady, sessionReady }: SplashScreenProps) {
  const [statusIdx, setStatusIdx] = useState(0);
  const [exiting, setExiting] = useState(false);

  // Cycle status text
  useEffect(() => {
    const id = setInterval(() => {
      setStatusIdx((i) => Math.min(i + 1, STATUS_MESSAGES.length - 1));
    }, 1100);
    return () => clearInterval(id);
  }, []);

  // Exit once session is ready — minimum 2.4s to let animations play
  useEffect(() => {
    if (!sessionReady) return;
    const minWait = setTimeout(() => {
      setExiting(true);
      // Give the fade-out 400ms then unmount
      setTimeout(onReady, 400);
    }, 2400);
    return () => clearTimeout(minWait);
  }, [sessionReady, onReady]);

  return (
    <div
      className="splash-root"
      style={{ opacity: exiting ? 0 : 1, transition: "opacity 0.4s ease" }}
    >


      {/* Background concentric rings */}
      <svg className="splash-bg" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <circle cx="195" cy="422" r="160" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <circle cx="195" cy="422" r="240" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <circle cx="195" cy="422" r="320" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      </svg>

      {/* Logo + spinning arc */}
      <div className="splash-logo-wrap">
        <svg
          viewBox="0 0 64 64"
          className="splash-logo-img"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M32 4 L56 12 V32 C56 46 46 56 32 60 C18 56 8 46 8 32 V12 Z" fill="#004BA0" stroke="#003578" strokeWidth="2" />
          <defs>
            <linearGradient id="splashShieldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#004BA0" />
              <stop offset="100%" stopColor="#003578" />
            </linearGradient>
            <linearGradient id="splashCrossGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF1A46" />
              <stop offset="100%" stopColor="#C60026" />
            </linearGradient>
          </defs>
          <path d="M32 8 L52 14.5 V32 C52 43.5 43.5 52.5 32 56 C20.5 52.5 12 43.5 12 32 V14.5 Z" fill="url(#splashShieldGrad)" />
          <g opacity="0.25">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line key={deg} x1="32" y1="32" x2="32" y2="14" stroke="#4D9FFF" strokeWidth="1" transform={`rotate(${deg} 32 32)`} />
            ))}
          </g>
          <rect x="29.5" y="18" width="5" height="22" rx="1" fill="url(#splashCrossGrad)" />
          <rect x="23" y="24.5" width="18" height="5" rx="1" fill="url(#splashCrossGrad)" />
          <path d="M20 44 Q26 41 32 44 Q38 41 44 44 L44 48 Q38 45 32 48 Q26 45 20 48 Z" fill="#ffffff" opacity="0.9" />
          <line x1="32" y1="44" x2="32" y2="48" stroke="#003578" strokeWidth="0.8" />
        </svg>
        {/* Spinning arc SVG */}
        <svg className="splash-arc-svg" viewBox="0 0 132 132" fill="none">
          <circle cx="66" cy="66" r="62" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
          <circle
            className="splash-arc-spinner"
            cx="66"
            cy="66"
            r="62"
            stroke="#E8003A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="210"
            strokeDashoffset="210"
          />
        </svg>
      </div>

      {/* Title */}
      <h1 className="splash-app-name">
        CACI <span className="splash-app-name-accent">Hub</span>
      </h1>

      {/* Tagline */}
      <p className="splash-tagline">Christ Apostolic Church International</p>

      {/* Progress bar + status */}
      <div className="splash-progress-wrap">
        <div className="splash-progress-track">
          <div className="splash-progress-fill" />
        </div>
        <p className="splash-status">{STATUS_MESSAGES[statusIdx]}</p>
      </div>

      {/* Bottom red stripe */}
      <div className="splash-stripe" />
    </div>
  );
}
