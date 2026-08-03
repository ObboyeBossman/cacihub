"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, Phone, Lock, Info, Shield } from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { AssemblySettingsDTO } from "@/lib/types";
import { formatPhoneDisplay } from "@/lib/format";
import {
  CACIButton, CACICard, CACIInput, CACISkeleton, SectionHeading, RoleBadge,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function MemberSettings() {
  const { user, resetTo, clearSession } = useApp();
  const [settings, setSettings] = useState<AssemblySettingsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Change password state
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.settings.get();
        setSettings(res.settings);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.auth.logout();
      clearSession();
      resetTo("login");
      toast.success("Signed out");
    } catch {
      clearSession();
      resetTo("login");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError(null);
    if (!pwCurrent.trim() || !pwNew.trim() || !pwConfirm.trim()) {
      setPwError("Please fill in all password fields.");
      return;
    }
    if (pwNew.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("New password and confirmation do not match.");
      return;
    }
    if (pwNew === pwCurrent) {
      setPwError("New password must be different from your current password.");
      return;
    }
    setPwSaving(true);
    try {
      const res = await api.auth.changePassword(pwCurrent, pwNew);
      if (res.user) setUser(res.user);
      toast.success("Password updated");
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
    } catch (e: any) {
      setPwError(e?.message || "Failed to update password.");
      toast.error(e?.message || "Failed to update password.");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <>
      <MobileHeader title="Settings" />
      <DesktopTopBar title="Settings" subtitle="Manage your account and preferences" />
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4">
        {/* Account */}
        <CACICard>
          <SectionHeading title="My Account" className="mb-3" />
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-caci-blue-bg text-caci-blue flex items-center justify-center font-semibold text-[14px]">
                  {user.fullName.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-n900">{user.fullName}</p>
                  <p className="text-[13px] text-n400">{formatPhoneDisplay(user.phone)}</p>
                </div>
                <RoleBadge role={user.role} />
              </div>
              {user.mustChangePassword && (
                <div className="bg-[#fff8c5] border border-[#9a6700]/20 rounded-lg p-2.5 flex items-start gap-2">
                  <Info size={14} className="text-[#9a6700] shrink-0 mt-0.5" />
                  <p className="text-[12px] text-[#9a6700]">
                    You are required to change your password. Please contact your administrator.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <CACISkeleton className="h-12 w-full" />
          )}
        </CACICard>

        {/* Change password */}
        <CACICard>
          <SectionHeading title="Change Password" className="mb-3" />
          <div className="space-y-3">
            <CACIInput
              label="Current password"
              type="password"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
              leftIcon={<Lock size={16} />}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
            <CACIInput
              label="New password"
              type="password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              leftIcon={<Lock size={16} />}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              error={pwError}
            />
            <CACIInput
              label="Confirm new password"
              type="password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              leftIcon={<Lock size={16} />}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
            <CACIButton
              onClick={handleChangePassword}
              loading={pwSaving}
              disabled={!pwCurrent || !pwNew || !pwConfirm}
              leftIcon={!pwSaving ? <Shield size={15} /> : undefined}
              className="w-full md:w-auto"
            >
              {pwSaving ? "Updating…" : "Update password"}
            </CACIButton>
          </div>
        </CACICard>

        {/* Assembly info */}
        <CACICard>
          <SectionHeading title="My Assembly" className="mb-3" />
          {loading ? (
            <div className="space-y-2">
              <CACISkeleton className="h-4 w-2/3" />
              <CACISkeleton className="h-4 w-1/2" />
            </div>
          ) : settings ? (
            <div className="space-y-2.5 text-[14px]">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-n400 shrink-0" />
                <span className="text-n400 w-24 shrink-0">Assembly</span>
                <span className="text-n900 font-medium">{settings.assemblyName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-n400 shrink-0" />
                <span className="text-n400 w-24 shrink-0">Location</span>
                <span className="text-n900">{settings.assemblyLocation}</span>
              </div>
              {settings.contactPhone && (
                <a href={`tel:+${settings.contactPhone}`} className="flex items-center gap-2 hover:text-caci-blue">
                  <Phone size={15} className="text-n400 shrink-0" />
                  <span className="text-n400 w-24 shrink-0">Phone</span>
                  <span className="text-caci-blue hover:underline">{formatPhoneDisplay(settings.contactPhone)}</span>
                </a>
              )}
              {settings.contactEmail && (
                <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-2 hover:text-caci-blue">
                  <Lock size={15} className="text-n400 shrink-0" />
                  <span className="text-n400 w-24 shrink-0">Email</span>
                  <span className="text-caci-blue hover:underline truncate">{settings.contactEmail}</span>
                </a>
              )}
              {settings.assemblyAddress && (
                <p className="text-[13px] text-n400 pt-2 border-t border-n100 mt-2">
                  {settings.assemblyAddress}
                </p>
              )}
            </div>
          ) : null}
        </CACICard>

        {/* Preferences placeholder */}
        <CACICard>
          <SectionHeading title="Preferences" className="mb-3" />
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-n900">Appearance</p>
                <p className="text-[12px] text-n400">Choose light, dark, or match your device</p>
              </div>
              <ThemeToggle />
            </div>
            <div className="h-px bg-n100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-n900">Push notifications</p>
                <p className="text-[12px] text-n400">Get notified about new broadcasts</p>
              </div>
              <span className="text-[12px] text-[#1a7f37] bg-[#dafbe1] px-2 py-1 rounded-full font-medium">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-n900">Email updates</p>
                <p className="text-[12px] text-n400">Weekly digest of assembly news</p>
              </div>
              <span className="text-[12px] text-n400 bg-n50 px-2 py-1 rounded-full font-medium">Coming soon</span>
            </div>
          </div>
        </CACICard>

        {/* Sign out */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <CACIButton variant="danger" leftIcon={<LogOut size={16} />} className="w-full" loading={loggingOut}>
              Sign Out
            </CACIButton>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out of CACI Hub?</AlertDialogTitle>
              <AlertDialogDescription>
                You will need to sign in again to access your assembly portal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>Sign Out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-center text-[12px] text-n300 pt-2">
          CACI Hub · Assakae Central Assembly · v1.0
        </p>
      </div>
    </>
  );
}
