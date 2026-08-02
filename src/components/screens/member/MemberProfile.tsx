"use client";

import { useEffect, useState } from "react";
import {
  Phone, MessageCircle, MapPin, Calendar, Briefcase, Heart, User,
  Shield, Edit, Users, Check, AlertCircle, CalendarCheck, X,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { MemberDTO, GroupDTO, AttendanceDTO } from "@/lib/types";
import { SERVICE_TYPE_LABELS } from "@/lib/types";
import { formatDate, formatPhoneDisplay } from "@/lib/format";
import {
  CACIButton, CACICard, CaciAvatar, CACISkeleton, EmptyState,
  MembershipStatusBadge, SectionHeading,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";

export function MemberProfile() {
  const { user, navigate, setParam } = useApp();
  const [member, setMember] = useState<MemberDTO | null>(null);
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.memberId) {
      setLoading(false);
      return;
    }
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
        <MobileHeader title="My Profile" />
        <DesktopTopBar title="My Profile" />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl space-y-4">
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

  return (
    <>
      <MobileHeader title="My Profile" />
      <DesktopTopBar
        title="My Profile"
        subtitle="View and manage your assembly information"
        action={
          <CACIButton size="sm" variant="secondary" leftIcon={<Edit size={15} />} onClick={() => navigate("member-profile-edit")}>
            Edit Profile
          </CACIButton>
        }
      />
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl space-y-4">
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
            variant="secondary"
            size="sm"
            className="md:hidden"
            leftIcon={<Edit size={15} />}
            onClick={() => navigate("member-profile-edit")}
          >
            Edit
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
                size="sm"
                variant="secondary"
                className="mt-3"
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
