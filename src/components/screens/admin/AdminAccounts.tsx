"use client";

import { useEffect, useState, useRef } from "react";
import {
  Shield,
  Plus,
  Phone,
  User,
  Users,
  Lock,
  Ban,
  CheckCircle2,
  Trash2,
  KeyRound,
  X,
  AlertCircle,
  ChevronRight,
  Calendar,
  UserCheck,
  UserX,
  Link2,
  CheckSquare,
  Square,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { UserProfileDTO, MemberDTO } from "@/lib/types";
import { formatPhoneDisplay, formatRelative } from "@/lib/format";
import { processPhoneInput, normalizeGhanaPhone, formatGhanaPhoneForDisplay } from "@/lib/phone";
import {
  CACIButton,
  CACICard,
  CaciAvatar,
  CACIInput,
  CACISelect,
  CACISkeleton,
  EmptyState,
  RoleBadge,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AccountRow = UserProfileDTO & { linkedMemberName?: string | null };

// ─── Main screen ──────────────────────────────────────────────────────────────

export function AdminAccounts() {
  const { user, back } = useApp();
  const [accounts, setAccounts] = useState<AccountRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProvision, setShowProvision] = useState(false);

  // Detail panel — null = closed
  const [selected, setSelected] = useState<AccountRow | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);

  const loadAccounts = async () => {
    try {
      setError(null);
      const res = await api.accounts.list();
      setAccounts(res.accounts as AccountRow[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  // Keep selected account in sync after reload
  useEffect(() => {
    if (selected && accounts) {
      const refreshed = accounts.find((a) => a.id === selected.id);
      if (refreshed) setSelected(refreshed);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  const openDetail = (acct: AccountRow) => {
    setSelected(acct);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileDetail(true);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setMobileDetail(false);
  };

  const handleSuspend = async (acct: AccountRow) => {
    if (acct.id === user?.id) { toast.error("You cannot suspend your own account."); return; }
    try {
      await api.accounts.suspend(acct.id);
      toast.success(`${acct.fullName}'s account suspended.`);
      await loadAccounts();
    } catch (e: any) { toast.error(e?.message || "Failed to suspend account"); }
  };

  const handleActivate = async (acct: AccountRow) => {
    try {
      await api.accounts.update(acct.id, { isActive: true });
      toast.success(`${acct.fullName}'s account reactivated.`);
      await loadAccounts();
    } catch (e: any) { toast.error(e?.message || "Failed to reactivate account"); }
  };

  const handleResetPassword = async (acct: AccountRow) => {
    try {
      const res = await api.accounts.update(acct.id, { resetPassword: true });
      const newPw = res.resetTo || "CACI@2026!";
      toast.success(`Password reset for ${acct.fullName}.`, { description: `New default password: ${newPw}` });
      await loadAccounts();
    } catch (e: any) { toast.error(e?.message || "Failed to reset password"); }
  };

  const handleLinkMember = async (acct: AccountRow) => {
    // Find a matching unlinked member by phone or name and link them
    try {
      const res = await api.members.list();
      const phone = acct.phone;
      const match =
        res.members.find((m) => m.phoneNumber === phone && !m.authUserId) ||
        res.members.find(
          (m) => m.fullName.toLowerCase() === acct.fullName.toLowerCase() && !m.authUserId,
        );
      if (!match) {
        toast.error("No unlinked member found matching this account's phone or name.", {
          description: "Go to the Members screen and manually set the auth link.",
        });
        return;
      }
      await api.accounts.update(acct.id, { linkedMemberId: match.id });
      toast.success(`Linked to ${match.fullName} (${match.membershipNumber ?? ""}).`);
      await loadAccounts();
    } catch (e: any) { toast.error(e?.message || "Failed to link member"); }
  };

  // Mobile full-screen detail view
  if (mobileDetail && selected) {
    return (
      <AccountDetailPage
        acct={selected}
        isSelf={selected.id === user?.id}
        onBack={closeDetail}
        onSuspend={() => handleSuspend(selected)}
        onActivate={() => handleActivate(selected)}
        onResetPassword={() => handleResetPassword(selected)}
        onLinkMember={() => handleLinkMember(selected)}
      />
    );
  }

  return (
    <>
      <MobileHeader
        title="User Accounts"
        subtitle="Provision & manage access"
        onBack={back}
        action={
          <button
            onClick={() => setShowProvision(true)}
            className="size-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 transition-colors"
            aria-label="Provision account"
          >
            <Plus size={20} className="text-white" />
          </button>
        }
      />
      <DesktopTopBar
        title="User Accounts"
        subtitle="Provision & manage access"
        onBack={back}
        action={
          <CACIButton size="sm" leftIcon={<Plus size={15} />} onClick={() => setShowProvision(true)}>
            Provision Account
          </CACIButton>
        }
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-4xl animate-fade-in">
        {error && (
          <CACICard className="mb-4 border-caci-red/30 bg-caci-red-bg">
            <p className="text-[14px] text-caci-red">{error}</p>
          </CACICard>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <CACISkeleton key={i} className="h-14" />)}
          </div>
        ) : accounts && accounts.length > 0 ? (
          <>
            <p className="text-[13px] text-n400 mb-3">{accounts.length} account(s)</p>
            <div className="space-y-2">
              {accounts.map((acct) => (
                <AccountCard
                  key={acct.id}
                  acct={acct}
                  isSelf={acct.id === user?.id}
                  isSelected={selected?.id === acct.id}
                  onClick={() => openDetail(acct)}
                  onSuspend={() => handleSuspend(acct)}
                  onActivate={() => handleActivate(acct)}
                  onResetPassword={() => handleResetPassword(acct)}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={<Shield size={20} />}
            title="No accounts yet"
            description="Provision the first user account to grant portal access."
            action={
              <CACIButton leftIcon={<Plus size={16} />} onClick={() => setShowProvision(true)}>
                Provision Account
              </CACIButton>
            }
          />
        )}
      </div>

      {/* Desktop/tablet detail sidebar */}
      <Sheet open={!!selected && !mobileDetail} onOpenChange={(open) => { if (!open) closeDetail(); }}>
        <SheetContent side="right" className="w-[360px] sm:w-[400px] p-0 flex flex-col">
          {selected && (
            <AccountDetailPanel
              acct={selected}
              isSelf={selected.id === user?.id}
              onClose={closeDetail}
              onSuspend={() => handleSuspend(selected)}
              onActivate={() => handleActivate(selected)}
              onResetPassword={() => handleResetPassword(selected)}
              onLinkMember={() => handleLinkMember(selected)}
            />
          )}
        </SheetContent>
      </Sheet>

      {showProvision && (
        <ProvisionSheet
          onClose={() => setShowProvision(false)}
          onCreated={() => { setShowProvision(false); loadAccounts(); }}
        />
      )}
    </>
  );
}

// ─── Compact Account Card ─────────────────────────────────────────────────────

function AccountCard({
  acct,
  isSelf,
  isSelected,
  onClick,
  onSuspend,
  onActivate,
  onResetPassword,
}: {
  acct: AccountRow;
  isSelf: boolean;
  isSelected: boolean;
  onClick: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onResetPassword: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 bg-white rounded-xl border px-3 py-2.5 transition-all duration-150 cursor-pointer",
        isSelected
          ? "border-caci-blue/40 bg-caci-blue-bg/30 shadow-sm"
          : "border-n100 hover:border-n200 hover:shadow-sm",
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Avatar */}
      <CaciAvatar name={acct.fullName} size={36} className="shrink-0" />

      {/* Name + status badges */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[14px] font-semibold text-n900 truncate leading-snug">
            {acct.fullName}
          </span>
          {isSelf && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-n400 bg-n100 rounded px-1.5 py-0.5 shrink-0">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <RoleBadge role={acct.role} />
          {acct.isActive ? (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-[#1a7f37]">
              <CheckCircle2 size={10} /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-caci-red">
              <Ban size={10} /> Suspended
            </span>
          )}
          {acct.mustChangePassword && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-[#9a6700]">
              <Lock size={10} /> Must reset
            </span>
          )}
          {acct.role === "member" && !acct.linkedMemberId && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-caci-red">
              <AlertCircle size={10} /> No profile
            </span>
          )}
        </div>
      </div>

      {/* Phone — right side, hidden on very small screens */}
      <p className="hidden sm:flex text-[12px] text-n400 items-center gap-1 shrink-0">
        <Phone size={11} className="text-n300" />
        {formatPhoneDisplay(acct.phone)}
      </p>

      {/* Actions menu — stop propagation so card click doesn't open detail */}
      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="size-7 flex items-center justify-center rounded-md hover:bg-n100 text-n400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              aria-label="Manage account"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <circle cx="7" cy="2" r="1.2" /><circle cx="7" cy="7" r="1.2" /><circle cx="7" cy="12" r="1.2" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onResetPassword(); }} className="text-[13px]">
              <KeyRound size={14} className="mr-2" /> Reset Password
            </DropdownMenuItem>
            {acct.isActive ? (
              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); onSuspend(); }}
                className="text-[13px] text-caci-red focus:text-caci-red"
                disabled={isSelf}
              >
                <Ban size={14} className="mr-2" /> Suspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); onActivate(); }}
                className="text-[13px] text-[#1a7f37] focus:text-[#1a7f37]"
              >
                <CheckCircle2 size={14} className="mr-2" /> Reactivate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); onSuspend(); }}
              className="text-[13px] text-caci-red focus:text-caci-red"
              disabled={isSelf}
            >
              <Trash2 size={14} className="mr-2" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chevron hint */}
      <ChevronRight size={15} className="text-n300 shrink-0 group-hover:text-caci-blue transition-colors" />
    </div>
  );
}

// ─── Shared detail content ────────────────────────────────────────────────────

function AccountDetailContent({
  acct,
  isSelf,
  onSuspend,
  onActivate,
  onResetPassword,
  onLinkMember,
}: {
  acct: AccountRow;
  isSelf: boolean;
  onSuspend: () => void;
  onActivate: () => void;
  onResetPassword: () => void;
  onLinkMember?: () => void;
}) {
  const showLinkPrompt = acct.role === "member" && !acct.linkedMemberId;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Identity hero */}
      <div className="px-6 py-7 flex flex-col items-center text-center border-b border-n100">
        <CaciAvatar name={acct.fullName} size={64} className="mb-3" />
        <h2 className="text-[18px] font-bold text-n900 leading-tight">{acct.fullName}</h2>
        {isSelf && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-n400 bg-n100 rounded px-2 py-0.5">
            You
          </span>
        )}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap justify-center">
          <RoleBadge role={acct.role} />
          {acct.isActive ? (
            <span className="inline-flex items-center gap-1 text-[12px] text-[#1a7f37] font-medium">
              <CheckCircle2 size={13} /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[12px] text-caci-red font-medium">
              <Ban size={13} /> Suspended
            </span>
          )}
          {acct.mustChangePassword && (
            <span className="inline-flex items-center gap-1 text-[12px] text-[#9a6700] font-medium">
              <Lock size={13} /> Must reset
            </span>
          )}
        </div>
      </div>

      {/* Unlinked profile warning */}
      {showLinkPrompt && (
        <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-lg bg-[#fff8c5] border border-[#9a6700]/20 p-3">
          <AlertCircle size={16} className="text-[#9a6700] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[#9a6700]">No member profile linked</p>
            <p className="text-[11px] text-[#9a6700]/80 mt-0.5">This member account has no linked church record.</p>
          </div>
        </div>
      )}

      {/* Detail rows */}
      <div className="px-5 divide-y divide-n50 mt-2">
        <DetailRow icon={<Phone size={14} />} label="Phone" value={formatPhoneDisplay(acct.phone)} />
        {acct.linkedMemberName && (
          <DetailRow icon={<User size={14} />} label="Linked Member" value={acct.linkedMemberName} />
        )}
        <DetailRow icon={<Calendar size={14} />} label="Created" value={formatRelative(acct.createdAt)} />
      </div>

      {/* Actions */}
      <div className="px-5 py-5 space-y-2.5 border-t border-n100 mt-4">
        {showLinkPrompt && onLinkMember && (
          <CACIButton
            variant="secondary"
            className="w-full justify-start border-[#9a6700]/40 text-[#9a6700] hover:bg-[#fff8c5]"
            leftIcon={<Link2 size={15} />}
            onClick={onLinkMember}
          >
            Link Member Profile
          </CACIButton>
        )}
        <CACIButton
          variant="secondary"
          className="w-full justify-start"
          leftIcon={<KeyRound size={15} />}
          onClick={onResetPassword}
        >
          Reset Password
        </CACIButton>
        {acct.isActive ? (
          <CACIButton
            className="w-full justify-start bg-transparent border border-caci-red/30 text-caci-red hover:bg-caci-red-bg"
            leftIcon={<UserX size={15} />}
            onClick={onSuspend}
            disabled={isSelf}
          >
            Suspend Account
          </CACIButton>
        ) : (
          <CACIButton
            className="w-full justify-start bg-transparent border border-[#1a7f37]/30 text-[#1a7f37] hover:bg-[#dafbe1]"
            leftIcon={<UserCheck size={15} />}
            onClick={onActivate}
          >
            Reactivate Account
          </CACIButton>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="text-n400 shrink-0">{icon}</span>
      <span className="text-[12px] text-n400 w-28 shrink-0">{label}</span>
      <span className="text-[14px] text-n800 font-medium truncate">{value}</span>
    </div>
  );
}

// ─── Desktop sidebar panel ────────────────────────────────────────────────────

function AccountDetailPanel({
  acct,
  isSelf,
  onClose,
  onSuspend,
  onActivate,
  onResetPassword,
  onLinkMember,
}: {
  acct: AccountRow;
  isSelf: boolean;
  onClose: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onResetPassword: () => void;
  onLinkMember?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-n100 shrink-0">
        <p className="text-[13px] font-semibold text-n700 uppercase tracking-wide">Account Details</p>
        <button
          onClick={onClose}
          className="size-8 flex items-center justify-center rounded-md hover:bg-n50 text-n400 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
      <AccountDetailContent
        acct={acct}
        isSelf={isSelf}
        onSuspend={onSuspend}
        onActivate={onActivate}
        onResetPassword={onResetPassword}
        onLinkMember={onLinkMember}
      />
    </div>
  );
}

// ─── Mobile full-screen detail page ──────────────────────────────────────────

function AccountDetailPage({
  acct,
  isSelf,
  onBack,
  onSuspend,
  onActivate,
  onResetPassword,
  onLinkMember,
}: {
  acct: AccountRow;
  isSelf: boolean;
  onBack: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onResetPassword: () => void;
  onLinkMember?: () => void;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background animate-fade-in">
      <MobileHeader
        title={acct.fullName}
        subtitle={acct.role === "admin" ? "Admin Account" : "Member Account"}
        onBack={onBack}
      />
      <AccountDetailContent
        acct={acct}
        isSelf={isSelf}
        onSuspend={() => { onSuspend(); onBack(); }}
        onActivate={() => { onActivate(); onBack(); }}
        onResetPassword={onResetPassword}
        onLinkMember={onLinkMember}
      />
    </div>
  );
}

// ─── Provision Sheet ─────────────────────────────────────────────────────────
// Supports two modes:
//   "single" — pick one member, confirm phone + role, provision
//   "bulk"   — multi-select unaccounted members, provision all at once

type ProvisionMode = "single" | "bulk";
type BulkResult = { memberId: string; fullName: string; status: string; phone?: string; error?: string };

function ProvisionSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [mode, setMode] = useState<ProvisionMode>("single");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-xl animate-slide-up md:animate-scale-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {mode === "single" ? (
          <SingleProvisionFlow onClose={onClose} onCreated={onCreated} onSwitchToBulk={() => setMode("bulk")} />
        ) : (
          <BulkProvisionFlow onClose={onClose} onCreated={onCreated} onSwitchToSingle={() => setMode("single")} />
        )}
      </div>
    </div>
  );
}

// ─── Single Provision Flow ────────────────────────────────────────────────────

function SingleProvisionFlow({
  onClose,
  onCreated,
  onSwitchToBulk,
}: {
  onClose: () => void;
  onCreated: () => void;
  onSwitchToBulk: () => void;
}) {
  const [step, setStep] = useState<"pick" | "confirm">("pick");
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberDTO | null>(null);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => searchRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.members.list();
        setMembers(res.members);
      } catch { /* ignore */ } finally { setMembersLoading(false); }
    })();
  }, []);

  const filteredMembers = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      (m.assemblyRole ?? "").toLowerCase().includes(q) ||
      (m.membershipNumber ?? "").toLowerCase().includes(q)
    );
  });

  const handleSelectMember = (m: MemberDTO) => {
    setSelectedMember(m);
    const rawPhone = m.phoneNumber ?? m.whatsappNumber ?? "";
    setPhone(rawPhone ? formatGhanaPhoneForDisplay(rawPhone) : "");
    setRole("member");
    setError(null);
    setStep("confirm");
  };

  const handleBack = () => { setStep("pick"); setError(null); setSelectedMember(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setError(null);

    const normalized = normalizeGhanaPhone(phone);
    if (!normalized) {
      setError("Please enter a valid Ghana phone number (e.g. 024 XXX XXXX).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.accounts.provision({
        fullName: selectedMember.fullName,
        phone: normalized,
        role,
        linkedMemberId: role === "member" ? selectedMember.id : undefined,
      });
      toast.success(`Account provisioned for ${selectedMember.fullName}.`, {
        description: `Default password: ${res.defaultPassword}`,
      });
      onCreated();
    } catch (err: any) {
      setError(err?.message || "Failed to provision account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-n100 px-4 py-3 flex items-center justify-between rounded-t-2xl shrink-0">
        <div className="flex items-center gap-2">
          {step === "confirm" && (
            <button
              onClick={handleBack}
              className="size-7 flex items-center justify-center rounded-md hover:bg-n50 text-n400 mr-1"
              aria-label="Back"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div>
            <h2 className="text-[16px] font-semibold text-n900">
              {step === "pick" ? "Select Member" : "Confirm & Provision"}
            </h2>
            <p className="text-[12px] text-n400">
              {step === "pick" ? "Choose a member to grant portal access" : "Review details before provisioning"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {step === "pick" && (
            <button
              onClick={onSwitchToBulk}
              className="flex items-center gap-1.5 text-[12px] text-caci-blue font-medium px-2.5 py-1.5 rounded-lg hover:bg-caci-blue-bg transition-colors"
              title="Switch to bulk provisioning"
            >
              <Users size={14} />
              Bulk
            </button>
          )}
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-md hover:bg-n50 text-n400"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Step 1 — Member Picker */}
      {step === "pick" && (
        <div className="flex flex-col min-h-0 flex-1">
          <div className="px-4 pt-3 pb-2 shrink-0">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-n400" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by name or role…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-[14px] border border-n200 rounded-xl bg-n50 focus:outline-none focus:ring-2 focus:ring-caci-blue/30 focus:border-caci-blue placeholder:text-n300 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-n300 hover:text-n600" aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {membersLoading ? (
              <div className="space-y-2 pt-1">{[...Array(5)].map((_, i) => <CACISkeleton key={i} className="h-16" />)}</div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-12 text-center">
                <User size={28} className="mx-auto text-n200 mb-2" />
                <p className="text-[13px] text-n400">{search ? "No members match your search" : "No members found"}</p>
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                {filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMember(m)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-n50 active:bg-n100 transition-colors group"
                  >
                    <CaciAvatar name={m.fullName} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-n900 truncate">{m.fullName}</p>
                      <p className="text-[12px] text-n400 truncate">
                        {[m.assemblyRole, m.membershipNumber].filter(Boolean).join(" · ") || "Member"}
                      </p>
                    </div>
                    <svg className="text-n300 group-hover:text-caci-blue transition-colors shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2 — Confirm & Provision */}
      {step === "confirm" && selectedMember && (
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-3 p-3 bg-n50 rounded-xl border border-n100">
            <CaciAvatar name={selectedMember.fullName} size={44} />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-n900 truncate">{selectedMember.fullName}</p>
              <p className="text-[12px] text-n400">
                {[selectedMember.assemblyRole, selectedMember.membershipNumber].filter(Boolean).join(" · ") || "Member"}
              </p>
            </div>
          </div>

          <CACIInput
            label="Phone Number"
            type="tel"
            inputMode="numeric"
            placeholder="024 XXX XXXX"
            value={phone}
            onChange={(e) => { const { display } = processPhoneInput(e.target.value); setPhone(display); }}
            disabled={submitting}
            leftIcon={<Phone size={18} />}
            maxLength={14}
          />

          <CACISelect
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "member")}
            disabled={submitting}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </CACISelect>

          <CACICard padding="sm" className="bg-n50 border-n100">
            <div className="flex gap-2 items-start">
              <AlertCircle size={14} className="text-n400 mt-0.5 shrink-0" />
              <p className="text-[12px] text-n500">
                A default password will be generated from Assembly Settings. The new user will be required to change it on first login.
              </p>
            </div>
          </CACICard>

          {error && (
            <div className="bg-caci-red-bg border border-caci-red/20 rounded-lg p-3 flex items-start gap-2 animate-fade-in">
              <AlertCircle size={16} className="text-caci-red shrink-0 mt-0.5" />
              <p className="text-[14px] text-caci-red">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <CACIButton type="button" variant="secondary" className="flex-1" onClick={handleBack} disabled={submitting}>
              Back
            </CACIButton>
            <CACIButton type="submit" loading={submitting} className="flex-1">
              {submitting ? "Provisioning…" : "Provision Account"}
            </CACIButton>
          </div>
        </form>
      )}
    </>
  );
}

// ─── Bulk Provision Flow ──────────────────────────────────────────────────────

function BulkProvisionFlow({
  onClose,
  onCreated,
  onSwitchToSingle,
}: {
  onClose: () => void;
  onCreated: () => void;
  onSwitchToSingle: () => void;
}) {
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [summary, setSummary] = useState<{ provisioned: number; skipped: number; errors: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.members.list();
        // Only show members without an account
        setMembers(res.members.filter((m) => !m.authUserId));
      } catch { /* ignore */ } finally { setMembersLoading(false); }
    })();
  }, []);

  const filtered = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      (m.phoneNumber ?? "").includes(q) ||
      (m.membershipNumber ?? "").toLowerCase().includes(q)
    );
  });

  const allFilteredIds = filtered.map((m) => m.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selected.has(id));

  const toggleMember = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleProvision = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      const res = await api.accounts.bulkProvision(Array.from(selected));
      setResults(res.results);
      setSummary(res.summary);
      if (res.summary.provisioned > 0) onCreated();
    } catch (err: any) {
      toast.error(err?.message || "Bulk provisioning failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Results screen
  if (results && summary) {
    return (
      <>
        <div className="sticky top-0 bg-white border-b border-n100 px-4 py-3 flex items-center justify-between rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-n900">Provisioning Complete</h2>
            <p className="text-[12px] text-n400">
              {summary.provisioned} created · {summary.skipped} skipped · {summary.errors} error{summary.errors !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-md hover:bg-n50 text-n400" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
          {results.map((r) => (
            <div
              key={r.memberId}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl border text-[13px]",
                r.status === "provisioned"
                  ? "border-[#1a7f37]/20 bg-[#dafbe1]"
                  : r.status === "error"
                  ? "border-caci-red/20 bg-caci-red-bg"
                  : "border-n100 bg-n50",
              )}
            >
              {r.status === "provisioned" && <CheckCircle2 size={15} className="text-[#1a7f37] shrink-0" />}
              {r.status === "error" && <AlertCircle size={15} className="text-caci-red shrink-0" />}
              {r.status.startsWith("skipped") && <AlertCircle size={15} className="text-n400 shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-n900 truncate">{r.fullName}</p>
                <p className="text-[11px] text-n400 mt-0.5">
                  {r.status === "provisioned" && `Account created · ${r.phone ?? ""}`}
                  {r.status === "skipped_no_phone" && "Skipped — no phone number on record"}
                  {r.status === "skipped_phone_taken" && "Skipped — phone already has an account"}
                  {r.status === "skipped_already_linked" && "Skipped — already has an account"}
                  {r.status === "error" && (r.error ?? "Unknown error")}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4 pt-2 shrink-0">
          <CACIButton className="w-full" onClick={onClose}>Done</CACIButton>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-n100 px-4 py-3 flex items-center justify-between rounded-t-2xl shrink-0">
        <div>
          <h2 className="text-[16px] font-semibold text-n900">Bulk Provision</h2>
          <p className="text-[12px] text-n400">
            {membersLoading ? "Loading…" : `${members.length} member${members.length !== 1 ? "s" : ""} without accounts`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSwitchToSingle}
            className="flex items-center gap-1.5 text-[12px] text-caci-blue font-medium px-2.5 py-1.5 rounded-lg hover:bg-caci-blue-bg transition-colors"
          >
            <User size={14} />
            Single
          </button>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-md hover:bg-n50 text-n400" aria-label="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-n400" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Filter members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-[14px] border border-n200 rounded-xl bg-n50 focus:outline-none focus:ring-2 focus:ring-caci-blue/30 focus:border-caci-blue placeholder:text-n300 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-n300 hover:text-n600" aria-label="Clear">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Select-all bar */}
      {!membersLoading && filtered.length > 0 && (
        <div className="px-4 pb-2 shrink-0">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-[13px] text-n600 font-medium hover:text-n900 transition-colors"
          >
            {allSelected ? (
              <CheckSquare size={16} className="text-caci-blue" />
            ) : (
              <Square size={16} className="text-n300" />
            )}
            {allSelected ? "Deselect all" : `Select all (${filtered.length})`}
          </button>
        </div>
      )}

      {/* Member list */}
      <div className="flex-1 overflow-y-auto px-4 pb-2 min-h-0">
        {membersLoading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <CACISkeleton key={i} className="h-16" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={28} className="mx-auto text-n200 mb-2" />
            <p className="text-[13px] text-n400 font-medium">
              {members.length === 0 ? "All members have accounts" : "No members match your filter"}
            </p>
            {members.length === 0 && (
              <p className="text-[12px] text-n300 mt-1">Every member record is already linked to an account.</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((m) => {
              const isSelected = selected.has(m.id);
              const hasPhone = !!(m.phoneNumber ?? m.whatsappNumber);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  className={cn(
                    "w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all",
                    isSelected
                      ? "border-caci-blue/40 bg-caci-blue-bg/30"
                      : "border-transparent hover:border-n100 hover:bg-n50",
                  )}
                >
                  {isSelected ? (
                    <CheckSquare size={18} className="text-caci-blue shrink-0" />
                  ) : (
                    <Square size={18} className="text-n300 shrink-0" />
                  )}
                  <CaciAvatar name={m.fullName} size={36} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-n900 truncate">{m.fullName}</p>
                    <p className="text-[12px] text-n400 truncate">
                      {hasPhone
                        ? formatGhanaPhoneForDisplay(m.phoneNumber ?? m.whatsappNumber ?? "")
                        : <span className="text-caci-red/80">No phone — will be skipped</span>
                      }
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer action */}
      <div className="px-4 py-3 border-t border-n100 shrink-0">
        {selected.size > 0 && (
          <p className="text-[12px] text-n400 text-center mb-2">
            {selected.size} member{selected.size !== 1 ? "s" : ""} selected · accounts will use the assembly default password
          </p>
        )}
        <CACIButton
          className="w-full"
          leftIcon={<Users size={16} />}
          disabled={selected.size === 0 || submitting}
          loading={submitting}
          onClick={handleProvision}
        >
          {submitting ? "Provisioning…" : `Provision ${selected.size > 0 ? selected.size : ""} Account${selected.size !== 1 ? "s" : ""}`}
        </CACIButton>
      </div>
    </>
  );
}
