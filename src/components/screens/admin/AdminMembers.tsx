"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users, Plus, Search, ChevronRight, Filter, UserPlus, X, AlertCircle, Download,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { MemberDTO, MembershipStatus } from "@/lib/types";
import { formatDate, formatPhoneDisplay } from "@/lib/format";
import {
  CACIButton, CACICard, CaciAvatar, CACISkeleton, EmptyState,
  MembershipStatusBadge, CACIInput,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { cn } from "@/lib/utils";
import { toCsv, downloadCsv } from "@/lib/csv";

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

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.members.list({
        q: debounced || undefined,
        status: status || undefined,
        includeDeleted: showDeleted,
      });
      setMembers(res.members);
    } catch (e: any) {
      setMembers([]);
      setError(e?.message || "Failed to load members. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [debounced, status, showDeleted]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const goToDetail = (id: string) => {
    setParam("memberId", id);
    navigate("admin-member-detail");
  };

  const handleExportCsv = () => {
    if (!members || members.length === 0) return;
    const csv = toCsv(members, [
      { key: "fullName", label: "Full Name" },
      { key: "title", label: "Title" },
      { key: "membershipNumber", label: "Membership Number" },
      { key: "membershipStatus", label: "Status" },
      { key: "assemblyRole", label: "Assembly Role" },
      { key: "phoneNumber", label: "Phone" },
      { key: "whatsappNumber", label: "WhatsApp" },
      { key: "gender", label: "Gender" },
      { key: "maritalStatus", label: "Marital Status" },
      { key: "occupation", label: "Occupation" },
      { key: "location", label: "Location" },
      { key: "joinDate", label: "Join Date" },
      { key: "isActive", label: "Active" },
    ]);
    const today = new Date().toISOString().split("T")[0];
    downloadCsv(`caci-members-${today}.csv`, csv);
  };

  const count = members?.length ?? 0;

  // Group members alphabetically by first letter of full name
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
          <button
            onClick={() => navigate("admin-member-add")}
            className="size-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 transition-colors"
            aria-label="Add member"
          >
            <Plus size={20} className="text-white" />
          </button>
        }
      />
      <DesktopTopBar
        title="Members"
        subtitle={`${count} ${count === 1 ? "member" : "members"} in the assembly`}
        action={
          <div className="flex gap-2">
            <CACIButton
              size="sm"
              variant="secondary"
              leftIcon={<Download size={15} />}
              onClick={handleExportCsv}
              disabled={count === 0}
            >
              Export
            </CACIButton>
            <CACIButton
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={() => navigate("admin-member-add")}
            >
              Add Member
            </CACIButton>
          </div>
        }
      />
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-6xl">
        {/* Search + filter row */}
        <div className="space-y-4 mb-4">
          <CACIInput
            placeholder="Search by name, number, phone, role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search size={18} />}
            containerClassName="mb-0"
          />
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {statusFilters.map((f) => (
              <button
                key={f.key || "all"}
                onClick={() => setStatus(f.key)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors",
                  status === f.key
                    ? "bg-caci-blue text-white border-caci-blue"
                    : "bg-white text-n500 border-n100 hover:border-caci-blue hover:text-caci-blue",
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
                  : "bg-white text-n500 border-n100 hover:border-caci-red hover:text-caci-red",
              )}
            >
              {showDeleted ? "Showing deleted" : "Show deleted"}
            </button>
          </div>

          {/* Mobile export button */}
          <button
            onClick={handleExportCsv}
            disabled={count === 0}
            className="md:hidden flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-n100 bg-white text-n600 text-[14px] font-medium hover:border-caci-blue hover:text-caci-blue transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <Download size={16} />
            Export {count} member{count !== 1 ? "s" : ""} to CSV
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <CACICard key={i} className="flex items-center gap-3">
                <CACISkeleton className="size-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <CACISkeleton className="h-4 w-2/3" />
                  <CACISkeleton className="h-3 w-1/2" />
                </div>
                <CACISkeleton className="size-5" />
              </CACICard>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <EmptyState
            icon={<AlertCircle size={26} />}
            title="Couldn't load members"
            description={error}
            action={<CACIButton onClick={fetchMembers}>Try again</CACIButton>}
          />
        )}

        {/* Empty state */}
        {!loading && !error && count === 0 && (
          <EmptyState
            icon={<Users size={26} />}
            title="No members found"
            description={
              debounced || status
                ? "Try adjusting your search or filters."
                : "Add your first member to get started."
            }
            action={
              <CACIButton
                leftIcon={<UserPlus size={16} />}
                onClick={() => navigate("admin-member-add")}
              >
                Add Member
              </CACIButton>
            }
          />
        )}

        {/* Mobile: grouped cards */}
        {!loading && count > 0 && (
          <>
            <div className="space-y-4 md:hidden">
              {grouped.map(([letter, group]) => (
                <div key={letter}>
                  <h2 className="text-[13px] font-bold text-n400 uppercase tracking-wide mb-2 px-1 sticky top-16 bg-background/95 backdrop-blur-sm py-1 z-10">
                    {letter}
                  </h2>
                  <div className="space-y-3">
                    {group.map((m) => (
                      <CACICard
                        key={m.id}
                        as="button"
                        hover
                        onClick={() => goToDetail(m.id)}
                        className="flex items-center gap-3 text-left"
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); setAvatarPeek({ name: m.fullName, photoUrl: m.profilePhotoUrl ?? null }); }}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setAvatarPeek({ name: m.fullName, photoUrl: m.profilePhotoUrl ?? null }); } }}
                          className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-caci-blue cursor-pointer"
                          aria-label={`View photo of ${m.fullName}`}
                        >
                          <CaciAvatar name={m.fullName} photoUrl={m.profilePhotoUrl} size={56} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-n900 truncate">
                              {m.title ? `${m.title} ` : ""}{m.fullName}
                            </p>
                            {m.deletedAt && (
                              <span className="text-[10px] text-caci-red font-medium">DELETED</span>
                            )}
                          </div>
                          <p className="text-[12px] text-n400 truncate">
                            {m.membershipNumber || "No membership number"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <MembershipStatusBadge status={m.membershipStatus} />
                            {m.assemblyRole && (
                              <span className="text-[12px] text-n500 truncate">· {m.assemblyRole}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-n300 shrink-0" />
                      </CACICard>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table with letter-divider rows */}
            <div className="hidden md:block">
              <div className="bg-white rounded-lg border border-n100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-n50 border-b border-n100">
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
                  <tbody className="divide-y divide-n100">
                    {grouped.map(([letter, group]) => (
                      <>
                        {/* Letter divider row */}
                        <tr key={`letter-${letter}`} className="bg-n50">
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
                            className="hover:bg-n50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setAvatarPeek({ name: m.fullName, photoUrl: m.profilePhotoUrl ?? null }); }}
                                  className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-caci-blue"
                                  aria-label={`View photo of ${m.fullName}`}
                                >
                                  <CaciAvatar name={m.fullName} photoUrl={m.profilePhotoUrl} size={44} />
                                </button>
                                <div>
                                  <p className="font-semibold text-n900 text-[14px]">
                                    {m.title ? `${m.title} ` : ""}{m.fullName}
                                  </p>
                                  <p className="text-[12px] text-n400">{m.membershipNumber || "-"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3"><MembershipStatusBadge status={m.membershipStatus} /></td>
                            <td className="px-4 py-3 text-[14px] text-n500">{m.assemblyRole || "-"}</td>
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
