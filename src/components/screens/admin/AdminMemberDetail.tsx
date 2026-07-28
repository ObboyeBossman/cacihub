"use client";

import { useEffect, useState } from "react";
import {
  Phone, MessageCircle, MapPin, Calendar, Briefcase, Heart, User,
  Shield, Users, Edit, Trash2, ExternalLink, Clock, ChevronRight,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { MemberDTO, GroupDTO, AuditLogDTO } from "@/lib/types";
import { formatDate, formatDateTime, formatRelative, formatPhoneDisplay, humanizeField } from "@/lib/format";
import {
  CACIButton, CACICard, CaciAvatar, CACISkeleton, EmptyState,
  MembershipStatusBadge, RoleBadge, SectionHeading,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// ─── animation helpers ────────────────────────────────────────────────────────

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}

// ─── main component ───────────────────────────────────────────────────────────

export function AdminMemberDetail() {
  const { params, navigate, back, setParam } = useApp();
  const memberId = params.memberId;
  const [member, setMember] = useState<MemberDTO | null>(null);
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [audit, setAudit] = useState<AuditLogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const mounted = useMounted();

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

  const goToGroup = (id: string) => {
    setParam("groupId", id);
    navigate("admin-group-detail");
  };

  // ── loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <MobileHeader title="Member" onBack={back} />
        <DesktopTopBar title="Member Profile" />
        <div className="member-detail-page">
          {/* hero skeleton */}
          <div className="hero-banner">
            <div className="flex flex-col items-center pt-8 pb-20 gap-3">
              <CACISkeleton className="size-[120px] rounded-full" />
              <CACISkeleton className="h-6 w-40 mt-2" />
              <CACISkeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="cards-container">
            {[0, 1, 2].map((i) => (
              <CACICard key={i}>
                <div className="space-y-3">
                  <CACISkeleton className="h-4 w-1/4" />
                  <CACISkeleton className="h-4 w-3/4" />
                  <CACISkeleton className="h-4 w-2/3" />
                </div>
              </CACICard>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!member) {
    return (
      <>
        <MobileHeader title="Member" onBack={back} />
        <DesktopTopBar title="Member Profile" />
        <EmptyState
          title="Member not found"
          description="This member may have been removed."
          action={<CACIButton onClick={back}>Go back</CACIButton>}
        />
      </>
    );
  }

  return (
    <>
      {/* ── nav bars ── */}
      <MobileHeader
        title={member.fullName}
        subtitle={member.membershipNumber || undefined}
        onBack={back}
      />
      <DesktopTopBar
        title={member.fullName}
        subtitle={member.membershipNumber || undefined}
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

      {/* ── page body ── */}
      <div className="member-detail-page">

        {/*
          ── SIGNATURE ELEMENT ───────────────────────────────────────
          Full-bleed CACI blue hero banner. The avatar (120px) is
          absolute-positioned to "float" at the banner's bottom edge,
          half-in / half-out - creating a depth stage that makes the
          identity the undeniable focal point. The white ring border
          separates it cleanly from both the banner and the card below.
          Slides down + avatar scales up on mount.
        */}
        <div
          className="hero-banner"
          style={{
            transform: mounted ? "translateY(0)" : "translateY(-12px)",
            opacity: mounted ? 1 : 0,
            transition: "transform 350ms cubic-bezier(0.22,1,0.36,1), opacity 300ms ease-out",
          }}
        >
          {/* subtle radial highlight so it doesn't read as flat */}
          <div className="hero-glow" />

          <div className="hero-content">
            {/* edit shortcut - top right */}
            <button
              onClick={() => navigate("admin-member-edit")}
              className="hero-edit-btn"
              aria-label="Edit member"
            >
              <Edit size={15} />
            </button>

            {/* avatar - the hero */}
            <div
              className="avatar-stage"
              style={{
                transform: mounted ? "scale(1)" : "scale(0.72)",
                opacity: mounted ? 1 : 0,
                transition: "transform 420ms cubic-bezier(0.34,1.56,0.64,1) 80ms, opacity 280ms ease-out 80ms",
              }}
            >
              <CaciAvatar
                name={member.fullName}
                photoUrl={member.profilePhotoUrl}
                size={120}
                className="avatar-ring"
              />
              {/* active dot */}
              {member.membershipStatus === "active" && (
                <span className="avatar-active-dot" aria-label="Active member" />
              )}
            </div>

            {/* name + role */}
            <div
              className="hero-identity"
              style={{
                transform: mounted ? "translateY(0)" : "translateY(8px)",
                opacity: mounted ? 1 : 0,
                transition: "transform 320ms cubic-bezier(0.22,1,0.36,1) 160ms, opacity 260ms ease-out 160ms",
              }}
            >
              <h2 className="hero-name">
                {member.title ? `${member.title} ` : ""}{member.fullName}
              </h2>
              {member.assemblyRole && (
                <p className="hero-role">{member.assemblyRole}</p>
              )}
              <div className="hero-meta">
                <MembershipStatusBadge status={member.membershipStatus} />
                <span className="text-white/50 text-[11px]">·</span>
                <span className="text-white/70 text-[12px]">
                  Since {formatDate(member.joinDate)}
                </span>
              </div>
              {member.membershipNumber && (
                <p className="hero-number">{member.membershipNumber}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── cards ── staggered fade-up */}
        <div className="cards-container">

          {/* Contact */}
          <AnimCard delay={0} mounted={mounted}>
            <InfoCard title="Contact" icon={<Phone size={15} />} color="blue">
              <ContactRow icon={<Phone size={16} />} label="Phone" value={formatPhoneDisplay(member.phoneNumber)} href={member.phoneNumber ? `tel:+${member.phoneNumber}` : undefined} />
              <ContactRow icon={<MessageCircle size={16} />} label="WhatsApp" value={formatPhoneDisplay(member.whatsappNumber)} href={member.whatsappNumber ? `https://wa.me/${member.whatsappNumber}` : undefined} />
              <ContactRow icon={<MapPin size={16} />} label="Location" value={member.location} />
            </InfoCard>
          </AnimCard>

          {/* Personal */}
          <AnimCard delay={40} mounted={mounted}>
            <InfoCard title="Personal" icon={<User size={15} />} color="green">
              <ContactRow icon={<Calendar size={16} />} label="Date of Birth" value={formatDate(member.dateOfBirth)} />
              <ContactRow icon={<User size={16} />} label="Gender" value={member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : null} />
              <ContactRow icon={<Heart size={16} />} label="Marital Status" value={member.maritalStatus ? member.maritalStatus.charAt(0).toUpperCase() + member.maritalStatus.slice(1) : null} />
              <ContactRow icon={<Briefcase size={16} />} label="Occupation" value={member.occupation} />
            </InfoCard>
          </AnimCard>

          {/* Emergency contact */}
          {(member.emergencyContactName || member.emergencyContactPhone) && (
            <AnimCard delay={80} mounted={mounted}>
              <InfoCard title="Contact Person" icon={<Heart size={15} />} color="red">
                <ContactRow icon={<User size={16} />} label="Name" value={member.emergencyContactName} />
                <ContactRow icon={<Phone size={16} />} label="Phone" value={formatPhoneDisplay(member.emergencyContactPhone)} href={member.emergencyContactPhone ? `tel:+${member.emergencyContactPhone}` : undefined} />
                <ContactRow icon={<Heart size={16} />} label="Relationship" value={member.emergencyContactRelationship} />
              </InfoCard>
            </AnimCard>
          )}

          {/* Portal account */}
          <AnimCard delay={120} mounted={mounted}>
            <CACICard>
              <SectionHeading title="Portal Account" className="mb-3" />
              {member.authUserId ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-caci-blue-bg text-caci-blue flex items-center justify-center">
                      <Shield size={18} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-n900">Account linked</p>
                      <p className="text-[12px] text-n400">Can sign in to CACI Hub</p>
                    </div>
                  </div>
                  <RoleBadge role="member" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-n50 text-n400 flex items-center justify-center">
                      <Shield size={18} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-n700">No portal account</p>
                      <p className="text-[12px] text-n400">Provision one to enable sign-in</p>
                    </div>
                  </div>
                  <CACIButton size="sm" variant="secondary" onClick={() => navigate("admin-accounts")}>
                    Provision
                  </CACIButton>
                </div>
              )}
            </CACICard>
          </AnimCard>

          {/* Groups */}
          <AnimCard delay={160} mounted={mounted}>
            <CACICard>
              <SectionHeading
                title="Groups"
                action={
                  groups.length > 0
                    ? <span className="text-[13px] text-n400">{groups.length}</span>
                    : undefined
                }
                className="mb-3"
              />
              {groups.length === 0 ? (
                <p className="text-[14px] text-n400 py-2">Not a member of any group.</p>
              ) : (
                <div className="space-y-1">
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => goToGroup(g.id)}
                      className="group-row"
                    >
                      <div className="size-10 rounded-xl bg-caci-blue-bg text-caci-blue flex items-center justify-center shrink-0 group-row-icon">
                        <Users size={16} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[14px] font-medium text-n900 truncate">{g.name}</p>
                        <p className="text-[12px] text-n400">{g.memberCount} members</p>
                      </div>
                      {g.leaderId === member.id && (
                        <span className="leader-badge">Leader</span>
                      )}
                      <ChevronRight size={14} className="text-n300 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </CACICard>
          </AnimCard>

          {/* Permissions */}
          {member.permissions && member.permissions.length > 0 && (
            <AnimCard delay={200} mounted={mounted}>
              <CACICard>
                <SectionHeading title="Granted Permissions" className="mb-3" />
                <div className="flex flex-wrap gap-2">
                  {member.permissions.map((p) => (
                    <span key={p} className="permission-chip">{p}</span>
                  ))}
                </div>
              </CACICard>
            </AnimCard>
          )}

          {/* Recent audit */}
          <AnimCard delay={240} mounted={mounted}>
            <CACICard>
              <SectionHeading
                title="Recent Changes"
                action={
                  audit.length > 0 ? (
                    <button
                      onClick={() => navigate("admin-audit")}
                      className="text-[13px] text-caci-blue hover:underline flex items-center gap-1"
                    >
                      View all <ExternalLink size={12} />
                    </button>
                  ) : undefined
                }
                className="mb-3"
              />
              {audit.length === 0 ? (
                <p className="text-[14px] text-n400 py-2">No changes recorded.</p>
              ) : (
                <div className="space-y-3">
                  {audit.map((a) => (
                    <div key={a.id} className="audit-row">
                      <div className="audit-dot" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-n700">
                          <span className="font-medium">{humanizeField(a.fieldChanged)}</span>
                          {a.oldValue && a.newValue
                            ? ` changed from "${a.oldValue}" to "${a.newValue}"`
                            : a.newValue ? ` set to "${a.newValue}"`
                            : a.oldValue ? ` cleared (was "${a.oldValue}")`
                            : ""}
                        </p>
                        <p className="text-[12px] text-n400 mt-0.5">
                          {a.changedByName || "System"} · {formatRelative(a.changedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CACICard>
          </AnimCard>

        </div>
      </div>

      {/* ── scoped styles ── */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .hero-banner, .avatar-stage, .hero-identity, .anim-card {
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }

        .member-detail-page {
          min-height: 100%;
          background: #f6f8fa;
        }

        /* ── Hero banner ── */
        .hero-banner {
          position: relative;
          background: linear-gradient(160deg, #003578 0%, #004ba0 55%, #1565c0 100%);
          overflow: visible;
          padding-bottom: 72px;
        }
        .hero-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 0%, rgba(77,159,255,0.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 24px 0;
          gap: 0;
        }
        .hero-edit-btn {
          position: absolute;
          top: 0;
          right: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.18);
          cursor: pointer;
          transition: background 160ms ease, transform 120ms ease;
        }
        .hero-edit-btn:hover {
          background: rgba(255,255,255,0.22);
          transform: scale(1.08);
        }
        .hero-edit-btn:active {
          transform: scale(0.94);
        }

        /* ── Avatar stage ── */
        .avatar-stage {
          position: relative;
          margin-bottom: 16px;
        }
        .avatar-ring img,
        .avatar-ring {
          border: 4px solid #ffffff !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.28), 0 0 0 2px rgba(255,255,255,0.15) !important;
        }
        .avatar-active-dot {
          position: absolute;
          bottom: 6px;
          right: 6px;
          width: 18px;
          height: 18px;
          background: #22c55e;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        }

        /* ── Hero identity text ── */
        .hero-identity {
          text-align: center;
          padding: 0 16px 16px;
        }
        .hero-name {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.3px;
          line-height: 1.2;
        }
        .hero-role {
          font-size: 13px;
          color: rgba(255,255,255,0.75);
          margin-top: 4px;
          font-weight: 500;
        }
        .hero-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        .hero-number {
          font-size: 11px;
          color: rgba(255,255,255,0.45);
          font-family: ui-monospace, monospace;
          margin-top: 6px;
          letter-spacing: 0.5px;
        }

        /* ── Cards container ── */
        .cards-container {
          padding: 16px 16px 32px;
          max-width: 480px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .cards-container {
            max-width: 720px;
            padding: 24px 32px 48px;
          }
          .hero-content {
            padding-top: 40px;
          }
          .hero-name { font-size: 26px; }
        }

        /* ── Animated card wrapper ── */
        .anim-card {
          transition: transform 320ms cubic-bezier(0.22,1,0.36,1), opacity 280ms ease-out;
        }

        /* ── Info card accent bar ── */
        .info-card-blue  { border-left: 3px solid #004ba0; }
        .info-card-green { border-left: 3px solid #1a7f37; }
        .info-card-red   { border-left: 3px solid #c60026; }

        /* ── Contact rows ── */
        .contact-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 0;
        }
        .contact-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #6e7681;
          background: #f6f8fa;
        }
        .contact-label {
          font-size: 12px;
          color: #6e7681;
          width: 96px;
          flex-shrink: 0;
        }

        /* ── Group rows ── */
        .group-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 8px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 150ms ease, transform 120ms ease;
        }
        .group-row:hover { background: #eff5ff; }
        .group-row:hover .group-row-icon { background: #dbeafe; }
        .group-row:active { transform: scale(0.98); }

        /* ── Leader badge ── */
        .leader-badge {
          font-size: 10px;
          background: #fff0f2;
          color: #c60026;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ── Permission chips ── */
        .permission-chip {
          font-size: 12px;
          background: #eff5ff;
          color: #004ba0;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 500;
        }

        /* ── Audit rows ── */
        .audit-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .audit-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e1e8f0;
          border: 2px solid #8b949e;
          flex-shrink: 0;
          margin-top: 5px;
        }
      `}</style>
    </>
  );
}

// ── Animated card wrapper ─────────────────────────────────────────────────────

function AnimCard({
  children,
  delay,
  mounted,
}: {
  children: React.ReactNode;
  delay: number;
  mounted: boolean;
}) {
  return (
    <div
      className="anim-card"
      style={{
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        opacity: mounted ? 1 : 0,
        transitionDelay: mounted ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}

// ── InfoCard (card with accent bar) ──────────────────────────────────────────

function InfoCard({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "red";
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-[#e8ecf0] overflow-hidden info-card-${color}`}>
      <div className="px-4 pt-4 pb-1">
        <SectionHeading title={title} className="mb-0" />
      </div>
      <div className="px-4 pb-3 divide-y divide-[#f3f5f7]">
        {children}
      </div>
    </div>
  );
}

// ── ContactRow ────────────────────────────────────────────────────────────────

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  const display = value || "-";
  return (
    <div className="contact-row">
      <span className="contact-icon">{icon}</span>
      <span className="contact-label">{label}</span>
      {href && value ? (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="text-[14px] text-caci-blue hover:underline truncate font-medium"
        >
          {display}
        </a>
      ) : (
        <span className={`text-[14px] truncate ${value ? "text-n900" : "text-n300"}`}>
          {display}
        </span>
      )}
    </div>
  );
}
