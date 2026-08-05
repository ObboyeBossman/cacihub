"use client";

import { useEffect, useState } from "react";
import {
  Phone, MapPin, User, Shield, Users, ChevronRight,
  AlertCircle, Camera, Building2, Heart,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { MemberDTO, GroupDTO } from "@/lib/types";
import { formatDate, formatPhoneDisplay } from "@/lib/format";
import {
  CACICard, CaciAvatar, CACISkeleton, EmptyState,
  MembershipStatusBadge, SectionHeading,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { cn } from "@/lib/utils";

export function MemberProfile() {
  const { user, navigate, setParam } = useApp();
  const [member, setMember] = useState<MemberDTO | null>(null);
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [loading, setLoading] = useState(true);

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

  const goToSection = (section: string) => {
    setParam("section", section);
    navigate("member-profile-edit");
  };

  // ── Loading ──
  if (loading) {
    return (
      <>
        <MobileHeader title="My Profile" />
        <DesktopTopBar title="My Profile" />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4">
          {/* Avatar skeleton */}
          <div className="flex flex-col items-center gap-3 py-6">
            <CACISkeleton className="size-24 rounded-full" />
            <CACISkeleton className="h-5 w-40" />
            <CACISkeleton className="h-4 w-28" />
          </div>
          {/* Nav group skeletons */}
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

  return (
    <>
      <MobileHeader title="My Profile" />
      <DesktopTopBar
        title="My Profile"
        subtitle="View and manage your assembly information"
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-6 pb-32 md:pb-8 animate-fade-in">

        {/* ── Hero: Profile Photo (standalone, tappable) ── */}
        <div className="flex flex-col items-center gap-3 pt-2">
          {/* Avatar with camera edit badge */}
          <button
            type="button"
            onClick={() => goToSection("photo")}
            className="relative group focus:outline-none"
            aria-label="Change profile photo"
          >
            <CaciAvatar
              name={member.fullName}
              photoUrl={member.profilePhotoUrl}
              size={96}
              className="ring-2 ring-caci-blue/20 transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
            />
            {/* Camera edit badge — bottom-right corner */}
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
            {member.membershipNumber && (
              <p className="text-[11px] text-muted-foreground/60 mt-1 font-mono tracking-wide">{member.membershipNumber}</p>
            )}
          </div>
        </div>

        {/* ── Profile nav groups ── */}

        {/* Personal */}
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
        </ProfileGroup>

      </div>
    </>
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
      {/* Icon pill */}
      <span className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        {icon}
      </span>

      {/* Label + preview */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-foreground">{label}</p>
        {preview && (
          <p className="text-[12px] text-muted-foreground truncate mt-0.5">{preview}</p>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight
        size={16}
        className="text-muted-foreground/50 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
      />
    </button>
  );
}
