"use client";

import { useEffect, useRef, useState } from "react";
import {
  User, Phone, Heart, Briefcase, MapPin, Calendar, Shield, Save, Check,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { MemberDTO } from "@/lib/types";
import { attachPhoneInputFormatter } from "@/lib/phone";
import {
  CACIButton, CACIInput, CACISelect, CaciAvatar,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Form shape ─────────────────────────────────────────────────────────────────

interface MemberFormState {
  title: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  occupation: string;
  location: string;
  phoneNumber: string;
  whatsappNumber: string;
  membershipStatus: string;
  assemblyRole: string;
  joinDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

const emptyForm: MemberFormState = {
  title: "", fullName: "", gender: "male", dateOfBirth: "", maritalStatus: "single",
  occupation: "", location: "", phoneNumber: "", whatsappNumber: "",
  membershipStatus: "active", assemblyRole: "", joinDate: "",
  emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelationship: "",
};

function toFormState(m: MemberDTO): MemberFormState {
  return {
    title: m.title || "",
    fullName: m.fullName,
    gender: m.gender || "",
    dateOfBirth: m.dateOfBirth ? m.dateOfBirth.split("T")[0] : "",
    maritalStatus: m.maritalStatus || "",
    occupation: m.occupation || "",
    location: m.location || "",
    phoneNumber: m.phoneNumber || "",
    whatsappNumber: m.whatsappNumber || "",
    membershipStatus: m.membershipStatus,
    assemblyRole: m.assemblyRole || "",
    joinDate: m.joinDate ? m.joinDate.split("T")[0] : "",
    emergencyContactName: m.emergencyContactName || "",
    emergencyContactPhone: m.emergencyContactPhone || "",
    emergencyContactRelationship: m.emergencyContactRelationship || "",
  };
}

// ── Main form component ────────────────────────────────────────────────────────

export function MemberForm({
  mode, memberId, onSuccess, onCancel,
}: {
  mode: "add" | "edit";
  memberId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { back, setAdminMobileMenuOpen } = useApp();
  const [member, setMember] = useState<MemberDTO | null>(null);
  const [form, setFormState] = useState<MemberFormState>(emptyForm);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(mode === "add"); // "add" is always saveable
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Phone input refs for the formatter
  const phoneRef = useRef<HTMLInputElement>(null);
  const whatsappRef = useRef<HTMLInputElement>(null);
  const emergRef = useRef<HTMLInputElement>(null);

  // Attach phone formatters once inputs are rendered
  useEffect(() => {
    if (phoneRef.current) return attachPhoneInputFormatter(phoneRef.current);
  }, [loading]);
  useEffect(() => {
    if (whatsappRef.current) return attachPhoneInputFormatter(whatsappRef.current);
  }, [loading]);
  useEffect(() => {
    if (emergRef.current) return attachPhoneInputFormatter(emergRef.current);
  }, [loading]);

  // Load existing member in edit mode
  useEffect(() => {
    if (mode !== "edit" || !memberId) return;
    let mounted = true;
    (async () => {
      try {
        const res = await api.members.get(memberId);
        if (!mounted) return;
        setMember(res.member);
        setFormState(toFormState(res.member));
      } catch (e: any) {
        toast.error(e?.message || "Failed to load member");
        onCancel();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [mode, memberId, onCancel]);

  const set = (k: keyof MemberFormState, v: string) => {
    setFormState((f) => ({ ...f, [k]: v }));
    setDirty(true);
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: "" }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fix the errors before saving.");
      return;
    }
    setSaving(true);
    try {
      if (mode === "edit" && memberId) {
        await api.members.update(memberId, form);
        toast.success("Changes saved");
      } else {
        const res = await api.members.create(form);
        toast.success(`Member added · ${res.member.membershipNumber || ""}`);
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save member");
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = mode === "add" ? "Add Member" : "Edit Member";
  const pageSubtitle = mode === "add"
    ? "Add a new member to the assembly"
    : "Update member information";

  // ── Loading skeleton ──
  if (loading) {
    return (
      <>
        <MobileHeader title={pageTitle} onBack={back} onMenu={() => setAdminMobileMenuOpen(true)} />
        <DesktopTopBar title={pageTitle} subtitle={pageSubtitle} />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4">
          <div className="h-40 skeleton-caci rounded-2xl" />
          <div className="h-60 skeleton-caci rounded-2xl" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Nav bars with inline Save action ── */}
      <MobileHeader
        title={pageTitle}
        onBack={onCancel}
        onMenu={() => setAdminMobileMenuOpen(true)}
        action={
          <CACIButton
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={!dirty}
            leftIcon={!saving ? <Save size={14} /> : undefined}
            className={cn(
              "transition-all duration-200",
              dirty ? "opacity-100" : "opacity-40 pointer-events-none"
            )}
          >
            Save
          </CACIButton>
        }
      />
      <DesktopTopBar
        title={pageTitle}
        subtitle={pageSubtitle}
        onBack={onCancel}
        action={
          <div className="flex gap-2">
            <CACIButton variant="secondary" size="sm" onClick={onCancel}>Cancel</CACIButton>
            <CACIButton size="sm" loading={saving} disabled={!dirty} onClick={handleSave}>
              {mode === "add" ? "Add Member" : "Save Changes"}
            </CACIButton>
          </div>
        }
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 pb-32 md:pb-8 animate-fade-in">

        {/* ── Identity card: avatar + name preview (edit mode only) ── */}
        {mode === "edit" && member && (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border">
            <CaciAvatar
              name={member.fullName}
              photoUrl={member.profilePhotoUrl}
              size={56}
              className="shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-foreground truncate">
                {member.title ? `${member.title} ` : ""}{member.fullName}
              </p>
              {member.membershipNumber && (
                <p className="text-[12px] text-muted-foreground font-mono mt-0.5">
                  {member.membershipNumber}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Section 1: Identity ── */}
        <EditCard label="Identity">
          <div className="space-y-4">
            <CACIInput
              label="Title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Mr, Mrs, Rev, Elder"
            />
            <CACIInput
              label="Full Name"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              leftIcon={<User size={16} />}
              error={errors.fullName}
              required
            />

            {/* Gender radio pills */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-foreground">Gender</span>
              <div className="flex gap-4 pt-1">
                {(["male", "female"] as const).map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer select-none group">
                    <span className={cn(
                      "size-[18px] rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                      form.gender === g
                        ? "border-caci-blue bg-caci-blue"
                        : "border-n300 bg-white group-hover:border-caci-blue"
                    )}>
                      {form.gender === g && <span className="size-[7px] rounded-full bg-white block" />}
                    </span>
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={form.gender === g}
                      onChange={() => set("gender", g)}
                      className="sr-only"
                    />
                    <span className="text-[14px] text-foreground capitalize">{g}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </EditCard>

        {/* ── Section 2: Personal Details ── */}
        <EditCard label="Personal Details">
          <div className="space-y-4">
            <CACIInput
              label="Date of Birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              leftIcon={<Calendar size={16} />}
            />
            <CACISelect
              label="Marital Status"
              value={form.maritalStatus}
              onChange={(e) => set("maritalStatus", e.target.value)}
            >
              <option value="">Select...</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="other">Other</option>
            </CACISelect>
            <CACIInput
              label="Occupation"
              value={form.occupation}
              onChange={(e) => set("occupation", e.target.value)}
              leftIcon={<Briefcase size={16} />}
              placeholder="e.g. Teacher, Nurse, Business Owner"
            />
          </div>
        </EditCard>

        {/* ── Section 3: Contact Details ── */}
        <EditCard label="Contact Details">
          <div className="space-y-4">
            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-foreground">Phone Number</span>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-caci-blue pointer-events-none">
                  <Phone size={18} />
                </div>
                <input
                  ref={phoneRef}
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => set("phoneNumber", e.target.value)}
                  placeholder="024 XXX XXXX"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-n200 text-foreground text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-caci-blue transition-all bg-white"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-foreground">WhatsApp Number</span>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-emerald-600 pointer-events-none">
                  <Phone size={18} />
                </div>
                <input
                  ref={whatsappRef}
                  type="tel"
                  value={form.whatsappNumber}
                  onChange={(e) => set("whatsappNumber", e.target.value)}
                  placeholder="024 XXX XXXX"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-n200 text-foreground text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-caci-blue transition-all bg-white"
                />
              </div>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-foreground">Residential Location / Town</span>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-rose-500 pointer-events-none">
                  <MapPin size={18} />
                </div>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Assakae, Takoradi"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-n200 text-foreground text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-caci-blue transition-all bg-white"
                />
              </div>
            </div>
          </div>
        </EditCard>

        {/* ── Section 4: Church (admin-only editable fields) ── */}
        <EditCard label="Church & Assembly">
          <div className="space-y-4">
            <CACISelect
              label="Membership Status"
              value={form.membershipStatus}
              onChange={(e) => set("membershipStatus", e.target.value)}
            >
              <option value="visitor">Visitor</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </CACISelect>
            <CACIInput
              label="Assembly Role"
              value={form.assemblyRole}
              onChange={(e) => set("assemblyRole", e.target.value)}
              leftIcon={<Shield size={16} />}
              placeholder="e.g. Usher, Elder, Choir Member"
            />
            <CACIInput
              label="Join Date"
              type="date"
              value={form.joinDate}
              onChange={(e) => set("joinDate", e.target.value)}
              leftIcon={<Calendar size={16} />}
            />
          </div>
        </EditCard>

        {/* ── Section 5: Contact Person / Next of Kin ── */}
        <EditCard label="Contact Person / Next of Kin">
          <div className="space-y-4">
            {/* Contact Person Name */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-foreground">Contact Person Name</span>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-n400 pointer-events-none">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={form.emergencyContactName}
                  onChange={(e) => set("emergencyContactName", e.target.value)}
                  placeholder="Next of kin full name"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-n200 text-foreground text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-caci-blue transition-all bg-white"
                />
              </div>
            </div>

            {/* Relationship */}
            <CACISelect
              label="Relationship"
              value={form.emergencyContactRelationship}
              onChange={(e) => set("emergencyContactRelationship", e.target.value)}
            >
              <option value="">Select...</option>
              <option value="Parent">Parent</option>
              <option value="Spouse">Spouse</option>
              <option value="Sibling">Sibling</option>
              <option value="Child">Child</option>
              <option value="Guardian">Guardian</option>
              <option value="Relative">Relative</option>
              <option value="Friend">Friend</option>
            </CACISelect>

            {/* Contact Person Phone */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-foreground">Phone Number</span>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-caci-blue pointer-events-none">
                  <Phone size={18} />
                </div>
                <input
                  ref={emergRef}
                  type="tel"
                  value={form.emergencyContactPhone}
                  onChange={(e) => set("emergencyContactPhone", e.target.value)}
                  placeholder="024 XXX XXXX"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-n200 text-foreground text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-caci-blue transition-all bg-white"
                />
              </div>
            </div>
          </div>
        </EditCard>

        {/* ── Bottom save button (matches MemberProfileEdit pattern) ── */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className={cn(
              "w-full py-3.5 rounded-2xl font-bold text-[14px] shadow-md transition-all flex items-center justify-center gap-2",
              dirty
                ? "bg-caci-blue hover:bg-caci-blue-dim text-white cursor-pointer active:scale-95"
                : "bg-n200 text-n500 cursor-not-allowed opacity-70"
            )}
          >
            {saving ? (
              <svg className="animate-spin size-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <Check size={18} />
            )}
            {saving ? "Saving…" : mode === "add" ? "Add Member" : "Save Changes"}
          </button>
        </div>

      </div>
    </>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function EditCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
        {label}
      </p>
      <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
        {children}
      </div>
    </div>
  );
}

// ── Entrypoints (unchanged public API) ────────────────────────────────────────

export function AdminMemberAdd() {
  const { resetTo } = useApp();
  return (
    <MemberForm
      mode="add"
      onSuccess={() => resetTo("admin-members")}
      onCancel={() => resetTo("admin-members")}
    />
  );
}

export function AdminMemberEdit() {
  const { params, back } = useApp();
  return (
    <MemberForm
      mode="edit"
      memberId={params.memberId}
      onSuccess={back}
      onCancel={back}
    />
  );
}
