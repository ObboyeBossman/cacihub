"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";

// ============================================================
// CACI Hub — Account Suspended full-screen state
// Shown when a logged-in user's account has been suspended by an
// administrator. No navigation, no back button — only Sign out.
// ============================================================

export function SuspendedScreen({ name }: { name?: string }) {
  const clearSession = useApp((s) => s.clearSession);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await api.auth.logout();
    } catch {
      // ignore — we clear locally regardless
    } finally {
      clearSession();
      // Hard reload so the session check re-runs cleanly from a logged-out state.
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  };

  return (
    <div className="suspended-root">
      <style>{`
        .suspended-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          min-height: 100dvh;
          background: linear-gradient(160deg, #003a8c 0%, #004ba0 45%, #001f5e 100%);
          position: relative;
          overflow: hidden;
          padding: 48px 32px;
          text-align: center;
        }
        .suspended-bg { position: absolute; inset: 0; pointer-events: none; }
        .suspended-stripe {
          position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: #C60026;
        }
        .suspended-logo-wrap {
          position: relative; width: 112px; height: 112px; margin-bottom: 2rem;
          animation: s-fade-up 0.6s ease both;
        }
        .suspended-logo-img {
          width: 112px; height: 112px; border-radius: 50%; object-fit: cover;
          border: 2.5px solid rgba(255,255,255,0.2); display: block;
        }
        /* Red lock badge overlapping the logo bottom-right */
        .suspended-lock-badge {
          position: absolute; right: -6px; bottom: -6px;
          width: 44px; height: 44px; border-radius: 50%;
          background: #C60026; border: 3px solid #004ba0;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          animation: s-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
        }
        .suspended-title {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 1.75rem; font-weight: 700; color: #fff; line-height: 1.25;
          margin: 0 0 10px; animation: s-fade-up 0.6s ease 0.1s both;
        }
        .suspended-title-bar {
          width: 48px; height: 3px; background: #C60026; border-radius: 9999px;
          margin: 0 auto 1.75rem; animation: s-fade-up 0.6s ease 0.18s both;
        }
        .suspended-body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 1rem; color: rgba(255,255,255,0.78); line-height: 1.6;
          max-width: 320px; margin: 0 0 2.5rem; animation: s-fade-up 0.6s ease 0.24s both;
        }
        .suspended-name {
          display: block; font-weight: 600; color: #fff; margin-bottom: 0.5rem;
        }
        .suspended-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          padding: 0 28px; height: 52px; border-radius: 9999px; border: none;
          background: #C60026; color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 1rem; font-weight: 600; cursor: pointer; margin-bottom: 3rem;
          animation: s-fade-up 0.6s ease 0.32s both; letter-spacing: 0.01em;
          transition: background 0.18s ease, transform 0.12s ease;
        }
        .suspended-btn:hover { background: #E8003A; }
        .suspended-btn:active { transform: scale(0.97); }
        .suspended-btn:disabled { opacity: 0.7; cursor: default; }
        .suspended-btn-icon { width: 20px; height: 20px; flex-shrink: 0; }
        .suspended-spinner {
          width: 20px; height: 20px; flex-shrink: 0;
          border: 2.5px solid rgba(255,255,255,0.35); border-top-color: #fff;
          border-radius: 50%; animation: s-spin 0.8s linear infinite;
        }
        .suspended-footer {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 0.8rem; color: rgba(255,255,255,0.45); line-height: 1.6;
          max-width: 300px; animation: s-fade-up 0.6s ease 0.4s both;
        }
        @keyframes s-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes s-pop {
          from { opacity: 0; transform: scale(0.4); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes s-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .suspended-logo-wrap, .suspended-lock-badge, .suspended-title,
          .suspended-title-bar, .suspended-body, .suspended-btn, .suspended-footer,
          .suspended-spinner { animation: none; }
        }
      `}</style>

      {/* Background concentric rings */}
      <svg className="suspended-bg" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <circle cx="195" cy="422" r="160" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <circle cx="195" cy="422" r="240" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <circle cx="195" cy="422" r="320" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      </svg>

      {/* Logo + red lock badge */}
      <div className="suspended-logo-wrap">
        <Image
          src="/logo.png"
          alt="Christ Apostolic Church International logo"
          width={112}
          height={112}
          className="suspended-logo-img"
          priority
        />
        <span className="suspended-lock-badge" aria-hidden="true">
          {/* Red lock icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </span>
      </div>

      {/* Heading */}
      <h1 className="suspended-title">Account Suspended</h1>
      <div className="suspended-title-bar" />

      {/* Body */}
      <p className="suspended-body">
        {name ? <span className="suspended-name">{name},</span> : null}
        Your account has been suspended. Please contact your assembly administrator to regain access.
      </p>

      {/* Sign out button */}
      <button
        className="suspended-btn"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        {signingOut ? (
          <span className="suspended-spinner" aria-label="Signing out" />
        ) : (
          <svg className="suspended-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        )}
        {signingOut ? "Signing out…" : "Sign out"}
      </button>

      {/* Footer */}
      <p className="suspended-footer">
        Christ Apostolic Church International<br />Assakae Central Assembly
      </p>

      {/* Bottom red stripe */}
      <div className="suspended-stripe" />
    </div>
  );
}
