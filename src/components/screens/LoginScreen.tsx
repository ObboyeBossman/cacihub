"use client";

import { useState, useCallback } from "react";
import { CaciLogo } from "@/components/caci/ui";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { processPhoneInput, normalizeGhanaPhone } from "@/lib/phone";
import { Eye, EyeOff } from "lucide-react";

export function LoginScreen() {
  const { setUser, resetTo } = useApp();
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phoneErrorPulse, setPhoneErrorPulse] = useState(false);

  // Signature interaction: phone border pulses red on error, then settles
  const triggerPhoneError = () => {
    setPhoneErrorPulse(true);
    setTimeout(() => setPhoneErrorPulse(false), 700);
  };

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setError(null);

      const normalized = normalizeGhanaPhone(phoneDisplay);
      if (!normalized) {
        setError("Incorrect phone number or password.");
        triggerPhoneError();
        return;
      }
      if (!password) {
        setError("Incorrect phone number or password.");
        triggerPhoneError();
        return;
      }

      setLoading(true);
      try {
        const res = await api.auth.login(phoneDisplay, password);
        setUser(res.user);
        resetTo(res.user.role === "admin" ? "admin-dashboard" : "member-dashboard");
      } catch (err: any) {
        const msg = err?.message || "Network error. Please try again.";
        setError(msg);
        triggerPhoneError();
      } finally {
        setLoading(false);
      }
    },
    [phoneDisplay, password, setUser, resetTo],
  );

  const hasError = !!error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-page px-6">
      <div className="w-full max-w-sm">

        {/* Logo + brand */}
        <div className="flex flex-col items-center text-center mb-12 animate-fade-in">
          <CaciLogo size={72} className="mb-5" />
          <h1 className="text-[26px] font-bold text-gray-900 leading-tight tracking-tight">
            CACI Hub
          </h1>
          <p className="text-[15px] text-gray-500 mt-1 font-normal">
            Assakae Central Assembly
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 animate-fade-in" noValidate>

          {/* Phone input — pill shaped, error state red border */}
          <div>
            <div
              className="relative transition-all duration-200"
              style={{
                borderRadius: 999,
                border: hasError
                  ? `2px solid var(--color-caci-red)`
                  : `1.5px solid var(--border)`,
                background: "#fff",
                boxShadow: phoneErrorPulse
                  ? "0 0 0 4px rgba(198,0,38,0.12)"
                  : hasError
                  ? "0 0 0 2px rgba(198,0,38,0.08)"
                  : "none",
                transition: "border-color 200ms, box-shadow 200ms",
              }}
            >
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="059 XXX XXXX"
                value={phoneDisplay}
                onChange={(e) => {
                  const { display } = processPhoneInput(e.target.value);
                  setPhoneDisplay(display);
                  if (error) setError(null);
                }}
                disabled={loading}
                className="w-full h-14 bg-transparent px-5 text-[16px] text-gray-900 placeholder:text-gray-400 outline-none"
                style={{ borderRadius: 999 }}
              />
            </div>
            {/* Inline error below phone field */}
            {error && (
              <p className="text-[13px] text-caci-red mt-1.5 px-2 animate-fade-in font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Password input — pill shaped, grey border */}
          <div
            className="relative"
            style={{
              borderRadius: 999,
              border: "1.5px solid var(--border)",
              background: "#fff",
            }}
          >
            <input
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              disabled={loading}
              className="w-full h-14 bg-transparent px-5 pr-14 text-[16px] text-gray-900 placeholder:text-gray-400 outline-none"
              style={{ borderRadius: 999 }}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label={showPw ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPw ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {/* Sign In button — navy blue pill, full width */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 font-bold text-[17px] text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-1"
            style={{
              borderRadius: 999,
              background: loading ? "var(--color-caci-blue-dim)" : "var(--color-caci-blue)",
              boxShadow: "0 2px 12px rgba(0,75,160,0.25)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin size-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
