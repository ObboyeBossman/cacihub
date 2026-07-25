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
      <style>{`
        .splash-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #004BA0;
          position: relative;
          overflow: hidden;
          gap: 0;
        }

        /* Subtle concentric background rings */
        .splash-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        /* Bottom red accent stripe */
        .splash-stripe {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: #C60026;
        }

        /* Logo container */
        .splash-logo-wrap {
          position: relative;
          width: 112px;
          height: 112px;
          margin-bottom: 1.75rem;
          animation: splash-fade-up 0.6s ease both;
        }

        .splash-logo-img {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          object-fit: cover;
          border: 2.5px solid rgba(255,255,255,0.2);
          display: block;
        }

        /* Spinning arc around logo */
        .splash-arc-svg {
          position: absolute;
          top: -10px;
          left: -10px;
          width: 132px;
          height: 132px;
        }

        .splash-arc-spinner {
          transform-origin: 66px 66px;
          animation: splash-spin-arc 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        /* App name */
        .splash-app-name {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 2rem;
          font-weight: 500;
          color: #fff;
          margin: 0 0 5px;
          letter-spacing: -0.01em;
          animation: splash-fade-up 0.6s ease 0.12s both;
        }

        .splash-app-name-accent {
          color: #E8003A;
        }

        /* Tagline */
        .splash-tagline {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-align: center;
          margin: 0 0 2.75rem;
          animation: splash-fade-up 0.6s ease 0.22s both;
        }

        /* Progress bar */
        .splash-progress-wrap {
          width: 200px;
          animation: splash-fade-up 0.6s ease 0.35s both;
        }

        .splash-progress-track {
          height: 3px;
          background: rgba(255,255,255,0.12);
          border-radius: 9999px;
          overflow: hidden;
        }

        .splash-progress-fill {
          height: 100%;
          border-radius: 9999px;
          background: #E8003A;
          width: 0%;
          animation: splash-bar-grow 3.5s ease-out forwards;
        }

        .splash-status {
          margin-top: 12px;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.35);
          text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          min-height: 1.2em;
          transition: opacity 0.3s ease;
        }

        /* Keyframes */
        @keyframes splash-spin-arc {
          0%   { stroke-dashoffset: 210; transform: rotate(-90deg); }
          50%  { stroke-dashoffset: 50; }
          100% { stroke-dashoffset: 210; transform: rotate(270deg); }
        }

        @keyframes splash-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes splash-bar-grow {
          0%   { width: 0%; }
          100% { width: 95%; }
        }
      `}</style>

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
