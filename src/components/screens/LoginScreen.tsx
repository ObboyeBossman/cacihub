"use client";

import { useState, useCallback } from "react";
import { CaciLogo } from "@/components/caci/ui";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { processPhoneInput, normalizeGhanaPhone } from "@/lib/phone";
import { Eye, EyeOff } from "lucide-react";

export function LoginScreen() {
  const { setUser, resetTo } = useApp();
  // phoneDisplay: the formatted string shown in the input ("059 352 9509")
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phoneErrorPulse, setPhoneErrorPulse] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
        resetTo(res.user.role === "admin" ? "admin-dashboard" : "member-inbox");
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

  const fillAdmin = () => {
    setPhoneDisplay("024 400 0001");
    setPassword("CACI@2026!");
    setError(null);
  };
  const fillMember = () => {
    setPhoneDisplay("024 400 0002");
    setPassword("CACI@2026!");
    setError(null);
  };

  const hasError = !!error;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-sm mx-auto w-full">

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
                  ? `2px solid #c60026`
                  : `1.5px solid #d1d5db`,
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
            {/* Inline error below phone field — exactly as screenshot */}
            {error && (
              <p className="text-[13px] text-[#c60026] mt-1.5 px-2 animate-fade-in font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Password input — pill shaped, grey border */}
          <div
            className="relative"
            style={{
              borderRadius: 999,
              border: "1.5px solid #d1d5db",
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
              background: loading ? "#003578" : "#004ba0",
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

        {/* Demo credentials — matching screenshot style */}
        <div className="mt-8 flex flex-col items-center">
          <button
            onClick={() => setShowHelp((s) => !s)}
            className="text-[14px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showHelp ? "Hide demo credentials" : "Show demo credentials"}
          </button>

          {showHelp && (
            <div className="mt-4 w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3 animate-fade-in">
              <p className="text-[12px] text-gray-400 text-center">Tap to auto-fill credentials</p>
              <div className="flex gap-2">
                <button
                  onClick={fillAdmin}
                  className="flex-1 rounded-xl bg-white border border-gray-100 px-3 py-2.5 text-left hover:border-[#004ba0] transition-colors"
                >
                  <p className="text-[12px] font-semibold text-[#004ba0]">Admin (Pastor)</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">024 400 0001</p>
                </button>
                <button
                  onClick={fillMember}
                  className="flex-1 rounded-xl bg-white border border-gray-100 px-3 py-2.5 text-left hover:border-[#004ba0] transition-colors"
                >
                  <p className="text-[12px] font-semibold text-[#004ba0]">Member (Elder)</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">024 400 0002</p>
                </button>
              </div>
              <p className="text-[11px] text-gray-400 text-center">
                Password: <span className="font-mono font-medium text-gray-600">CACI@2026!</span>
              </p>
            </div>
          )}
        </div>

        <p className="mt-auto pt-10 text-center text-[12px] text-gray-300">
          Accounts are provisioned by your assembly administrator.
        </p>
      </div>
    </div>
  );
}
