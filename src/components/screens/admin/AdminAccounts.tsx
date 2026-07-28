"use client";

import { useEffect, useState, useRef } from "react";
import {
  Shield,
  Plus,
  MoreVertical,
  Phone,
  User,
  Lock,
  Ban,
  CheckCircle2,
  Trash2,
  KeyRound,
  X,
  AlertCircle,
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
  SectionHeading,
  RoleBadge,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type AccountRow = UserProfileDTO & { linkedMemberName?: string | null };

export function AdminAccounts() {
  const { user } = useApp();
  const [accounts, setAccounts] = useState<AccountRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProvision, setShowProvision] = useState(false);

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

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSuspend = async (acct: AccountRow) => {
    if (acct.id === user?.id) {
      toast.error("You cannot suspend your own account.");
      return;
    }
    try {
      await api.accounts.suspend(acct.id);
      toast.success(`${acct.fullName}'s account suspended.`);
      await loadAccounts();
    } catch (e: any) {
      toast.error(e?.message || "Failed to suspend account");
    }
  };

  const handleActivate = async (acct: AccountRow) => {
    try {
      await api.accounts.update(acct.id, { isActive: true });
      toast.success(`${acct.fullName}'s account reactivated.`);
      await loadAccounts();
    } catch (e: any) {
      toast.error(e?.message || "Failed to reactivate account");
    }
  };

  const handleResetPassword = async (acct: AccountRow) => {
    try {
      const res = await api.accounts.update(acct.id, { resetPassword: true });
      const newPw = res.resetTo || "CACI@2026!";
      toast.success(
        `Password reset for ${acct.fullName}.`,
        { description: `New default password: ${newPw}` },
      );
      await loadAccounts();
    } catch (e: any) {
      toast.error(e?.message || "Failed to reset password");
    }
  };

  return (
    <>
      <MobileHeader title="User Accounts" subtitle="Provision & manage access" />
      <DesktopTopBar
        title="User Accounts"
        subtitle="Provision & manage access"
        action={
          <CACIButton
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setShowProvision(true)}
          >
            Provision Account
          </CACIButton>
        }
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-6xl animate-fade-in">
        {error && (
          <CACICard className="mb-4 border-caci-red/30 bg-caci-red-bg">
            <p className="text-[14px] text-caci-red">{error}</p>
          </CACICard>
        )}

        {/* Mobile "Provision" button */}
        <div className="md:hidden mb-4">
          <CACIButton
            className="w-full"
            leftIcon={<Plus size={18} />}
            onClick={() => setShowProvision(true)}
          >
            Provision Account
          </CACIButton>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <CACISkeleton key={i} className="h-24" />
            ))}
          </div>
        ) : accounts && accounts.length > 0 ? (
          <>
            <p className="text-[13px] text-n400 mb-3">{accounts.length} account(s)</p>
            <div className="space-y-3">
              {accounts.map((acct) => (
                <AccountCard
                  key={acct.id}
                  acct={acct}
                  isSelf={acct.id === user?.id}
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

      {showProvision && (
        <ProvisionSheet
          onClose={() => setShowProvision(false)}
          onCreated={() => {
            setShowProvision(false);
            loadAccounts();
          }}
        />
      )}
    </>
  );
}

function AccountCard({
  acct,
  isSelf,
  onSuspend,
  onActivate,
  onResetPassword,
}: {
  acct: AccountRow;
  isSelf: boolean;
  onSuspend: () => void;
  onActivate: () => void;
  onResetPassword: () => void;
}) {
  return (
    <CACICard padding="default" className="flex items-start gap-3">
      <CaciAvatar name={acct.fullName} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[15px] font-semibold text-n900 truncate">{acct.fullName}</p>
          {isSelf && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-n400 bg-n50 rounded px-1.5 py-0.5">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <RoleBadge role={acct.role} />
          {acct.isActive ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#1a7f37]">
              <CheckCircle2 size={12} /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-caci-red">
              <Ban size={12} /> Suspended
            </span>
          )}
          {acct.mustChangePassword && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#9a6700]">
              <Lock size={11} /> Must reset
            </span>
          )}
        </div>
        <div className="mt-2 space-y-0.5">
          <p className="text-[12px] text-n400 flex items-center gap-1.5">
            <Phone size={12} /> {formatPhoneDisplay(acct.phone)}
          </p>
          {acct.linkedMemberName && (
            <p className="text-[12px] text-n400 flex items-center gap-1.5">
              <User size={12} /> {acct.linkedMemberName}
            </p>
          )}
          <p className="text-[11px] text-n300">Created {formatRelative(acct.createdAt)}</p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="size-8 flex items-center justify-center rounded-md hover:bg-n50 text-n400"
            aria-label="Manage account"
          >
            <MoreVertical size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onResetPassword();
            }}
            className="text-[13px]"
          >
            <KeyRound size={14} className="mr-2" /> Reset Password
          </DropdownMenuItem>
          {acct.isActive ? (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onSuspend();
              }}
              className="text-[13px] text-caci-red focus:text-caci-red"
              disabled={isSelf}
            >
              <Ban size={14} className="mr-2" /> Suspend
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onActivate();
              }}
              className="text-[13px] text-[#1a7f37] focus:text-[#1a7f37]"
            >
              <CheckCircle2 size={14} className="mr-2" /> Reactivate
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onSuspend();
            }}
            className="text-[13px] text-caci-red focus:text-caci-red"
            disabled={isSelf}
          >
            <Trash2 size={14} className="mr-2" /> Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CACICard>
  );
}

function ProvisionSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  // Step 1: pick a member. Step 2: review + confirm.
  const [step, setStep] = useState<"pick" | "confirm">("pick");
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberDTO | null>(null);

  // Confirm-step fields (auto-filled from member, editable)
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");

  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search on open
  useEffect(() => {
    const t = setTimeout(() => searchRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.members.list();
        setMembers(res.members);
      } catch {
        // ignore
      } finally {
        setMembersLoading(false);
      }
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
    // Pre-fill phone from member record in display format (e.g. "024 943 9129")
    const rawPhone = m.phoneNumber ?? m.whatsappNumber ?? "";
    setPhone(rawPhone ? formatGhanaPhoneForDisplay(rawPhone) : "");
    setRole("member");
    setError(null);
    setStep("confirm");
  };

  const handleBack = () => {
    setStep("pick");
    setError(null);
    setSelectedMember(null);
  };

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
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-xl animate-slide-up md:animate-scale-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-n100 px-4 py-3 flex items-center justify-between rounded-t-2xl md:rounded-t-2xl shrink-0">
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
                {step === "pick"
                  ? "Choose a member to grant portal access"
                  : "Review details before provisioning"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-md hover:bg-n50 text-n400"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 1 — Member Picker */}
        {step === "pick" && (
          <div className="flex flex-col min-h-0 flex-1">
            {/* Search bar */}
            <div className="px-4 pt-3 pb-2 shrink-0">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-n400"
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                >
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
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-n300 hover:text-n600"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Member list */}
            <div className="flex-1 overflow-y-auto scroll-caci px-4 pb-4">
              {membersLoading ? (
                <div className="space-y-2 pt-1">
                  {[...Array(5)].map((_, i) => (
                    <CACISkeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="py-12 text-center">
                  <User size={28} className="mx-auto text-n200 mb-2" />
                  <p className="text-[13px] text-n400">
                    {search ? "No members match your search" : "No members found"}
                  </p>
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
                      <svg
                        className="text-n300 group-hover:text-caci-blue transition-colors shrink-0"
                        width="16" height="16" viewBox="0 0 16 16" fill="none"
                      >
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
          <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto scroll-caci flex-1">
            {/* Selected member identity card */}
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
              onChange={(e) => {
                const { display } = processPhoneInput(e.target.value);
                setPhone(display);
              }}
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
                  A default password will be generated from Assembly Settings. The new user
                  will be required to change it on first login.
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
              <CACIButton
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={handleBack}
                disabled={submitting}
              >
                Back
              </CACIButton>
              <CACIButton type="submit" loading={submitting} className="flex-1">
                {submitting ? "Provisioning…" : "Provision Account"}
              </CACIButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
