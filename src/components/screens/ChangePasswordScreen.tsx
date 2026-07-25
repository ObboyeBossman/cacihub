"use client";

import { useState, useCallback } from "react";
import { CaciLogo } from "@/components/caci/ui";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

export function ChangePasswordScreen() {
  const { user, setUser, resetTo } = useApp();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setError(null);

      if (!currentPw) {
        setError("Please enter your temporary password.");
        return;
      }
      if (newPw.length < 6) {
        setError("New password must be at least 6 characters.");
        return;
      }
      if (newPw !== confirmPw) {
        setError("Passwords don't match.");
        return;
      }

      setLoading(true);
      try {
        const res = await api.auth.changePassword(currentPw, newPw);
        setUser(res.user);
        resetTo(res.user.role === "admin" ? "admin-dashboard" : "member-inbox");
      } catch (err: any) {
        setError(err?.message || "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [currentPw, newPw, confirmPw, setUser, resetTo],
  );

  // Password strength — same logic, drives the 3-bar indicator
  const strength =
    newPw.length === 0 ? null
    : newPw.length < 6 ? "weak"
    : newPw.length < 10 ? "fair"
    : "strong";

  const strengthColor =
    strength === "weak" ? "#c60026"
    : strength === "fair" ? "#e07b00"
    : "#1a7f37";

  const canSubmit = !loading && currentPw.length > 0 && newPw.length >= 6 && newPw === confirmPw;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-sm mx-auto w-full">

        {/* Logo + brand — identical to LoginScreen */}
        <div className="flex flex-col items-center text-center mb-10 animate-fade-in">
          <CaciLogo size={72} className="mb-5" />
          <h1 className="text-[26px] font-bold text-gray-900 leading-tight tracking-tight">
            Set Your Password
          </h1>
          <p className="text-[15px] text-gray-500 mt-1 font-normal">
            {user?.fullName ?? "Assakae Central Assembly"}
          </p>
          <p className="text-[13px] text-gray-400 mt-2 max-w-xs leading-snug">
            Your account has a temporary password. Choose a new one to continue.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 animate-fade-in" noValidate>

          {/* Temporary password */}
          <PillInput
            placeholder="Temporary password"
            type={showCurrent ? "text" : "password"}
            autoComplete="current-password"
            value={currentPw}
            onChange={(v) => { setCurrentPw(v); if (error) setError(null); }}
            disabled={loading}
            showToggle
            showing={showCurrent}
            onToggle={() => setShowCurrent((s) => !s)}
          />

          {/* New password + strength bar */}
          <div>
            <PillInput
              placeholder="New password (min. 6 characters)"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              value={newPw}
              onChange={(v) => { setNewPw(v); if (error) setError(null); }}
              disabled={loading}
              showToggle
              showing={showNew}
              onToggle={() => setShowNew((s) => !s)}
            />
            {/* Strength indicator */}
            {strength && (
              <div className="mt-2 flex items-center gap-2 px-1 animate-fade-in">
                <div className="flex gap-1 flex-1">
                  {(["weak", "fair", "strong"] as const).map((level, i) => {
                    const filled =
                      (strength === "weak" && i === 0) ||
                      (strength === "fair" && i <= 1) ||
                      strength === "strong";
                    return (
                      <div
                        key={level}
                        className="h-1 flex-1 rounded-full transition-colors duration-200"
                        style={{ background: filled ? strengthColor : "#e5e7eb" }}
                      />
                    );
                  })}
                </div>
                <span className="text-[11px] font-medium" style={{ color: strengthColor }}>
                  {strength === "weak" ? "Too short" : strength === "fair" ? "Fair" : "Strong"}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <PillInput
            placeholder="Confirm new password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPw}
            onChange={(v) => { setConfirmPw(v); if (error) setError(null); }}
            disabled={loading}
            showToggle
            showing={showConfirm}
            onToggle={() => setShowConfirm((s) => !s)}
            hasError={confirmPw.length > 0 && confirmPw !== newPw}
          />
          {confirmPw.length > 0 && confirmPw !== newPw && (
            <p className="text-[13px] text-[#c60026] mt-1 px-2 animate-fade-in font-medium">
              Passwords don't match
            </p>
          )}

          {/* General error */}
          {error && (
            <p className="text-[13px] text-[#c60026] px-2 animate-fade-in font-medium">
              {error}
            </p>
          )}

          {/* CTA — navy blue pill, matches Sign In */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-14 font-bold text-[17px] text-white transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
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
                Saving…
              </span>
            ) : (
              "Set Password & Continue"
            )}
          </button>
        </form>

        <p className="mt-auto pt-10 text-center text-[12px] text-gray-300">
          Accounts are provisioned by your assembly administrator.
        </p>
      </div>
    </div>
  );
}

// ── Shared pill input — matches LoginScreen's pill input exactly ──────────────
interface PillInputProps {
  placeholder: string;
  type: string;
  autoComplete?: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  showToggle?: boolean;
  showing?: boolean;
  onToggle?: () => void;
  hasError?: boolean;
}

function PillInput({
  placeholder,
  type,
  autoComplete,
  value,
  onChange,
  disabled,
  showToggle,
  showing,
  onToggle,
  hasError,
}: PillInputProps) {
  return (
    <div
      className="relative transition-all duration-200"
      style={{
        borderRadius: 999,
        border: hasError ? "2px solid #c60026" : "1.5px solid #d1d5db",
        background: "#fff",
        boxShadow: hasError ? "0 0 0 2px rgba(198,0,38,0.08)" : "none",
      }}
    >
      <input
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-14 bg-transparent px-5 pr-14 text-[16px] text-gray-900 placeholder:text-gray-400 outline-none"
        style={{ borderRadius: 999 }}
      />
      {showToggle && onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label={showing ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showing ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      )}
    </div>
  );
}
