"use client";

import { useState, useCallback } from "react";
import { CaciLogo, CACIButton, CACIInput } from "@/components/caci/ui";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";

export function ChangePasswordScreen() {
  const { user, setUser, resetTo } = useApp();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setError(null);

      if (!currentPw) {
        setError("Please enter your current password.");
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
        // Update user in store — mustChangePassword is now false
        setUser(res.user);
        // Navigate to their portal
        resetTo(res.user.role === "admin" ? "admin-dashboard" : "member-inbox");
      } catch (err: any) {
        setError(err?.message || "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [currentPw, newPw, confirmPw, setUser, resetTo],
  );

  const strength = newPw.length === 0 ? null : newPw.length < 6 ? "weak" : newPw.length < 10 ? "fair" : "strong";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex flex-col justify-center px-6 pt-12 pb-8 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10 animate-fade-in">
          <div className="size-16 rounded-2xl bg-caci-blue/10 flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-caci-blue" />
          </div>
          <h1 className="text-[22px] font-bold text-n900 leading-tight">Set Your Password</h1>
          <p className="text-[14px] text-n400 mt-2 max-w-xs">
            Your account was provisioned with a temporary password. Choose a new one to continue.
          </p>
          {user?.fullName && (
            <p className="text-[13px] text-caci-blue font-medium mt-2">{user.fullName}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in" noValidate>
          {/* Current / temporary password */}
          <CACIInput
            label="Temporary Password"
            type={showCurrent ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter the password you were given"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            error={null}
            leftIcon={<Lock size={18} />}
            rightAdornment={
              <button
                type="button"
                onClick={() => setShowCurrent((s) => !s)}
                className="size-9 flex items-center justify-center rounded-md text-n400 hover:text-n700 hover:bg-n50"
                aria-label={showCurrent ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            disabled={loading}
          />

          {/* New password */}
          <div>
            <CACIInput
              label="New Password"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 6 characters"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              error={null}
              leftIcon={<Lock size={18} />}
              rightAdornment={
                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  className="size-9 flex items-center justify-center rounded-md text-n400 hover:text-n700 hover:bg-n50"
                  aria-label={showNew ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              disabled={loading}
            />
            {/* Strength indicator */}
            {strength && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {(["weak", "fair", "strong"] as const).map((level, i) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                        strength === "weak" && i === 0
                          ? "bg-caci-red"
                          : strength === "fair" && i <= 1
                            ? "bg-[#e07b00]"
                            : strength === "strong"
                              ? "bg-caci-green"
                              : "bg-n100"
                      }`}
                    />
                  ))}
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    strength === "weak"
                      ? "text-caci-red"
                      : strength === "fair"
                        ? "text-[#e07b00]"
                        : "text-caci-green"
                  }`}
                >
                  {strength === "weak" ? "Too short" : strength === "fair" ? "Fair" : "Strong"}
                </span>
              </div>
            )}
          </div>

          {/* Confirm */}
          <CACIInput
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            error={
              confirmPw.length > 0 && confirmPw !== newPw
                ? "Passwords don't match"
                : null
            }
            leftIcon={<Lock size={18} />}
            disabled={loading}
          />

          {error && (
            <div className="bg-caci-red-bg border border-caci-red/20 rounded-lg p-3 animate-fade-in">
              <p className="text-[14px] text-caci-red">{error}</p>
            </div>
          )}

          <CACIButton
            type="submit"
            size="lg"
            loading={loading}
            className="w-full"
            disabled={loading || newPw !== confirmPw || newPw.length < 6}
          >
            {loading ? "Saving…" : "Set Password & Continue"}
          </CACIButton>
        </form>

        <p className="mt-auto pt-8 text-center text-[12px] text-n300">
          CACI Hub · Assakae Central Assembly
        </p>
      </div>
    </div>
  );
}
