"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
        <Image
          src="/logo.png"
          alt="CACI Logo"
          width={112}
          height={112}
          className="splash-logo-img"
          priority
        />
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
