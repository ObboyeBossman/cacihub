"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell, LogOut, Phone, Lock, Info, Shield, Edit, Users, Check,
  AlertCircle, CalendarCheck, X, User, MapPin, Calendar, Briefcase,
  Heart, MessageCircle, RotateCcw, SlidersHorizontal, Navigation,
  Palette, Move, Grip, Zap, Clock, Maximize, Eye, Hand,
  Moon, ChevronRight, KeyRound, Building2, HelpCircle, FileText,
  ScrollText, Settings,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { MemberDTO, GroupDTO, AttendanceDTO, AssemblySettingsDTO } from "@/lib/types";
import { SERVICE_TYPE_LABELS } from "@/lib/types";
import { formatDate, formatPhoneDisplay } from "@/lib/format";
import {
  CACIButton, CACICard, CaciAvatar, CACISkeleton, EmptyState,
  MembershipStatusBadge, SectionHeading, RoleBadge, CACIInput,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/lib/nav";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import { Slider } from "@/components/ui/slider";
import { useFabSettings, FAB_DEFAULTS, type FabSettings } from "@/lib/fab-settings";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── View type ──
type SettingsView = "main" | "profile" | "account" | "navigation";

// ── Settings row types ──
interface ToggleRow {
  key: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  type: "toggle";
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}

interface NavRow {
  key: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  type: "nav";
  value?: string;
  onClick: () => void;
}

type SettingsRow = ToggleRow | NavRow;

// ── Main Settings Component ──

export function MemberSettings({ initialTab }: { initialTab?: string }) {
  const [view, setView] = useState<SettingsView>("main");

  useEffect(() => {
    if (initialTab === "profile") setView("profile");
    else if (initialTab === "account") setView("account");
    else if (initialTab === "navigation") setView("navigation");
  }, [initialTab]);

  const goBack = useCallback(() => setView("main"), []);

  if (view === "profile") return <ProfileView onBack={goBack} />;
  if (view === "account") return <AccountView onBack={goBack} />;
  if (view === "navigation") return <NavigationView onBack={goBack} />;

  return <MainSettingsView onNavigate={setView} />;
}

// ============================================================
// Main Settings View — iOS-style grouped list (matches reference)
// ============================================================

function MainSettingsView({ onNavigate }: { onNavigate: (v: SettingsView) => void }) {
  const { user, navigate, resetTo, clearSession } = useApp();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [settings, setSettings] = useState<AssemblySettingsDTO | null>(null);

  useEffect(() => {
    (async () => {
      try { const res = await api.settings.get(); setSettings(res.settings); } catch {}
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

  const preferencesRows: SettingsRow[] = [
    {
      key: "notifications",
      type: "toggle",
      icon: <Bell size={18} />,
      label: "Push notifications",
      description: "Get notified about new broadcasts and messages",
      checked: notificationsOn,
      onCheckedChange: setNotificationsOn,
    },
    {
      key: "darkmode",
      type: "toggle",
      icon: <Moon size={18} />,
      label: "Dark mode",
      description: "Use a darker colour scheme",
      checked: resolvedTheme === "dark",
      onCheckedChange: () => toggleTheme(),
    },
  ];

  const accountRows: SettingsRow[] = [
    {
      key: "password",
      type: "nav",
      icon: <KeyRound size={18} />,
      label: "Change password",
      description: "Update your account password",
      onClick: () => onNavigate("account"),
    },
    {
      key: "assembly",
      type: "nav",
      icon: <Building2 size={18} />,
      label: "My assembly",
      description: settings?.assemblyName,
      onClick: () => onNavigate("account"),
    },
    {
      key: "fab",
      type: "nav",
      icon: <SlidersHorizontal size={18} />,
      label: "Navigation settings",
      description: "Customise the floating action button",
      onClick: () => onNavigate("navigation"),
    },
  ];

  const aboutRows: SettingsRow[] = [
    {
      key: "faq",
      type: "nav",
      icon: <HelpCircle size={18} />,
      label: "FAQ",
      description: "Frequently asked questions",
      onClick: () => {},
    },
    {
      key: "terms",
      type: "nav",
      icon: <FileText size={18} />,
      label: "Terms of service",
      description: "Usage terms and conditions",
      onClick: () => {},
    },
    {
      key: "privacy",
      type: "nav",
      icon: <ScrollText size={18} />,
      label: "Privacy policy",
      description: "How we handle your data",
      onClick: () => {},
    },
  ];

  return (
    <>
      <MobileHeader title="Settings" />
      <DesktopTopBar title="Settings" subtitle="Manage your preferences and account" />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-6 animate-fade-in pb-32 md:pb-8">

        {/* ── Profile header card ── */}
        <button
          onClick={() => onNavigate("profile")}
          className={cn(
            "w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border",
            "transition-all duration-200 hover:shadow-md active:scale-[0.98] tap-squish",
            "text-left group"
          )}
        >
          <CaciAvatar
            name={user?.fullName || ""}
            size={56}
            className="ring-2 ring-caci-blue/20"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-semibold text-foreground truncate">
              {user?.fullName || "Loading..."}
            </h2>
            <p className="text-[14px] text-muted-foreground truncate mt-0.5">
              {user?.phone ? formatPhoneDisplay(user.phone) : "Member"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {user?.role && <RoleBadge role={user.role} />}
            <ChevronRight size={18} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* ── Preferences group ── */}
        <SettingsGroup title="Preferences" rows={preferencesRows} />

        {/* ── Account group ── */}
        <SettingsGroup title="Account" rows={accountRows} />

        {/* ── About group ── */}
        <SettingsGroup title="About" rows={aboutRows} />

        {/* ── Sign out ── */}
        <div className="pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={loggingOut}
                className={cn(
                  "w-full flex items-center justify-center gap-2 h-12 rounded-full",
                  "bg-card border border-border text-destructive font-semibold text-[16px]",
                  "transition-all duration-200 hover:shadow-md active:scale-[0.97] tap-squish",
                  "disabled:opacity-60"
                )}
              >
                {loggingOut ? (
                  <span className="animate-pulse">Signing out...</span>
                ) : (
                  <>
                    <LogOut size={18} />
                    Sign Out
                  </>
                )}
              </button>
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
        </div>

        <p className="text-center text-[12px] text-muted-foreground pt-2">
          CACI Hub · Assakae Central Assembly
        </p>
      </div>
    </>
  );
}

// ============================================================
// Settings Group — grouped card with rows
// ============================================================

function SettingsGroup({
  title,
  rows,
}: {
  title?: string;
  rows: SettingsRow[];
}) {
  return (
    <div className="space-y-2">
      {title && (
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
          {title}
        </p>
      )}
      <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
        {rows.map((row) => (
          <SettingsRowItem key={row.key} row={row} isFirst={row === rows[0]} isLast={row === rows[rows.length - 1]} />
        ))}
      </div>
    </div>
  );
}

function SettingsRowItem({
  row,
  isFirst,
  isLast,
}: {
  row: SettingsRow;
  isFirst: boolean;
  isLast: boolean;
}) {
  if (row.type === "toggle") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 h-[52px] transition-colors duration-150",
          !isFirst && "pl-[52px]"
        )}
      >
        {isFirst && (
          <div className="flex size-[30px] items-center justify-center shrink-0 text-muted-foreground">
            {row.icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[16px] text-foreground leading-tight">{row.label}</p>
        </div>
        <Switch
          checked={row.checked}
          onCheckedChange={row.onCheckedChange}
          className="data-[state=checked]:bg-caci-blue"
        />
      </div>
    );
  }

  // Nav row
  const NavRow = row as NavRow;
  return (
    <button
      onClick={NavRow.onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 min-h-[52px] text-left",
        "transition-colors duration-150 hover:bg-muted/50 active:bg-muted tap-squish",
        !isFirst && "pl-[52px]"
      )}
    >
      {isFirst && (
        <div className="flex size-[30px] items-center justify-center shrink-0 text-muted-foreground">
          {NavRow.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[16px] text-foreground leading-tight">{NavRow.label}</p>
      </div>
      {NavRow.description && (
        <p className="text-[14px] text-muted-foreground truncate max-w-[140px] hidden sm:block">
          {NavRow.description}
        </p>
      )}
      <ChevronRight size={16} className="text-muted-foreground/60 shrink-0" />
    </button>
  );
}

// ============================================================
// Profile View — moved from standalone ProfileTab
// ============================================================

function ProfileView({ onBack }: { onBack: () => void }) {
  const { user, navigate, setParam } = useApp();
  const [member, setMember] = useState<MemberDTO | null>(null);
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.memberId) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const [m, g, att] = await Promise.all([
          api.members.get(user.memberId!),
          api.groups.list({ memberId: user.memberId }),
          api.attendance.list({ memberId: user.memberId }).catch(() => ({ attendance: [] })),
        ]);
        if (!mounted) return;
        setMember(m.member);
        setGroups(g.groups);
        setAttendance(att.attendance.slice(0, 8));
      } catch {} finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.memberId]);

  const goToGroup = (id: string) => {
    setParam("groupId", id);
    navigate("member-group-chat");
  };

  if (loading) {
    return (
      <>
        <MobileHeader title="My Profile" onBack={onBack} />
        <DesktopTopBar title="My Profile" subtitle="View your member details" onBack={onBack} />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4">
          <CACICard className="flex items-center gap-4">
            <CACISkeleton className="size-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <CACISkeleton className="h-6 w-1/2" />
              <CACISkeleton className="h-4 w-1/3" />
            </div>
          </CACICard>
          {[0, 1].map((i) => (
            <CACICard key={i}>
              <div className="space-y-3">
                <CACISkeleton className="h-4 w-1/4" />
                <CACISkeleton className="h-4 w-3/4" />
              </div>
            </CACICard>
          ))}
        </div>
      </>
    );
  }

  if (!member) {
    return (
      <>
        <MobileHeader title="My Profile" onBack={onBack} />
        <DesktopTopBar title="My Profile" onBack={onBack} />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl">
          <EmptyState
            icon={<AlertCircle size={26} />}
            title="No member profile linked"
            description="Please contact your assembly administrator to link your account."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <MobileHeader title="My Profile" onBack={onBack} />
      <DesktopTopBar title="My Profile" subtitle="View your member details" onBack={onBack} />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 animate-fade-in">
        {/* Profile header */}
        <CACICard padding="lg" className="flex flex-col items-center text-center md:flex-row md:text-left gap-4">
          <CaciAvatar name={member.fullName} photoUrl={member.profilePhotoUrl} size={80} />
          <div className="flex-1 min-w-0">
            <h2 className="text-[20px] font-bold text-n900">
              {member.title ? `${member.title} ` : ""}{member.fullName}
            </h2>
            {member.assemblyRole && (
              <p className="text-[14px] text-caci-blue font-medium mt-0.5">{member.assemblyRole}</p>
            )}
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2 flex-wrap">
              <MembershipStatusBadge status={member.membershipStatus} />
              <span className="text-[12px] text-n400">· Member since {formatDate(member.joinDate)}</span>
            </div>
            {member.membershipNumber && (
              <p className="text-[12px] text-n300 mt-1 font-mono">{member.membershipNumber}</p>
            )}
          </div>
          <CACIButton
            variant="secondary" size="sm"
            className="md:hidden"
            leftIcon={<Edit size={15} />}
            onClick={() => navigate("member-profile-edit")}
          >
            Edit
          </CACIButton>
          <CACIButton
            size="sm" variant="secondary"
            leftIcon={<Edit size={15} />}
            className="hidden md:inline-flex"
            onClick={() => navigate("member-profile-edit")}
          >
            Edit Profile
          </CACIButton>
        </CACICard>

        {/* Contact */}
        <CACICard>
          <SectionHeading title="Contact" className="mb-3" />
          <div className="space-y-2.5">
            <ContactRow icon={<Phone size={16} />} label="Phone" value={formatPhoneDisplay(member.phoneNumber)} href={member.phoneNumber ? `tel:+${member.phoneNumber}` : undefined} />
            <ContactRow icon={<MessageCircle size={16} />} label="WhatsApp" value={formatPhoneDisplay(member.whatsappNumber)} href={member.whatsappNumber ? `https://wa.me/${member.whatsappNumber}` : undefined} />
            <ContactRow icon={<MapPin size={16} />} label="Location" value={member.location} />
          </div>
        </CACICard>

        {/* Personal */}
        <CACICard>
          <SectionHeading title="Personal" className="mb-3" />
          <div className="space-y-2.5">
            <ContactRow icon={<Calendar size={16} />} label="Date of Birth" value={formatDate(member.dateOfBirth)} />
            <ContactRow icon={<User size={16} />} label="Gender" value={member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : null} />
            <ContactRow icon={<Heart size={16} />} label="Marital Status" value={member.maritalStatus ? member.maritalStatus.charAt(0).toUpperCase() + member.maritalStatus.slice(1) : null} />
            <ContactRow icon={<Briefcase size={16} />} label="Occupation" value={member.occupation} />
          </div>
        </CACICard>

        {/* Emergency contact */}
        {(member.emergencyContactName || member.emergencyContactPhone) && (
          <CACICard>
            <SectionHeading title="Contact Person" className="mb-3" />
            <div className="space-y-2.5">
              <ContactRow icon={<User size={16} />} label="Name" value={member.emergencyContactName} />
              <ContactRow icon={<Phone size={16} />} label="Phone" value={formatPhoneDisplay(member.emergencyContactPhone)} href={member.emergencyContactPhone ? `tel:+${member.emergencyContactPhone}` : undefined} />
              <ContactRow icon={<Heart size={16} />} label="Relationship" value={member.emergencyContactRelationship} />
            </div>
          </CACICard>
        )}

        {/* Groups */}
        <CACICard>
          <SectionHeading
            title="My Groups"
            action={groups.length > 0 ? <span className="text-[13px] text-n400">{groups.length}</span> : undefined}
            className="mb-3"
          />
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center animate-fade-in">
              <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-n50 text-n400">
                <Users size={22} />
              </div>
              <p className="text-[15px] font-semibold text-n700">No groups joined yet</p>
              <p className="mt-1 text-[13px] text-n400 max-w-[240px]">
                Join a group to connect with your assembly community and take part in discussions.
              </p>
              <CACIButton
                size="sm" variant="secondary" className="mt-3"
                leftIcon={<Users size={15} />}
                onClick={() => navigate("member-groups")}
              >
                Browse groups
              </CACIButton>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => goToGroup(g.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-n50 text-left transition-colors"
                >
                  <div className="size-9 rounded-lg bg-caci-blue-bg text-caci-blue flex items-center justify-center shrink-0">
                    <Users size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-n900 truncate">{g.name}</p>
                    <p className="text-[12px] text-n400">{g.memberCount} members</p>
                  </div>
                  {g.leaderId === member.id && (
                    <span className="text-[11px] bg-caci-red-bg text-caci-red px-2 py-0.5 rounded-full font-medium">Leader</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </CACICard>

        {/* Attendance history */}
        <CACICard>
          <SectionHeading
            title="My Attendance"
            action={
              attendance.length > 0 ? (
                <span className="text-[13px] text-n400">
                  {attendance.filter((a) => a.present).length}/{attendance.length} present
                </span>
              ) : undefined
            }
            className="mb-3"
          />
          {attendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-n50 text-n400">
                <CalendarCheck size={20} />
              </div>
              <p className="text-[14px] font-medium text-n700">No attendance yet</p>
              <p className="text-[12px] text-n400 mt-0.5 max-w-[240px]">
                Your service attendance will appear here once recorded by an administrator.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendance.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-n50 transition-colors"
                >
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      a.present ? "bg-[#dafbe1] text-[#1a7f37]" : "bg-caci-red-bg text-caci-red"
                    }`}
                  >
                    {a.present ? <Check size={15} /> : <X size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-n900 truncate">
                      {SERVICE_TYPE_LABELS[a.serviceType] || a.serviceType}
                    </p>
                    <p className="text-[12px] text-n400">{formatDate(a.serviceDate)}</p>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      a.present ? "bg-[#dafbe1] text-[#1a7f37]" : "bg-caci-red-bg text-caci-red"
                    }`}
                  >
                    {a.present ? "Present" : "Absent"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CACICard>
      </div>
    </>
  );
}

// ============================================================
// Account View — password, assembly info, sign out
// ============================================================

function AccountView({ onBack }: { onBack: () => void }) {
  const { user, setUser, resetTo, clearSession } = useApp();
  const [settings, setSettings] = useState<AssemblySettingsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

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
      <MobileHeader title="Account" onBack={onBack} />
      <DesktopTopBar title="Account" subtitle="Password, assembly info, and sign out" onBack={onBack} />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 animate-fade-in">
        {/* Account info */}
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
              {pwSaving ? "Updating..." : "Update password"}
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
      </div>
    </>
  );
}

// ============================================================
// Navigation View — FAB settings sliders
// ============================================================

interface SliderConfig {
  key: keyof FabSettings;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

const FAB_SLIDERS: SliderConfig[] = [
  { key: "radialRadius",    label: "Radial Radius",      description: "Distance of radial shortcuts from the FAB button",        min: 80,   max: 220,  step: 5,   unit: "px",  icon: Navigation },
  { key: "radialStartAngle", label: "Arc Start Angle",   description: "Starting angle of the radial arc",                      min: 60,   max: 150,  step: 5,   unit: "°",   icon: RotateCcw },
  { key: "radialEndAngle",   label: "Arc End Angle",     description: "Ending angle of the radial arc",                        min: 150,  max: 220,  step: 5,   unit: "°",   icon: Zap },
  { key: "backdropOpacity", label: "Backdrop Opacity",   description: "Dimming intensity of the background overlay",           min: 0,    max: 80,   step: 5,   unit: "%",   icon: Eye },
  { key: "iconSize",        label: "Icon Size",          description: "Size of icons inside the menu card",                    min: 14,   max: 28,   step: 1,   unit: "px",  icon: Palette },
  { key: "fabSize",         label: "FAB Size",           description: "Diameter of the floating action button",                min: 44,   max: 72,   step: 2,   unit: "px",  icon: Grip },
  { key: "cardWidth",       label: "Card Width",         description: "Width of the categorized menu card",                    min: 220,  max: 380,  step: 10,  unit: "px",  icon: Maximize },
  { key: "cardMaxHeight",   label: "Card Max Height",    description: "Maximum height of the menu card before scrolling",      min: 280,  max: 560,  step: 20,  unit: "px",  icon: Maximize },
  { key: "holdDuration",    label: "Long-Press Duration", description: "How long to hold the FAB for radial mode",             min: 200,  max: 1000, step: 50,  unit: "ms",  icon: Clock },
  { key: "dragThreshold",   label: "Drag Threshold",     description: "Horizontal drag distance to flip FAB side",            min: 20,   max: 120,  step: 5,   unit: "px",  icon: Move },
];

function NavigationView({ onBack }: { onBack: () => void }) {
  const { fab, setFab, resetFab } = useFabSettings();

  const handleReset = () => {
    resetFab();
    toast.success("FAB settings reset to defaults");
  };

  return (
    <>
      <MobileHeader title="Navigation" onBack={onBack} />
      <DesktopTopBar title="Navigation" subtitle="Customise the floating action button" onBack={onBack} />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 animate-fade-in">
        {/* Header */}
        <CACICard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <SectionHeading title="FAB Navigation" className="mb-1" />
              <p className="text-[13px] text-n400 leading-relaxed">
                Customise the floating action button behaviour, radial arc, and menu card appearance. Changes apply instantly.
              </p>
            </div>
            <CACIButton
              variant="ghost" size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={handleReset}
              className="shrink-0"
            >
              Reset
            </CACIButton>
          </div>
        </CACICard>

        {/* Sliders */}
        <CACICard>
          <SectionHeading title="Controls" className="mb-4" />
          <div className="space-y-5">
            {FAB_SLIDERS.map((cfg) => {
              const Icon = cfg.icon;
              const rawValue = fab[cfg.key];
              // backdropOpacity is stored as 0-0.8 but slider is 0-80
              const displayVal = cfg.key === "backdropOpacity" ? Math.round(rawValue * 100) : rawValue;
              const sliderVal = cfg.key === "backdropOpacity" ? Math.round(rawValue * 100) : rawValue;

              return (
                <div key={cfg.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-lg bg-caci-blue-bg text-caci-blue flex items-center justify-center shrink-0">
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-n900">{cfg.label}</p>
                        <p className="text-[11px] text-n400 truncate">{cfg.description}</p>
                      </div>
                    </div>
                    <span className="text-[13px] font-semibold text-caci-blue tabular-nums shrink-0 ml-2">
                      {displayVal}{cfg.unit}
                    </span>
                  </div>
                  <div className="pl-[42px]">
                    <Slider
                      value={[sliderVal]}
                      min={cfg.min}
                      max={cfg.max}
                      step={cfg.step}
                      onValueChange={([v]) => {
                        if (cfg.key === "backdropOpacity") {
                          setFab({ [cfg.key]: v / 100 });
                        } else {
                          setFab({ [cfg.key]: v });
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CACICard>
      </div>
    </>
  );
}

// ============================================================
// Shared ContactRow component
// ============================================================

function ContactRow({
  icon, label, value, href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  const display = value || "-";
  return (
    <div className="flex items-center gap-3">
      <span className="text-n400 shrink-0">{icon}</span>
      <span className="text-[13px] text-n400 w-28 shrink-0">{label}</span>
      {href && value ? (
        <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-[14px] text-caci-blue hover:underline truncate">
          {display}
        </a>
      ) : (
        <span className={`text-[14px] truncate ${value ? "text-n900" : "text-n300"}`}>{display}</span>
      )}
    </div>
  );
}
