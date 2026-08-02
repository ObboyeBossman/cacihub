"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  CalendarCheck, Users, Check, X, Search, AlertCircle, Save, ChevronLeft, ChevronRight, CheckCheck,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { MemberDTO, ServiceType, AttendanceSummaryDTO } from "@/lib/types";
import { SERVICE_TYPE_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/format";
import {
  CACIButton, CACICard, CACIInput, CACISelect, CaciAvatar, CACISkeleton, EmptyState, SectionHeading, CircularProgress,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SERVICE_OPTIONS = Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][];

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function AdminAttendance() {
  const { back } = useApp();

  const [serviceDate, setServiceDate] = useState<string>(todayISO());
  const [serviceType, setServiceType] = useState<ServiceType>("sunday_first");
  const [members, setMembers] = useState<MemberDTO[] | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<AttendanceSummaryDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load members list (active, non-deleted) once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.members.list({ status: "active" });
        if (mounted) setMembers(res.members);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load members.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load existing attendance for the selected date+service whenever they change
  const loadAttendance = useCallback(async () => {
    try {
      setError(null);
      const res = await api.attendance.list({ date: serviceDate, serviceType });
      const map: Record<string, boolean> = {};
      for (const a of res.attendance) {
        map[a.memberId] = a.present;
      }
      setAttendanceMap(map);
      // Fetch summary for the header
      try {
        const sumRes = await api.attendance.summary(serviceDate, serviceType);
        setSummary(sumRes.summary);
      } catch {
        setSummary(null);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load attendance.");
      setAttendanceMap({});
      setSummary(null);
    }
  }, [serviceDate, serviceType]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        (m.membershipNumber || "").toLowerCase().includes(q),
    );
  }, [members, searchQuery]);

  const presentCount = Object.values(attendanceMap).filter(Boolean).length;
  const markedCount = Object.keys(attendanceMap).length;

  const togglePresent = (memberId: string, present: boolean) => {
    setAttendanceMap((prev) => ({ ...prev, [memberId]: present }));
  };

  const markAllPresent = () => {
    if (!members) return;
    const all: Record<string, boolean> = {};
    for (const m of members) all[m.id] = true;
    setAttendanceMap(all);
  };

  const clearAll = () => {
    setAttendanceMap({});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendanceMap).map(([memberId, present]) => ({
        memberId,
        present,
      }));
      if (records.length === 0) {
        toast.error("Mark at least one member before saving.");
        setSaving(false);
        return;
      }
      await api.attendance.bulkRecord({ serviceType, serviceDate, records });
      toast.success(`Saved attendance for ${records.length} member${records.length !== 1 ? "s" : ""}`);
      // Refresh summary
      const sumRes = await api.attendance.summary(serviceDate, serviceType);
      setSummary(sumRes.summary);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const isToday = serviceDate === todayISO();

  return (
    <>
      <MobileHeader title="Attendance" onBack={back} />
      <DesktopTopBar
        title="Attendance"
        subtitle="Record member attendance per service"
        onBack={back}
        action={
          <CACIButton size="sm" leftIcon={<Save size={15} />} loading={saving} onClick={handleSave}>
            Save
          </CACIButton>
        }
      />
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-4xl space-y-4">
        {/* Date + service selector */}
        <CACICard>
          <SectionHeading title="Service" className="mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[14px] font-medium text-n700 mb-1.5">Date</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setServiceDate(shiftDate(serviceDate, -1))}
                  className="size-10 shrink-0 flex items-center justify-center rounded-lg border border-n100 bg-white text-n500 hover:text-caci-blue hover:border-caci-blue transition-colors"
                  aria-label="Previous day"
                >
                  <ChevronLeft size={18} />
                </button>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="flex-1 h-10 rounded-lg border border-n100 bg-white px-3 text-[16px] text-n900 outline-none focus:border-caci-blue focus:ring-2 focus:ring-caci-blue/20"
                />
                <button
                  onClick={() => setServiceDate(shiftDate(serviceDate, 1))}
                  className="size-10 shrink-0 flex items-center justify-center rounded-lg border border-n100 bg-white text-n500 hover:text-caci-blue hover:border-caci-blue transition-colors"
                  aria-label="Next day"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              {!isToday && (
                <button
                  onClick={() => setServiceDate(todayISO())}
                  className="mt-1.5 text-[12px] text-caci-blue hover:underline"
                >
                  Jump to today
                </button>
              )}
            </div>
            <CACISelect
              label="Service"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
            >
              {SERVICE_OPTIONS.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </CACISelect>
          </div>

          {/* Summary — ring + stats */}
          {summary && (
            <div className="mt-4 flex items-center gap-4 p-3 rounded-lg bg-n50">
              <CircularProgress
                value={summary.presentCount}
                max={summary.totalMembers || 1}
                size={72}
                strokeWidth={7}
                accent="#1a7f37"
                sublabel="Attendance rate"
              />
              <div className="flex-1 grid grid-cols-2 gap-2">
                <SummaryStat label="Present" value={summary.presentCount} accent="green" />
                <SummaryStat label="Absent" value={summary.absentCount} accent="red" />
                <div className="col-span-2 text-center">
                  <p className="text-[11px] text-n400">
                    of {summary.totalMembers} active member{summary.totalMembers !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CACICard>

        {/* Search + bulk actions */}
        {members && members.length > 0 && (
          <div className="space-y-3">
            <CACIInput
              placeholder="Search members…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} />}
              containerClassName="mb-0"
            />
            <div className="flex items-center gap-2">
              <CACIButton size="sm" variant="secondary" leftIcon={<CheckCheck size={14} />} onClick={markAllPresent}>
                Mark all present
              </CACIButton>
              <CACIButton size="sm" variant="ghost" onClick={clearAll}>
                Clear
              </CACIButton>
              <span className="ml-auto text-[12px] text-n400">
                {presentCount} present · {markedCount} marked
              </span>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <CACICard key={i} className="flex items-center gap-3">
                <CACISkeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <CACISkeleton className="h-4 w-1/2" />
                  <CACISkeleton className="h-3 w-1/3" />
                </div>
                <CACISkeleton className="h-8 w-20 rounded-md" />
              </CACICard>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <EmptyState
            icon={<AlertCircle size={26} />}
            title="Couldn't load attendance"
            description={error}
            action={<CACIButton onClick={loadAttendance}>Try again</CACIButton>}
          />
        )}

        {/* Empty: no members */}
        {!loading && !error && members && members.length === 0 && (
          <EmptyState
            icon={<Users size={26} />}
            title="No active members"
            description="Add members before recording attendance."
          />
        )}

        {/* Member list */}
        {!loading && !error && filteredMembers.length > 0 && (
          <div className="space-y-2">
            {filteredMembers.map((m, idx) => {
              const state = attendanceMap[m.id];
              const isMarked = state !== undefined;
              return (
                <CACICard
                  key={m.id}
                  padding="default"
                  className={cn(
                    "flex items-center gap-3 animate-stagger",
                    isMarked && state && "border-l-4 border-l-[#1a7f37]",
                    isMarked && !state && "border-l-4 border-l-caci-red",
                  )}
                  style={{ ["--stagger-i" as string]: Math.min(idx, 10) }}
                >
                  <CaciAvatar name={m.fullName} photoUrl={m.profilePhotoUrl} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-n900 truncate">
                      {m.title ? `${m.title} ` : ""}{m.fullName}
                    </p>
                    <p className="text-[12px] text-n400 truncate">
                      {m.membershipNumber || m.assemblyRole || "Member"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => togglePresent(m.id, false)}
                      className={cn(
                        "inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[12px] font-medium transition-colors",
                        isMarked && !state
                          ? "bg-caci-red-bg text-caci-red border border-caci-red/30"
                          : "bg-n50 text-n400 hover:text-caci-red hover:bg-caci-red-bg border border-transparent",
                      )}
                      aria-label={`Mark ${m.fullName} absent`}
                    >
                      <X size={13} /> Absent
                    </button>
                    <button
                      onClick={() => togglePresent(m.id, true)}
                      className={cn(
                        "inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[12px] font-medium transition-colors",
                        isMarked && state
                          ? "bg-[#dafbe1] text-[#1a7f37] border border-[#1a7f37]/30"
                          : "bg-n50 text-n400 hover:text-[#1a7f37] hover:bg-[#dafbe1] border border-transparent",
                      )}
                      aria-label={`Mark ${m.fullName} present`}
                    >
                      <Check size={13} /> Present
                    </button>
                  </div>
                </CACICard>
              );
            })}
          </div>
        )}

        {/* Mobile save button */}
        {!loading && !error && members && members.length > 0 && (
          <CACIButton className="w-full md:hidden" leftIcon={<Save size={16} />} loading={saving} onClick={handleSave}>
            Save Attendance
          </CACIButton>
        )}
      </div>
    </>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: string | number; accent: "green" | "red" | "blue" }) {
  const styles = {
    green: "bg-[#dafbe1] text-[#1a7f37]",
    red: "bg-caci-red-bg text-caci-red",
    blue: "bg-caci-blue-bg text-caci-blue",
  }[accent];
  return (
    <div className={cn("rounded-lg p-3 text-center", styles)}>
      <p className="text-[20px] font-bold leading-tight">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide opacity-80 mt-0.5">{label}</p>
    </div>
  );
}
