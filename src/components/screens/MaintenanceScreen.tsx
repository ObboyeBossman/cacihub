"use client";



export function MaintenanceScreen() {
  return (
    <div className="maintenance-root">
      <style>{`
        .maintenance-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(160deg, #003a8c 0%, #004ba0 45%, #001f5e 100%);
          position: relative;
          overflow: hidden;
          padding: 48px 32px;
          text-align: center;
        }

        /* Concentric background rings — matches SplashScreen */
        .maintenance-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        /* Bottom red accent stripe — matches SplashScreen */
        .maintenance-stripe {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: #C60026;
        }

        /* Logo container */
        .maintenance-logo-wrap {
          position: relative;
          width: 112px;
          height: 112px;
          margin-bottom: 2.25rem;
          animation: m-fade-up 0.6s ease both;
        }

        .maintenance-logo-img {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          object-fit: cover;
          border: 2.5px solid rgba(255,255,255,0.2);
          display: block;
        }

        /* Spinning arc — identical to SplashScreen, slower for a "waiting" feel */
        .maintenance-arc-svg {
          position: absolute;
          top: -10px;
          left: -10px;
          width: 132px;
          height: 132px;
        }

        .maintenance-arc-spinner {
          transform-origin: 66px 66px;
          animation: m-spin-arc 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        /* Heading */
        .maintenance-title {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.25;
          margin: 0 0 10px;
          animation: m-fade-up 0.6s ease 0.1s both;
        }

        /* Red underline accent under heading */
        .maintenance-title-bar {
          width: 48px;
          height: 3px;
          background: #C60026;
          border-radius: 9999px;
          margin: 0 auto 1.75rem;
          animation: m-fade-up 0.6s ease 0.18s both;
        }

        /* Body copy */
        .maintenance-body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 1rem;
          color: rgba(255,255,255,0.75);
          line-height: 1.6;
          max-width: 300px;
          margin: 0 0 2.5rem;
          animation: m-fade-up 0.6s ease 0.24s both;
        }

        /* CTA button — matches the screenshot pill style */
        .maintenance-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 0 28px;
          height: 52px;
          border-radius: 9999px;
          border: 1.5px solid rgba(198,0,38,0.6);
          background: rgba(198,0,38,0.12);
          color: rgba(255,255,255,0.85);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          cursor: default;
          margin-bottom: 3rem;
          animation: m-fade-up 0.6s ease 0.32s both;
          letter-spacing: 0.01em;
        }

        /* Pulsing clock icon inside button */
        .maintenance-btn-icon {
          width: 20px;
          height: 20px;
          animation: m-pulse 2s ease-in-out infinite;
          flex-shrink: 0;
          color: #E8003A;
        }

        /* Footer note */
        .maintenance-footer {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
          line-height: 1.6;
          max-width: 280px;
          animation: m-fade-up 0.6s ease 0.4s both;
        }

        .maintenance-footer a {
          color: rgba(255,255,255,0.6);
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        /* Keyframes */
        @keyframes m-spin-arc {
          0%   { stroke-dashoffset: 210; transform: rotate(-90deg); }
          50%  { stroke-dashoffset: 50; }
          100% { stroke-dashoffset: 210; transform: rotate(270deg); }
        }

        @keyframes m-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes m-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        @media (prefers-reduced-motion: reduce) {
          .maintenance-arc-spinner,
          .maintenance-btn-icon {
            animation: none;
          }
          .maintenance-logo-wrap,
          .maintenance-title,
          .maintenance-title-bar,
          .maintenance-body,
          .maintenance-btn,
          .maintenance-footer {
            animation: none;
          }
        }
      `}</style>

      {/* Background concentric rings */}
      <svg className="maintenance-bg" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <circle cx="195" cy="422" r="160" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <circle cx="195" cy="422" r="240" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <circle cx="195" cy="422" r="320" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      </svg>

      {/* Logo + spinning arc */}
      <div className="maintenance-logo-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="CACI Logo"
          className="maintenance-logo-img"
          draggable={false}
        />
        <svg className="maintenance-arc-svg" viewBox="0 0 132 132" fill="none">
          <circle cx="66" cy="66" r="62" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
          <circle
            className="maintenance-arc-spinner"
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

      {/* Heading */}
      <h1 className="maintenance-title">
        System Upgrade in<br />Progress
      </h1>
      <div className="maintenance-title-bar" />

      {/* Body */}
      <p className="maintenance-body">
        We&rsquo;re currently upgrading CACI Hub to bring you better performance and features.
        Thank you for your patience.
      </p>

      {/* CTA — non-interactive, just sets expectation */}
      <div className="maintenance-btn" aria-label="System upgrade in progress">
        {/* Pulsing clock icon */}
        <svg className="maintenance-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Come back later
      </div>

      {/* Footer */}
      <p className="maintenance-footer">
        No action is required from you. We&rsquo;ll be back online shortly.<br /><br />
        For support, contact us at{" "}
        <a href="mailto:support@cacihub.org">support@cacihub.org</a>
      </p>

      {/* Bottom red stripe */}
      <div className="maintenance-stripe" />
    </div>
  );
}
