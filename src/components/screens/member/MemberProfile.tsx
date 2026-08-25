"use client";

import { useEffect, useState } from "react";
import {
  Phone, MessageCircle, MapPin, Calendar, Briefcase, Heart, User,
  Shield, Edit, Users, Check, AlertCircle, CalendarCheck, X,
  ChevronRight, Camera, UserCircle, Contact, BookUser, Globe,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { MemberDTO, GroupDTO, AttendanceDTO } from "@/lib/types";
import { SERVICE_TYPE_LABELS } from "@/lib/types";
import { formatDate, formatPhoneDisplay } from "@/lib/format";
import {
  CACIButton, CACICard, CaciAvatar, CACISkeleton, EmptyState,
  MembershipStatusBadge, SectionHeading, RoleBadge,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { cn } from "@/lib/utils";

export function MemberProfile() {
  const { user, setUser, navigate, setParam } = useApp();
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
          api.groups.list({ memberId: user.memberId }).catch(() => ({ groups: [] })),
          api.attendance.list({ memberId: user.memberId }).catch(() => ({ attendance: [] })),
        ]);
        if (!mounted) return;
        setMember(m.member);
        if (m.member.profilePhotoUrl && user && user.profilePhotoUrl !== m.member.profilePhotoUrl) {
          setUser({ ...user, profilePhotoUrl: m.member.profilePhotoUrl });
        }
        setGroups(g.groups || []);
        setAttendance(att.attendance?.slice(0, 8) || []);
      } catch {} finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.memberId]);

  const goToEdit = (section: string) => {
    setParam("section", section);
    navigate("member-profile-edit");
  };

  const goToGroup = (_id: string) => {
    // Groups feature out of scope
  };

  if (loading) {
    return (
      <>
        <MobileHeader title="My Profile" />
        <DesktopTopBar title="My Profile" />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl space-y-4">
          <div className="flex flex-col items-center gap-3 py-6">
            <CACISkeleton className="size-24 rounded-full" />
            <CACISkeleton className="h-5 w-40" />
            <CACISkeleton className="h-4 w-28" />
          </div>
          {[0, 1, 2].map((i) => <CACISkeleton key={i} className="h-14 rounded-2xl" />)}
        </div>
      </>
    );
  }

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

  const attendancePresent = attendance.filter((a) => a.present).length;

  return (
    <>
      <MobileHeader title="My Profile" />
      <DesktopTopBar
        title="My Profile"
        subtitle="View and manage your assembly information"
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl space-y-6 pb-32 md:pb-8 animate-fade-in">

        {/* ── Hero: photo + name + status ── */}
        <div className="flex flex-col items-center gap-3 pt-2">
          {/* Photo with edit overlay */}
          <button
            onClick={() => goToEdit("photo")}
            className="relative group focus:outline-none"
            aria-label="Change profile photo"
          >
            <CaciAvatar
              name={member.fullName}
              photoUrl={member.profilePhotoUrl}
              size={96}
              className="ring-2 ring-caci-blue/20 group-hover:ring-caci-blue/50 transition-all duration-200"
            />
            {/* Camera badge */}
            <span className="absolute bottom-0 right-0 size-7 rounded-full bg-caci-blue flex items-center justify-center ring-2 ring-surface-page shadow-sm">
              <Camera size={13} className="text-white" />
            </span>
          </button>

          <div className="text-center">
            <h2 className="text-[20px] font-bold text-foreground">
              {member.title ? `${member.title} ` : ""}{member.fullName}
            </h2>
            {member.assemblyRole && (
              <p className="text-[14px] text-caci-blue font-medium mt-0.5">{member.assemblyRole}</p>
            )}
            <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
              <MembershipStatusBadge status={member.membershipStatus} />
              <span className="text-[12px] text-muted-foreground">· Member since {formatDate(member.joinDate)}</span>
            </div>
            {member.membershipNumber && (
              <p className="text-[12px] text-muted-foreground/60 mt-1 font-mono">{member.membershipNumber}</p>
            )}
          </div>
        </div>

        {/* ── Section group label ── */}
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
          My Details
        </p>

        {/* ── Nav rows grouped card ── */}
        <div className="rounded-2xl bg-surface-card border border-border overflow-hidden divide-y divide-border -mt-3">

          <ProfileNavRow
            icon={<UserCircle size={18} />}
            label="Profile Details"
            description={[member.title, member.fullName].filter(Boolean).join(" ")}
            onClick={() => goToEdit("details")}
            isFirst
          />

          <ProfileNavRow
            icon={<Phone size={18} />}
            label="Contact"
            description={formatPhoneDisplay(member.phoneNumber) || "Not set"}
            onClick={() => goToEdit("contact")}
          />

          <ProfileNavRow
            icon={<BookUser size={18} />}
            label="Contact Person"
            description={member.emergencyContactName || "Not set"}
            onClick={() => goToEdit("contact-person")}
            isLast
          />
        </div>

        {/* ── Groups ── */}
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Community
          </p>
          <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex size-[30px] items-center justify-center text-muted-foreground">
                  <Users size={18} />
                </div>
                <span className="text-[16px] text-foreground">My Groups</span>
              </div>
              {groups.length > 0 && (
                <span className="text-[13px] text-muted-foreground tabular-nums">{groups.length}</span>
              )}
            </div>
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <p className="text-[14px] font-medium text-foreground">No groups joined yet</p>
                <p className="mt-1 text-[13px] text-muted-foreground max-w-[240px]">
                  Join a group to connect with your assembly community.
                </p>
                <CACIButton
                  size="sm" variant="secondary" className="mt-3"
                  leftIcon={<Users size={15} />}
                  onClick={() => navigate("member-directory")}
                >
                  Browse directory
                </CACIButton>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => goToGroup(g.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted text-left transition-colors tap-squish"
                  >
                    <div className="size-9 rounded-lg bg-caci-blue-bg text-caci-blue flex items-center justify-center shrink-0">
                      <Users size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-foreground truncate">{g.name}</p>
                      <p className="text-[12px] text-muted-foreground">{g.memberCount} members</p>
                    </div>
                    {g.leaderId === member.id && (
                      <span className="text-[11px] bg-caci-red-bg text-caci-red px-2 py-0.5 rounded-full font-medium shrink-0">Leader</span>
                    )}
                    <ChevronRight size={15} className="text-muted-foreground/50 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Attendance ── */}
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Attendance
          </p>
          <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex size-[30px] items-center justify-center text-muted-foreground">
                  <CalendarCheck size={18} />
                </div>
                <span className="text-[16px] text-foreground">My Attendance</span>
              </div>
              {attendance.length > 0 && (
                <span className="text-[13px] text-muted-foreground tabular-nums">
                  {attendancePresent}/{attendance.length}
                </span>
              )}
            </div>
            {attendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <p className="text-[14px] font-medium text-foreground">No attendance yet</p>
                <p className="text-[12px] text-muted-foreground mt-0.5 max-w-[240px]">
                  Your service attendance will appear here once recorded by an administrator.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {attendance.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={cn(
                      "size-8 rounded-lg flex items-center justify-center shrink-0",
                      a.present ? "bg-success-bg text-success" : "bg-caci-red-bg text-caci-red"
                    )}>
                      {a.present ? <Check size={15} /> : <X size={15} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {SERVICE_TYPE_LABELS[a.serviceType] || a.serviceType}
                      </p>
                      <p className="text-[12px] text-muted-foreground">{formatDate(a.serviceDate)}</p>
                    </div>
                    <span className={cn(
                      "text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0",
                      a.present ? "bg-success-bg text-success" : "bg-caci-red-bg text-caci-red"
                    )}>
                      {a.present ? "Present" : "Absent"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Public Page Design Mode ── */}
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Design & Layout
          </p>
          <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
            <ProfileNavRow
              icon={<Globe size={18} />}
              label="Public Sermons Page"
              description="Open public landing page in design mode"
              onClick={() => navigate("public-sermons")}
              isFirst
              isLast
            />
          </div>
        </div>

      </div>
    </>
  );
}

// ── Shared nav row ──
function ProfileNavRow({
  icon, label, description, onClick, isFirst = false, isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 min-h-[60px] text-left",
        "transition-colors duration-150 hover:bg-muted/50 active:bg-muted tap-squish"
      )}
    >
      <div className="flex size-[30px] items-center justify-center shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[16px] text-foreground leading-tight">{label}</p>
        {description && (
          <p className="text-[13px] text-muted-foreground truncate mt-0.5">{description}</p>
        )}
      </div>
      <ChevronRight size={16} className="text-muted-foreground/60 shrink-0" />
    </button>
  );
}
