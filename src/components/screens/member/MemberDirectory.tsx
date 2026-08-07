"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Users, Search, AlertCircle, Phone, MessageCircle, MapPin, Briefcase, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { DirectoryMemberDTO } from "@/lib/types";
import { formatPhoneDisplay } from "@/lib/format";
import {
  CACISkeleton, EmptyState, CaciAvatar, MembershipStatusBadge,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { cn } from "@/lib/utils";

export function MemberDirectory() {
  const { back, params, setParam } = useApp();
  const [members, setMembers] = useState<DirectoryMemberDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<DirectoryMemberDTO | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.directory.list(debounced || undefined);
      setMembers(res.members);
    } catch (e: any) {
      setError(e?.message || "Failed to load directory.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-open a member's detail sheet when a memberId param is present
  // (set by global search when a member result is tapped).
  useEffect(() => {
    const targetId = params.memberId;
    if (!targetId || !members) return;
    const match = members.find((m) => m.id === targetId);
    if (match) {
      setSelected(match);
      setParam("memberId", undefined);
    }
  }, [params.memberId, members, setParam]);

  // Group members by first letter of full name for a directory feel
  const grouped = useMemo(() => {
    if (!members) return [];
    const groups: Record<string, DirectoryMemberDTO[]> = {};
    for (const m of members) {
      const letter = (m.fullName.charAt(0) || "#").toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(m);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [members]);

  return (
    <>
      <MobileHeader title="Directory" onBack={back} />
      <DesktopTopBar title="Member Directory" subtitle="Find and contact assembly members" onBack={back} />
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-4xl">
        {/* Search */}
        <div className="mb-4 sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-n400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, role, occupation, location…"
              className="w-full h-12 rounded-lg border border-n100 bg-white pl-10 pr-10 text-[16px] text-n900 placeholder:text-n300 focus:border-caci-blue focus:ring-2 focus:ring-caci-blue/20 outline-none transition-input"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center rounded-full text-n400 hover:text-n700 hover:bg-n50"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {!loading && members && (
            <p className="text-[12px] text-n400 mt-2 px-1">
              {members.length} member{members.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {/* Loading skeleton — grouped card style */}
        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden">
                <div className="px-3 py-2 bg-muted/40">
                  <CACISkeleton className="h-3 w-6" />
                </div>
                <div className="divide-y divide-border">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="flex items-center gap-3 px-3 py-2.5">
                      <CACISkeleton className="size-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <CACISkeleton className="h-3.5 w-32" />
                        <CACISkeleton className="h-3 w-24" />
                      </div>
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
            title="Couldn't load directory"
            description={error}
          />
        )}

        {/* Empty */}
        {!loading && !error && members && members.length === 0 && (
          <EmptyState
            icon={<Users size={26} />}
            title={debounced ? "No members match your search" : "No members found"}
            description={debounced ? "Try a different search term." : "There are no active members to display."}
          />
        )}

        {/* Directory list — grouped card sections */}
        {!loading && !error && grouped.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            {grouped.map(([letter, group]) => (
              <div
                key={letter}
                className="rounded-2xl bg-card border border-border overflow-hidden"
              >
                {/* Letter header with caci-blue left-border accent */}
                <div className="flex items-center px-3 py-1.5 bg-muted/40 border-l-[3px] border-l-caci-blue">
                  <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
                    {letter}
                  </span>
                  <span className="ml-2 text-[11px] text-muted-foreground/60">
                    {group.length}
                  </span>
                </div>

                {/* Compact member rows */}
                <div className="divide-y divide-border">
                  {group.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelected(m)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-muted/40 active:bg-muted/70"
                    >
                      <CaciAvatar name={m.fullName} photoUrl={m.profilePhotoUrl} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-semibold text-foreground truncate">
                            {m.title ? `${m.title} ` : ""}{m.fullName}
                          </p>
                          <MembershipStatusBadge status={m.membershipStatus} />
                        </div>
                        <p className="text-[12px] text-muted-foreground truncate mt-0.5">
                          {m.assemblyRole || m.occupation || "Member"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member detail sheet */}
      {selected && (
        <DirectoryDetailSheet member={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

function DirectoryDetailSheet({ member, onClose }: { member: DirectoryMemberDTO; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl max-w-md w-full shadow-xl animate-slide-up md:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col items-center pt-6 pb-4 px-5 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 size-8 flex items-center justify-center rounded-md text-n400 hover:text-n700 hover:bg-n50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <CaciAvatar name={member.fullName} photoUrl={member.profilePhotoUrl} size={80} />
          <h2 className="text-[20px] font-bold text-n900 mt-3 text-center">
            {member.title ? `${member.title} ` : ""}{member.fullName}
          </h2>
          {member.assemblyRole && (
            <p className="text-[14px] text-caci-blue font-medium mt-0.5">{member.assemblyRole}</p>
          )}
          <div className="mt-2">
            <MembershipStatusBadge status={member.membershipStatus} />
          </div>
        </div>

        {/* Details */}
        <div className="px-5 pb-5 space-y-3">
          {member.phoneNumber && (
            <a
              href={`tel:+${member.phoneNumber}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-n100 hover:border-caci-blue hover:bg-caci-blue-bg/50 transition-colors"
            >
              <div className="size-9 rounded-lg bg-caci-blue-bg text-caci-blue flex items-center justify-center shrink-0">
                <Phone size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-n400 font-medium uppercase tracking-wide">Phone</p>
                <p className="text-[14px] text-n900 font-medium">{formatPhoneDisplay(member.phoneNumber)}</p>
              </div>
            </a>
          )}
          {member.whatsappNumber && (
            <a
              href={`https://wa.me/${member.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-n100 hover:border-[#1a7f37] hover:bg-[#dafbe1]/50 transition-colors"
            >
              <div className="size-9 rounded-lg bg-[#dafbe1] text-[#1a7f37] flex items-center justify-center shrink-0">
                <MessageCircle size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-n400 font-medium uppercase tracking-wide">WhatsApp</p>
                <p className="text-[14px] text-n900 font-medium">{formatPhoneDisplay(member.whatsappNumber)}</p>
              </div>
            </a>
          )}
          {member.occupation && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-n50">
              <div className="size-9 rounded-lg bg-white text-n500 flex items-center justify-center shrink-0">
                <Briefcase size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-n400 font-medium uppercase tracking-wide">Occupation</p>
                <p className="text-[14px] text-n900">{member.occupation}</p>
              </div>
            </div>
          )}
          {member.location && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-n50">
              <div className="size-9 rounded-lg bg-white text-n500 flex items-center justify-center shrink-0">
                <MapPin size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-n400 font-medium uppercase tracking-wide">Location</p>
                <p className="text-[14px] text-n900">{member.location}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
