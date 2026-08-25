"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users, Plus, ChevronRight, UserPlus, X, AlertCircle,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { MemberDTO, MembershipStatus } from "@/lib/types";
import { formatDate, formatPhoneDisplay } from "@/lib/format";
import {
  CACIButton, CaciAvatar, CACISkeleton, EmptyState,
  MembershipStatusBadge, HeaderAddButton,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { cn } from "@/lib/utils";

const statusFilters: { key: "" | MembershipStatus; label: string }[] = [
  { key: "", label: "All" },
  { key: "active", label: "Active" },
  { key: "visitor", label: "Visitors" },
  { key: "inactive", label: "Inactive" },
];

export function AdminMembers() {
  const { navigate, setParam, setAdminMobileMenuOpen } = useApp();
  const [members, setMembers] = useState<MemberDTO[] | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<"" | MembershipStatus>("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarPeek, setAvatarPeek] = useState<{ name: string; photoUrl: string | null } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.members.list({
        status: status || undefined,
        onlyDeleted: showDeleted,
      });
      setMembers(res.members);
    } catch (e: any) {
      setMembers([]);
      setError(e?.message || "Failed to load members. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [status, showDeleted]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const goToDetail = (id: string) => {
    setParam("memberId", id);
    navigate("admin-member-detail");
  };

  const count = members?.length ?? 0;

  const grouped = useMemo(() => {
    if (!members) return [];
    const groups: Record<string, MemberDTO[]> = {};
    for (const m of members) {
      const letter = (m.fullName.charAt(0) || "#").toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(m);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [members]);

  return (
    <>
      <MobileHeader
        title="Members"
        subtitle={`${count} total`}
        onMenu={() => setAdminMobileMenuOpen(true)}
        action={
          <HeaderAddButton
            onClick={() => navigate("admin-member-add")}
            label="Add member"
          />
        }
      />
      <DesktopTopBar
        title="Members"
        subtitle={`${count} ${count === 1 ? "member" : "members"} in the assembly`}
        action={
          <CACIButton
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => navigate("admin-member-add")}
          >
            Add Member
          </CACIButton>
        }
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-6xl">
        {/* Filters */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {statusFilters.map((f) => (
              <button
                key={f.key || "all"}
                onClick={() => setStatus(f.key)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors",
                  status === f.key
                    ? "bg-caci-blue text-white border-caci-blue"
                    : "bg-surface-card text-foreground border-border hover:border-caci-blue hover:text-caci-blue",
                )}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => setShowDeleted((s) => !s)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ml-auto",
                showDeleted
                  ? "bg-caci-red-bg text-caci-red border-caci-red/30"
                  : "bg-surface-card text-foreground border-border hover:border-caci-red hover:text-caci-red",
              )}
            >
              {showDeleted ? "Showing deleted" : "Show deleted"}
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-5">
            {["A", "C", "M"].map((l) => (
              <div key={l}>
                <CACISkeleton className="h-3 w-4 mb-2 ml-1" />
                <div className="bg-surface-card rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <CACISkeleton className="size-9 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <CACISkeleton className="h-3.5 w-1/2" />
                        <CACISkeleton className="h-3 w-1/3" />
                      </div>
                      <CACISkeleton className="h-5 w-14 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <EmptyState
            icon={<AlertCircle size={26} />}
            title="Couldn't load members"
            description={error}
            action={<CACIButton onClick={fetchMembers}>Try again</CACIButton>}
          />
        )}

        {/* Empty */}
        {!loading && !error && count === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <EmptyState
              icon={<Users size={26} />}
              title="No members found"
            />
          </div>
        )}

        {/* Mobile: compact grouped-letter list */}
        {!loading && count > 0 && (
          <>
            <div className="space-y-5 md:hidden">
              {grouped.map(([letter, group]) => (
                <div key={letter}>
                  {/* Letter header — signature: small caci-blue pill badge */}
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="inline-flex items-center justify-center size-5 rounded-md bg-caci-blue text-white text-[10px] font-bold leading-none">
                      {letter}
                    </span>
                    <div className="flex-1 h-px bg-n100" />
                  </div>

                  {/* Shared rounded card container */}
                  <div className="bg-surface-card rounded-xl border border-border overflow-hidden divide-y divide-border">
                    {group.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => goToDetail(m.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-card-alt active:bg-surface-card-alt transition-colors"
                      >
                        {/* Avatar — tap to peek photo */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAvatarPeek({ name: m.fullName, photoUrl: m.profilePhotoUrl ?? null });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                              setAvatarPeek({ name: m.fullName, photoUrl: m.profilePhotoUrl ?? null });
                            }
                          }}
                          className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-caci-blue"
                          aria-label={`View photo of ${m.fullName}`}
                        >
                          <CaciAvatar name={m.fullName} photoUrl={m.profilePhotoUrl} size={40} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[14px] font-semibold text-n900 truncate leading-snug">
                              {m.title ? `${m.title} ` : ""}{m.fullName}
                            </p>
                            {m.deletedAt && (
                              <span className="text-[10px] text-caci-red font-bold shrink-0">DELETED</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[12px] font-medium text-muted-foreground">{formatPhoneDisplay(m.phoneNumber)}</span>
                            {m.assemblyRole && (
                              <span className="text-[12px] text-muted-foreground truncate">· {m.assemblyRole}</span>
                            )}
                          </div>
                        </div>

                        <ChevronRight size={16} className="text-n300 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table with letter-divider rows */}
            <div className="hidden md:block">
              <div className="bg-surface-card rounded-lg border border-border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-surface-card-alt border-b border-border">
                    <tr className="text-[12px] font-semibold text-n400 uppercase tracking-wide">
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3">Groups</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {grouped.map(([letter, group]) => (
                      <>
                        <tr key={`letter-${letter}`} className="bg-surface-card-alt">
                          <td
                            colSpan={7}
                            className="px-4 py-1.5 border-l-2 border-caci-blue text-[11px] font-bold text-n400 uppercase tracking-widest"
                          >
                            {letter}
                          </td>
                        </tr>
                        {group.map((m) => (
                          <tr
                            key={m.id}
                            onClick={() => goToDetail(m.id)}
                            className="hover:bg-surface-card-alt cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAvatarPeek({ name: m.fullName, photoUrl: m.profilePhotoUrl ?? null });
                                  }}
                                  className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-caci-blue"
                                  aria-label={`View photo of ${m.fullName}`}
                                >
                                  <CaciAvatar name={m.fullName} photoUrl={m.profilePhotoUrl} size={40} />
                                </button>
                                <div>
                                  <p className="font-semibold text-n900 text-[14px]">
                                    {m.title ? `${m.title} ` : ""}{m.fullName}
                                  </p>
                                  <p className="text-[12px] text-n400">{m.membershipNumber || "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3"><MembershipStatusBadge status={m.membershipStatus} /></td>
                            <td className="px-4 py-3 text-[14px] text-n500">{m.assemblyRole || "—"}</td>
                            <td className="px-4 py-3 text-[14px] text-n500">{formatPhoneDisplay(m.phoneNumber)}</td>
                            <td className="px-4 py-3 text-[14px] text-n500">{formatDate(m.joinDate)}</td>
                            <td className="px-4 py-3 text-[14px] text-n500">{m.groupCount ?? 0}</td>
                            <td className="px-4 py-3"><ChevronRight size={16} className="text-n300" /></td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Avatar lightbox */}
      {avatarPeek && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
          onClick={() => setAvatarPeek(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Photo of ${avatarPeek.name}`}
        >
          <div
            className="flex flex-col items-center gap-5"
            style={{ animation: "avatar-peek-in 220ms cubic-bezier(0.22,1,0.36,1) both" }}
            onClick={(e) => e.stopPropagation()}
          >
            <CaciAvatar name={avatarPeek.name} photoUrl={avatarPeek.photoUrl} size={192} />
            <p className="text-white text-[18px] font-semibold text-center drop-shadow">
              {avatarPeek.name}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAvatarPeek(null)}
            className="absolute top-14 right-5 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-white" />
          </button>
          <style>{`
            @keyframes avatar-peek-in {
              from { opacity: 0; transform: scale(0.82); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
