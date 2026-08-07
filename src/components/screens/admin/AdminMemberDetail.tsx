"use client";

import { useEffect, useState } from "react";
import {
  Phone, MessageCircle, MapPin, Calendar, Briefcase, Heart, User,
  Shield, Users, Edit, Trash2, ExternalLink, ChevronRight, CalendarCheck,
  Check, X, AlertCircle, Copy, Clock,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { MemberDTO, GroupDTO, AuditLogDTO, AttendanceDTO } from "@/lib/types";
import { SERVICE_TYPE_LABELS } from "@/lib/types";
import { formatDate, formatDateTime, formatRelative, formatPhoneDisplay, humanizeField } from "@/lib/format";
import {
  CACIButton, CaciAvatar, CACISkeleton, EmptyState,
  MembershipStatusBadge, RoleBadge,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Sub-screen type ──────────────────────────────────────────────────────────
type DetailView = "main" | "attendance" | "groups" | "audit";

// ── Main component ───────────────────────────────────────────────────────────
export function AdminMemberDetail() {
  const { params, navigate, back, setParam, setAdminMobileMenuOpen } = useApp();
  const memberId = params.memberId;

  const [member, setMember]     = useState<MemberDTO | null>(null);
  const [groups, setGroups]     = useState<GroupDTO[]>([]);
  const [audit, setAudit]       = useState<AuditLogDTO[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDTO[]>([]);

  const [loading, setLoading]   = useState(true);
  const [removing, setRemoving] = useState(false);
  const [copied, setCopied]     = useState(false);

  // Sub-screen
  const [view, setView] = useState<DetailView>("main");

  // Lazy-load flags
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [auditFull, setAuditFull] = useState<AuditLogDTO[]>([]);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  // ── Initial data load ──
  useEffect(() => {
    if (!memberId) { back(); return; }
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [m, g, a] = await Promise.all([
          api.members.get(memberId),
          api.groups.list({ memberId }),
          api.audit.list(memberId, 5),
        ]);
        if (!alive) return;
        setMember(m.member);
        setGroups(g.groups);
        setAudit(a.logs);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load member");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [memberId, back]);

  // ── Lazy: attendance ──
  const openAttendance = async () => {
    if (!attendanceLoaded) {
      setAttendanceLoading(true);
      try {
        const res = await api.attendance.list({ memberId: memberId! });
        setAttendance(res.attendance);
        setAttendanceLoaded(true);
      } catch {} finally {
        setAttendanceLoading(false);
      }
    }
    setView("attendance");
  };

  // ── Lazy: full audit log ──
  const openAudit = async () => {
    if (!auditLoaded) {
      setAuditLoading(true);
      try {
        const res = await api.audit.list(memberId!, 50);
        setAuditFull(res.logs);
        setAuditLoaded(true);
      } catch {} finally {
        setAuditLoading(false);
      }
    }
    setView("audit");
  };

  const handleRemove = async () => {
    if (!member) return;
    setRemoving(true);
    try {
      await api.members.remove(member.id);
      toast.success(`${member.fullName} has been removed`);
      back();
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove member");
    } finally {
      setRemoving(false);
    }
  };

  const handleCopyId = () => {
    if (!member?.membershipNumber) return;
    navigator.clipboard?.writeText(member.membershipNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToGroup = (id: string) => {
    setParam("groupId", id);
    navigate("admin-group-detail");
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <>
        <MobileHeader title="Member" onBack={back} onMenu={() => setAdminMobileMenuOpen(true)} />
        <DesktopTopBar title="Member Profile" />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4">
          <div className="flex flex-col items-center gap-3 py-6">
            <CACISkeleton className="size-28 rounded-full" />
            <CACISkeleton className="h-5 w-40" />
            <CACISkeleton className="h-4 w-28" />
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
              {[0, 1, 2].map((j) => (
                <div key={j} className="flex items-center gap-3 px-4 py-3.5">
                  <CACISkeleton className="size-9 rounded-xl" />
                  <CACISkeleton className="h-4 w-32" />
                  <CACISkeleton className="h-4 w-16 ml-auto" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
    );
  }

  // ── Not found ──
  if (!member) {
    return (
      <>
        <MobileHeader title="Member" onBack={back} onMenu={() => setAdminMobileMenuOpen(true)} />
        <DesktopTopBar title="Member Profile" />
        <EmptyState
          icon={<AlertCircle size={26} />}
          title="Member not found"
          description="This member may have been removed."
          action={<CACIButton onClick={back}>Go back</CACIButton>}
        />
      </>
    );
  }

  // ── Attendance sub-screen ──
  if (view === "attendance") {
    return (
      <>
        <MobileHeader title="Attendance Record" onBack={() => setView("main")} onMenu={() => setAdminMobileMenuOpen(true)} />
        <DesktopTopBar
          title="Attendance Record"
          subtitle={`${member.fullName}'s service attendance history`}
          onBack={() => setView("main")}
        />
        <AttendanceScreen attendance={attendance} loading={attendanceLoading} />
      </>
    );
  }

  // ── Groups sub-screen ──
  if (view === "groups") {
    return (
      <>
        <MobileHeader title="Church Groups" onBack={() => setView("main")} onMenu={() => setAdminMobileMenuOpen(true)} />
        <DesktopTopBar
          title="Church Groups"
          subtitle={`Groups ${member.fullName} is enrolled in`}
          onBack={() => setView("main")}
        />
        <GroupsScreen groups={groups} member={member} onGroupClick={(g) => goToGroup(g.id)} />
      </>
    );
  }

  // ── Audit log sub-screen ──
  if (view === "audit") {
    return (
      <>
        <MobileHeader title="Change History" onBack={() => setView("main")} onMenu={() => setAdminMobileMenuOpen(true)} />
        <DesktopTopBar
          title="Change History"
          subtitle={`Audit log for ${member.fullName}`}
          onBack={() => setView("main")}
        />
        <AuditScreen logs={auditLoaded ? auditFull : audit} loading={auditLoading} />
      </>
    );
  }

  // ── Derived preview values ──
  const contactPreview = [
    formatPhoneDisplay(member.phoneNumber),
    member.location,
  ].filter(Boolean).join(" · ") || "Not set";

  const personalPreview = [
    member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : null,
    member.occupation,
  ].filter(Boolean).join(" · ") || "Not set";

  const contactPersonPreview = member.emergencyContactName
    ? `${member.emergencyContactName}${member.emergencyContactRelationship ? ` (${member.emergencyContactRelationship})` : ""}`
    : "Not set";

  const portalLabel = member.authUserId
    ? member.appRole === "admin"
      ? "Admin · Can sign in"
      : `Member · ${member.assemblyRole || "Can sign in"}`
    : "No account provisioned";

  const attendanceTotal = attendance.length;
  const attendancePresent = attendance.filter((a) => a.present).length;
  const attendancePreview = attendanceLoaded
    ? `${attendancePresent}/${attendanceTotal} present`
    : "View attendance record";

  // ── Main view ──
  return (
    <>
      {/* ── Nav bars ── */}
      <MobileHeader
        title={member.fullName}
        subtitle={member.membershipNumber || undefined}
        onBack={back}
        onMenu={() => setAdminMobileMenuOpen(true)}
      />
      <DesktopTopBar
        title={member.fullName}
        subtitle={member.membershipNumber || undefined}
        onBack={back}
        action={
          <div className="flex gap-2">
            <CACIButton
              variant="secondary"
              size="sm"
              leftIcon={<Edit size={15} />}
              onClick={() => navigate("admin-member-edit")}
            >
              Edit
            </CACIButton>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <CACIButton variant="danger" size="sm" leftIcon={<Trash2 size={15} />}>
                  Remove
                </CACIButton>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove {member.fullName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will soft-delete the member record. Their data is preserved but they will
                    be hidden from the active directory. This action can be reversed from the
                    &quot;Show deleted&quot; filter.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemove}
                    disabled={removing}
                    className="bg-caci-red text-white hover:bg-caci-red-light"
                  >
                    {removing ? "Removing…" : "Remove Member"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      {/* ── Page body ── */}
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-5 pb-32 md:pb-8 animate-fade-in">

        {/* ── Hero: Avatar + identity ── */}
        <div className="flex flex-col items-center gap-2.5 pt-2 pb-1">
          <div className="relative">
            <CaciAvatar
              name={member.fullName}
              photoUrl={member.profilePhotoUrl}
              size={112}
              className="ring-4 ring-caci-blue/20 shadow-xl"
            />
            {/* Active dot */}
            {member.membershipStatus === "active" && (
              <span
                className="absolute bottom-1.5 right-1.5 size-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm"
                aria-label="Active member"
              />
            )}
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <h2 className="text-[20px] font-bold text-foreground text-center leading-tight">
              {member.title ? `${member.title} ` : ""}{member.fullName}
            </h2>
            {member.assemblyRole && (
              <p className="text-[13px] text-muted-foreground font-medium">{member.assemblyRole}</p>
            )}
            <MembershipStatusBadge status={member.membershipStatus} />
            <span className="text-[12px] text-muted-foreground">
              Member since {formatDate(member.joinDate)}
            </span>

            {/* Membership number — tap to copy */}
            {member.membershipNumber && (
              <button
                type="button"
                onClick={handleCopyId}
                className={cn(
                  "inline-flex items-center gap-1.5 text-[12px] font-mono tracking-wide transition-all duration-200",
                  copied
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground hover:text-caci-blue active:scale-95"
                )}
                title="Copy Member ID"
              >
                {copied ? <Check size={11} className="shrink-0" /> : <Copy size={11} className="shrink-0" />}
                {copied ? "Copied!" : member.membershipNumber}
              </button>
            )}
          </div>

          {/* Edit button — prominent, below hero identity */}
          <button
            type="button"
            onClick={() => navigate("admin-member-edit")}
            className={cn(
              "inline-flex items-center gap-2 mt-1 px-5 py-2 rounded-xl",
              "bg-caci-blue text-white text-[13px] font-semibold",
              "hover:bg-caci-blue-dim transition-all duration-150 active:scale-95 shadow-sm"
            )}
          >
            <Edit size={14} />
            Edit Profile
          </button>
        </div>

        {/* ── Member Information ── */}
        <ProfileGroup title="Member Information">
          <ProfileNavRow
            icon={<User size={16} />}
            iconBg="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
            label="Personal Information"
            preview={personalPreview}
            onClick={() => {}}
            readOnly
          />
          <ProfileNavRow
            icon={<Phone size={16} />}
            iconBg="bg-caci-blue-bg text-caci-blue"
            label="Contact Details"
            preview={contactPreview}
            onClick={() => {}}
            readOnly
          />
          <ProfileNavRow
            icon={<Heart size={16} />}
            iconBg="bg-rose-50 text-rose-500 dark:bg-rose-950 dark:text-rose-400"
            label="Next of Kin"
            preview={contactPersonPreview}
            onClick={() => {}}
            readOnly
          />
        </ProfileGroup>

        {/* ── Church & Activity ── */}
        <ProfileGroup title="Church & Activity">
          <ProfileNavRow
            icon={<Users size={16} />}
            iconBg="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
            label="Church Groups"
            badge={groups.length > 0 ? `${groups.length}` : undefined}
            preview={groups.length === 0 ? "Not enrolled in any group" : undefined}
            onClick={() => setView("groups")}
          />
          <ProfileNavRow
            icon={<CalendarCheck size={16} />}
            iconBg="bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400"
            label="Attendance Record"
            preview={attendancePreview}
            onClick={openAttendance}
          />
        </ProfileGroup>

        {/* ── Admin Actions ── */}
        <ProfileGroup title="Admin">
          <ProfileNavRow
            icon={<Shield size={16} />}
            iconBg="bg-caci-blue-bg text-caci-blue"
            label="Portal Account"
            preview={portalLabel}
            onClick={() => navigate("admin-accounts")}
          />
          <ProfileNavRow
            icon={<Clock size={16} />}
            iconBg="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            label="Change History"
            preview={audit.length > 0 ? `${audit.length}+ recent changes` : "No changes recorded"}
            onClick={openAudit}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <ProfileNavRow
                icon={<Trash2 size={16} />}
                iconBg="bg-rose-50 text-rose-500 dark:bg-rose-950 dark:text-rose-400"
                label="Remove Member"
                labelClassName="text-rose-600 dark:text-rose-400"
                preview="Soft-delete this member record"
                onClick={() => {}}
                destructive
              />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {member.fullName}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will soft-delete the member record. Their data is preserved but they will
                  be hidden from the active directory. This action can be reversed from the
                  &quot;Show deleted&quot; filter.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemove}
                  disabled={removing}
                  className="bg-caci-red text-white hover:bg-caci-red-light"
                >
                  {removing ? "Removing…" : "Remove Member"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ProfileGroup>

      </div>
    </>
  );
}

// ── ProfileGroup ─────────────────────────────────────────────────────────────
function ProfileGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
        {title}
      </p>
      <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

// ── ProfileNavRow ─────────────────────────────────────────────────────────────
function ProfileNavRow({
  icon,
  iconBg,
  label,
  labelClassName,
  preview,
  badge,
  onClick,
  readOnly,
  destructive,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  labelClassName?: string;
  preview?: string;
  badge?: string;
  onClick: () => void;
  readOnly?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3.5 px-4 py-4 text-left",
        "transition-colors duration-150",
        readOnly
          ? "cursor-default"
          : "hover:bg-muted/40 active:bg-muted/70 group"
      )}
    >
      <span className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[14px] font-bold text-foreground", labelClassName)}>{label}</p>
        {preview && (
          <p className={cn(
            "text-[12px] truncate mt-0.5",
            destructive ? "text-rose-400" : "text-muted-foreground"
          )}>
            {preview}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {badge}
          </span>
        )}
        {!readOnly && (
          <ChevronRight
            size={16}
            className={cn(
              "transition-transform duration-150",
              destructive
                ? "text-rose-400/50"
                : "text-muted-foreground/50 group-hover:translate-x-0.5"
            )}
          />
        )}
      </div>
    </button>
  );
}

// ── Groups sub-screen ─────────────────────────────────────────────────────────
function GroupsScreen({
  groups,
  member,
  onGroupClick,
}: {
  groups: GroupDTO[];
  member: MemberDTO;
  onGroupClick: (g: GroupDTO) => void;
}) {
  if (groups.length === 0) {
    return (
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl pb-32 md:pb-8">
        <EmptyState
          icon={<Users size={26} />}
          title="No groups"
          description={`${member.fullName} is not enrolled in any church group.`}
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 pb-32 md:pb-8 animate-fade-in">
      <div className="rounded-2xl bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <div>
            <h3 className="text-[18px] font-bold text-foreground">Church Groups</h3>
            <p className="text-[12px] text-muted-foreground">Groups {member.fullName} is enrolled in</p>
          </div>
          <span className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-caci-blue-bg text-caci-blue">
            {groups.length} Group{groups.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="space-y-3">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => onGroupClick(group)}
              className={cn(
                "w-full p-3.5 rounded-xl bg-muted/40 border border-border",
                "flex items-center justify-between text-left",
                "transition-colors duration-150 hover:bg-muted/70 active:bg-muted",
                "group"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="size-10 rounded-xl bg-caci-blue-bg text-caci-blue flex items-center justify-center shrink-0">
                  <Users size={18} />
                </span>
                <div className="min-w-0">
                  <h4 className="text-[14px] font-bold text-foreground truncate">{group.name}</h4>
                  <p className="text-[12px] text-muted-foreground">
                    {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
                    {group.leaderId === member.id && (
                      <span className="ml-2 text-rose-500 font-semibold">· Leader</span>
                    )}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground/40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Attendance sub-screen ─────────────────────────────────────────────────────
function AttendanceScreen({
  attendance,
  loading,
}: {
  attendance: AttendanceDTO[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <CACISkeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  const total   = attendance.length;
  const present = attendance.filter((r) => r.present).length;
  const rate    = total > 0 ? Math.round((present / total) * 100) : null;

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 pb-32 md:pb-8 animate-fade-in">
      <div className="rounded-2xl bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <div>
            <h3 className="text-[18px] font-bold text-foreground">Attendance Record</h3>
            <p className="text-[12px] text-muted-foreground">Service attendance history</p>
          </div>
          {rate !== null && (
            <span className={cn(
              "text-[12px] font-semibold px-2.5 py-1 rounded-full",
              rate >= 75
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                : rate >= 50
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                : "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300"
            )}>
              {rate}% Attendance
            </span>
          )}
        </div>

        {attendance.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck size={26} />}
            title="No attendance recorded"
            description="This member hasn't been marked at any service yet."
          />
        ) : (
          <div className="space-y-2.5">
            {attendance.map((record) => (
              <div
                key={record.id}
                className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn(
                    "size-8 rounded-lg flex items-center justify-center shrink-0",
                    record.present
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                  )}>
                    {record.present ? <Check size={15} /> : <X size={15} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">
                      {SERVICE_TYPE_LABELS[record.serviceType] ?? record.serviceType}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(record.serviceDate).toLocaleDateString("en-GB", {
                        weekday: "short", day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "text-[12px] font-bold px-2.5 py-1 rounded-lg shrink-0",
                  record.present
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                )}>
                  {record.present ? "Present" : "Absent"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Audit log sub-screen ──────────────────────────────────────────────────────
function AuditScreen({
  logs,
  loading,
}: {
  logs: AuditLogDTO[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <CACISkeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 pb-32 md:pb-8 animate-fade-in">
      <div className="rounded-2xl bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <div>
            <h3 className="text-[18px] font-bold text-foreground">Change History</h3>
            <p className="text-[12px] text-muted-foreground">Full audit log for this member</p>
          </div>
          {logs.length > 0 && (
            <span className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {logs.length} event{logs.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {logs.length === 0 ? (
          <EmptyState
            icon={<Clock size={26} />}
            title="No changes recorded"
            description="Edits made to this member will appear here."
          />
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                <span className="mt-1 size-2 rounded-full bg-caci-blue/40 border-2 border-caci-blue shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground leading-snug">
                    <span className="font-semibold">{humanizeField(log.fieldChanged)}</span>
                    {log.oldValue && log.newValue
                      ? ` changed from "${log.oldValue}" to "${log.newValue}"`
                      : log.newValue
                      ? ` set to "${log.newValue}"`
                      : log.oldValue
                      ? ` cleared (was "${log.oldValue}")`
                      : ""}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {log.changedByName || "System"} · {formatRelative(log.changedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
