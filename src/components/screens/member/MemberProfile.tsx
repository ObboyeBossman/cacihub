"use client";

import { useEffect, useRef, useState } from "react";
import {
  Phone, MapPin, User, Users, ChevronRight,
  AlertCircle, Camera, Building2, Heart,
  QrCode, Calendar, Copy, Check, X, CalendarCheck,
  Download,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { MemberDTO, GroupDTO, AttendanceDTO } from "@/lib/types";
import { SERVICE_TYPE_LABELS } from "@/lib/types";
import { formatDate, formatPhoneDisplay } from "@/lib/format";
import {
  CACICard, CaciAvatar, CACISkeleton, EmptyState,
  MembershipStatusBadge, SectionHeading,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { cn } from "@/lib/utils";

// ── Sub-screen type ──
type ProfileView = "main" | "attendance";

export function MemberProfile() {
  const { user, navigate, setParam } = useApp();
  const [member, setMember] = useState<MemberDTO | null>(null);
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // UI state
  const [view, setView] = useState<ProfileView>("main");
  const [showPhotoLightbox, setShowPhotoLightbox] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.memberId) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const [m, g] = await Promise.all([
          api.members.get(user.memberId!),
          api.groups.list({ memberId: user.memberId }),
        ]);
        if (!mounted) return;
        setMember(m.member);
        setGroups(g.groups);
      } catch {} finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.memberId]);

  // Load attendance lazily when user opens the attendance sub-screen
  const loadAttendance = async () => {
    if (!user?.memberId || attendance.length > 0) return;
    setAttendanceLoading(true);
    try {
      const res = await api.attendance.list({ memberId: user.memberId });
      setAttendance(res.attendance);
    } catch {} finally {
      setAttendanceLoading(false);
    }
  };

  const goToSection = (section: string) => {
    setParam("section", section);
    navigate("member-profile-edit");
  };

  const handleCopyMemberId = () => {
    if (!member?.membershipNumber) return;
    navigator.clipboard?.writeText(member.membershipNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading ──
  if (loading) {
    return (
      <>
        <MobileHeader title="My Profile" />
        <DesktopTopBar title="My Profile" />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4">
          <div className="flex flex-col items-center gap-3 py-6">
            <CACISkeleton className="size-24 rounded-full" />
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

  // ── No member linked ──
  if (!member) {
    return (
      <>
        <MobileHeader title="My Profile" />
        <DesktopTopBar title="My Profile" />
        <EmptyState
          icon={<AlertCircle size={26} />}
          title="No member profile linked"
          description="Please contact your assembly administrator to link your account."
        />
      </>
    );
  }

  // ── Attendance sub-screen ──
  if (view === "attendance") {
    return (
      <>
        <MobileHeader title="My Attendance" onBack={() => setView("main")} />
        <DesktopTopBar title="My Attendance" subtitle="Your service attendance history" onBack={() => setView("main")} />
        <AttendanceScreen
          attendance={attendance}
          loading={attendanceLoading}
        />
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

  const contactPersonPreview = member.emergencyContactName || "Not set";

  // ── Main profile view ──
  return (
    <>
      <MobileHeader title="My Profile" />
      <DesktopTopBar
        title="My Profile"
        subtitle="View and manage your assembly information"
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-6 pb-32 md:pb-8 animate-fade-in">

        {/* ── Hero: Profile Photo ── */}
        <div className="flex flex-col items-center gap-3 pt-2">
          {/* Tappable avatar → photo lightbox */}
          <button
            type="button"
            onClick={() => setShowPhotoLightbox(true)}
            className="relative group focus:outline-none"
            aria-label="View profile photo"
          >
            <CaciAvatar
              name={member.fullName}
              photoUrl={member.profilePhotoUrl}
              size={96}
              className="ring-2 ring-caci-blue/20 transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
            />
            {/* Camera edit badge */}
            <span className={cn(
              "absolute bottom-0 right-0 size-8 rounded-full",
              "bg-caci-blue flex items-center justify-center",
              "ring-2 ring-background",
              "transition-transform duration-200 group-hover:scale-110 group-active:scale-95"
            )}>
              <Camera size={14} className="text-white" />
            </span>
          </button>

          {/* Name + status */}
          <div className="text-center">
            <h2 className="text-[20px] font-bold text-foreground leading-tight">
              {member.title ? `${member.title} ` : ""}{member.fullName}
            </h2>
            {member.assemblyRole && (
              <p className="text-[13px] text-caci-blue font-medium mt-0.5">{member.assemblyRole}</p>
            )}
            <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
              <MembershipStatusBadge status={member.membershipStatus} />
              <span className="text-[12px] text-muted-foreground">· Member since {formatDate(member.joinDate)}</span>
            </div>

            {/* Membership number — tap to copy */}
            {member.membershipNumber && (
              <button
                type="button"
                onClick={handleCopyMemberId}
                className={cn(
                  "inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full",
                  "text-[11px] font-mono tracking-wide transition-all duration-200",
                  copied
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95"
                )}
                title="Copy Member ID"
              >
                {copied ? (
                  <Check size={11} className="shrink-0" />
                ) : (
                  <Copy size={11} className="shrink-0" />
                )}
                {copied ? "Copied!" : member.membershipNumber}
              </button>
            )}
          </div>
        </div>

        {/* ── Profile nav groups ── */}

        {/* My Details */}
        <ProfileGroup title="My Details">
          <ProfileNavRow
            icon={<User size={16} />}
            iconBg="bg-caci-blue-bg text-caci-blue"
            label="Profile Details"
            preview={personalPreview}
            onClick={() => goToSection("details")}
          />
          <ProfileNavRow
            icon={<Phone size={16} />}
            iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
            label="Contact"
            preview={contactPreview}
            onClick={() => goToSection("contact")}
          />
          <ProfileNavRow
            icon={<Heart size={16} />}
            iconBg="bg-rose-50 text-rose-500 dark:bg-rose-950 dark:text-rose-400"
            label="Contact Person"
            preview={contactPersonPreview}
            onClick={() => goToSection("contact-person")}
          />
        </ProfileGroup>

        {/* Assembly & Community */}
        <ProfileGroup title="Assembly &amp; Community">
          <ProfileNavRow
            icon={<Building2 size={16} />}
            iconBg="bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
            label="My Assembly"
            preview={member.membershipStatus ? member.membershipStatus.charAt(0).toUpperCase() + member.membershipStatus.slice(1) : "Active"}
            onClick={() => navigate("member-settings")}
          />
          <ProfileNavRow
            icon={<Users size={16} />}
            iconBg="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
            label="My Groups"
            preview={groups.length > 0 ? `${groups.length} group${groups.length !== 1 ? "s" : ""}` : "None joined"}
            onClick={() => navigate("member-groups")}
          />
          <ProfileNavRow
            icon={<CalendarCheck size={16} />}
            iconBg="bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400"
            label="Service Attendance"
            preview="View my attendance record"
            onClick={() => {
              loadAttendance();
              setView("attendance");
            }}
          />
        </ProfileGroup>

        {/* Digital Pass — accent card */}
        <button
          type="button"
          onClick={() => setShowPassModal(true)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-4 rounded-2xl",
            "bg-gradient-to-r from-caci-blue to-blue-700",
            "text-white shadow-md",
            "transition-all duration-200 hover:shadow-lg hover:brightness-105 active:scale-[0.98]",
            "group"
          )}
        >
          <div className="flex items-center gap-3">
            <span className="size-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <QrCode size={18} className="text-white" />
            </span>
            <div className="text-left">
              <p className="text-[15px] font-semibold">Digital Member Pass</p>
              <p className="text-[12px] text-white/70">Tap to view your QR ID card</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/60 transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>

      </div>

      {/* ── Photo Lightbox Modal ── */}
      {showPhotoLightbox && (
        <PhotoLightbox
          member={member}
          onClose={() => setShowPhotoLightbox(false)}
          onChangePhoto={() => {
            setShowPhotoLightbox(false);
            goToSection("photo");
          }}
        />
      )}

      {/* ── Digital Member Pass Modal ── */}
      {showPassModal && (
        <MemberPassModal
          member={member}
          onClose={() => setShowPassModal(false)}
        />
      )}
    </>
  );
}

// ── Attendance sub-screen ──
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

  // Compute attendance rate
  const total = attendance.length;
  const present = attendance.filter((r) => r.present).length;
  const rate = total > 0 ? Math.round((present / total) * 100) : null;

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 pb-32 md:pb-8 animate-fade-in">

      {/* Summary banner */}
      {rate !== null && (
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-teal-50 dark:bg-teal-950 border border-teal-100 dark:border-teal-900">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-teal-600 dark:text-teal-400" />
            <span className="text-[13px] font-medium text-teal-700 dark:text-teal-300">
              {present} of {total} services attended
            </span>
          </div>
          <span className={cn(
            "text-[12px] font-bold px-2.5 py-1 rounded-full",
            rate >= 75
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
              : rate >= 50
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
              : "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300"
          )}>
            {rate}% rate
          </span>
        </div>
      )}

      {/* Records list */}
      {attendance.length === 0 ? (
        <EmptyState
          icon={<Calendar size={26} />}
          title="No attendance records yet"
          description="Your service attendance will appear here once it has been recorded."
        />
      ) : (
        <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
          {attendance.map((record) => (
            <div key={record.id} className="flex items-center justify-between px-4 py-3.5 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn(
                  "size-2 rounded-full shrink-0",
                  record.present ? "bg-emerald-500" : "bg-rose-400"
                )} />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-foreground truncate">
                    {SERVICE_TYPE_LABELS[record.serviceType] ?? record.serviceType}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {new Date(record.serviceDate).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <span className={cn(
                "text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0",
                record.present
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300"
              )}>
                {record.present ? "Present" : "Absent"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Photo Lightbox ──
function PhotoLightbox({
  member,
  onClose,
  onChangePhoto,
}: {
  member: MemberDTO;
  onClose: () => void;
  onChangePhoto: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center gap-5 w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Large photo */}
        <div className="w-64 h-64 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-muted">
          <CaciAvatar
            name={member.fullName}
            photoUrl={member.profilePhotoUrl}
            size={256}
            className="w-full h-full rounded-none"
          />
        </div>

        <div className="text-center">
          <p className="text-white font-semibold text-[16px]">
            {member.title ? `${member.title} ` : ""}{member.fullName}
          </p>
          {member.membershipNumber && (
            <p className="text-white/50 text-[12px] font-mono mt-1">{member.membershipNumber}</p>
          )}
        </div>

        {/* Change photo CTA */}
        <button
          type="button"
          onClick={onChangePhoto}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-caci-blue hover:bg-blue-700 text-white text-[14px] font-semibold transition-all active:scale-95 shadow-lg"
        >
          <Camera size={15} />
          Change Profile Photo
        </button>
      </div>
    </div>
  );
}

// ── Digital Member Pass Modal ──
function MemberPassModal({
  member,
  onClose,
}: {
  member: MemberDTO;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up sm:animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card gradient background */}
        <div className="bg-gradient-to-br from-[#004397] via-[#0252b3] to-[#1e3a8a] text-white p-6 pb-8">

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-full bg-white flex items-center justify-center">
              <span className="text-[10px] font-extrabold text-caci-blue leading-none text-center">CACI</span>
            </div>
            <div>
              <p className="text-[13px] font-bold tracking-wide leading-tight">CHRIST APOSTOLIC CHURCH</p>
              <p className="text-[11px] text-blue-200">Official Member Digital Pass</p>
            </div>
          </div>

          {/* Member identity strip */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6">
            <div className="size-16 rounded-xl overflow-hidden border-2 border-white/30 shrink-0">
              <CaciAvatar
                name={member.fullName}
                photoUrl={member.profilePhotoUrl}
                size={64}
                className="w-full h-full rounded-none"
              />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/80 px-2 py-0.5 rounded text-white uppercase tracking-wider mb-1">
                <span className="size-1.5 rounded-full bg-white animate-pulse" />
                {member.membershipStatus}
              </span>
              <p className="text-[15px] font-bold leading-tight truncate">
                {member.title ? `${member.title} ` : ""}{member.fullName}
              </p>
              {member.membershipNumber && (
                <p className="text-[11px] text-blue-200 font-mono mt-1">{member.membershipNumber}</p>
              )}
            </div>
          </div>

          {/* QR code area */}
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-3 mb-5">
            {/* Decorative QR grid — visual representation */}
            <div className="size-32 relative">
              <QrCodeGrid />
            </div>
            <p className="text-[11px] text-slate-500 text-center leading-snug">
              Scan at church entrance to record attendance
            </p>
          </div>

          {/* Footer: joined date */}
          <div className="flex items-center justify-between text-[11px] text-blue-200/70">
            <span>Member since {formatDate(member.joinDate)}</span>
            {member.assemblyRole && <span>{member.assemblyRole}</span>}
          </div>
        </div>

        {/* Save action */}
        <button
          type="button"
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-colors"
        >
          <Download size={15} />
          Save Digital ID Card
        </button>
      </div>
    </div>
  );
}

// ── QR Code decorative grid ──
// Renders a pixel-art style QR pattern using CSS. It is purely decorative —
// a real scannable QR would require a library; this is the design-faithful stand-in.
function QrCodeGrid() {
  // 7×7 finder pattern (top-left corner of a QR code)
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,0],
    [1,0,1,1,1,0,1,0,0,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,0],
    [1,1,1,1,1,1,1,0,1,0,1,0,0,1],
    [0,0,0,0,0,0,0,0,0,1,0,1,0,0],
    [1,0,1,1,0,1,0,1,1,0,1,0,1,1],
    [0,1,0,0,1,0,0,0,0,1,0,1,0,0],
    [1,0,1,0,1,0,1,1,0,0,1,0,1,0],
    [0,1,0,1,0,1,0,0,1,0,0,1,0,1],
    [1,1,1,1,1,1,1,0,1,1,0,0,1,0],
    [0,0,0,0,0,0,0,1,0,0,1,0,0,1],
  ];

  return (
    <div className="grid gap-[1.5px]" style={{ gridTemplateColumns: `repeat(14, 1fr)`, width: "100%", height: "100%" }}>
      {pattern.flat().map((cell, i) => (
        <div
          key={i}
          className={cn("rounded-[1px]", cell ? "bg-slate-900" : "bg-white")}
        />
      ))}
    </div>
  );
}

// ── ProfileGroup: labelled section of nav rows ──
function ProfileGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p
        className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground px-1"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

// ── ProfileNavRow: single tappable row ──
function ProfileNavRow({
  icon,
  iconBg,
  label,
  preview,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  preview?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 text-left",
        "transition-colors duration-150 hover:bg-muted/40 active:bg-muted/70",
        "group"
      )}
    >
      <span className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-foreground">{label}</p>
        {preview && (
          <p className="text-[12px] text-muted-foreground truncate mt-0.5">{preview}</p>
        )}
      </div>
      <ChevronRight
        size={16}
        className="text-muted-foreground/50 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
      />
    </button>
  );
}
