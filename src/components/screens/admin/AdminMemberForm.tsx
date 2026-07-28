"use client";

import { useEffect, useState } from "react";
import {
  User, Phone, Heart, Briefcase, MapPin, Calendar, Shield, AlertCircle,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { MemberDTO } from "@/lib/types";
import { processPhoneInput } from "@/lib/phone";
import {
  CACIButton, CACIInput, CACITextarea, CACISelect, CACICard, SectionHeading,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { toast } from "sonner";

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

export function MemberForm({
  mode, memberId, onSuccess, onCancel,
}: {
  mode: "add" | "edit";
  memberId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { back } = useApp();
  const [form, setForm] = useState<MemberFormState>(emptyForm);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing member for edit mode
  useEffect(() => {
    if (mode !== "edit" || !memberId) return;
    let mounted = true;
    (async () => {
      try {
        const res = await api.members.get(memberId);
        if (mounted) setForm(toFormState(res.member));
      } catch (e: any) {
        toast.error(e?.message || "Failed to load member");
        onCancel();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [mode, memberId, onCancel]);

  const set = (k: keyof MemberFormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setPhone = (k: keyof MemberFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { display } = processPhoneInput(e.target.value);
    setForm((f) => ({ ...f, [k]: display }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fix the errors before saving.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (mode === "edit" && memberId) {
        await api.members.update(memberId, payload);
        toast.success("Changes saved");
      } else {
        const res = await api.members.create(payload);
        toast.success(`Member added · ${res.member.membershipNumber || ""}`);
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save member");
    } finally {
      setSaving(false);
    }
  };

  const title = mode === "add" ? "Add Member" : "Edit Member";
  const subtitle = mode === "add" ? "Add a new member to the assembly" : "Update member information";

  if (loading) {
    return (
      <>
        <MobileHeader title={title} onBack={back} />
        <DesktopTopBar title={title} subtitle={subtitle} />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl space-y-4">
          <div className="h-40 skeleton-caci rounded-lg" />
          <div className="h-60 skeleton-caci rounded-lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <MobileHeader title={title} onBack={back} />
      <DesktopTopBar
        title={title}
        subtitle={subtitle}
        action={
          <div className="flex gap-2">
            <CACIButton variant="secondary" size="sm" onClick={onCancel}>Cancel</CACIButton>
            <CACIButton size="sm" loading={saving} onClick={handleSave}>
              {mode === "add" ? "Add Member" : "Save Changes"}
            </CACIButton>
          </div>
        }
      />
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl space-y-4">
        {/* Personal */}
        <CACICard>
          <SectionHeading title="Personal" className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              error={errors.fullName}
              leftIcon={<User size={16} />}
              required
            />
            {/* Gender — radio, defaults to Male */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-n700">Gender</span>
              <div className="flex gap-4 pt-1">
                {(["male", "female"] as const).map((g) => (
                  <label
                    key={g}
                    className="flex items-center gap-2 cursor-pointer select-none group"
                  >
                    <span
                      className={[
                        "size-[18px] rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                        form.gender === g
                          ? "border-caci-blue bg-caci-blue"
                          : "border-n300 bg-white group-hover:border-caci-blue",
                      ].join(" ")}
                    >
                      {form.gender === g && (
                        <span className="size-[7px] rounded-full bg-white block" />
                      )}
                    </span>
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={form.gender === g}
                      onChange={() => set("gender", g)}
                      className="sr-only"
                    />
                    <span className="text-[14px] text-n800 capitalize">{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <CACIInput
              label="Date of Birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              leftIcon={<Calendar size={16} />}
            />
            <CACISelect label="Marital Status" value={form.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)}>
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
              placeholder="e.g. Teacher"
            />
          </div>
        </CACICard>

        {/* Contact */}
        <CACICard>
          <SectionHeading title="Contact" className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CACIInput
              label="Phone Number"
              type="tel"
              inputMode="numeric"
              value={form.phoneNumber}
              onChange={setPhone("phoneNumber")}
              leftIcon={<Phone size={16} />}
              placeholder="024 XXX XXXX"
            />
            <CACIInput
              label="WhatsApp Number"
              type="tel"
              inputMode="numeric"
              value={form.whatsappNumber}
              onChange={setPhone("whatsappNumber")}
              leftIcon={<Phone size={16} />}
              placeholder="024 XXX XXXX"
            />
            <CACIInput
              label="Location"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              leftIcon={<MapPin size={16} />}
              placeholder="e.g. Assakae, Takoradi"
              containerClassName="md:col-span-2"
            />
          </div>
        </CACICard>

        {/* Church */}
        <CACICard>
          <SectionHeading title="Church" className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CACISelect label="Membership Status" value={form.membershipStatus} onChange={(e) => set("membershipStatus", e.target.value)}>
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
              containerClassName="md:col-span-2"
            />
          </div>
        </CACICard>

        {/* Contact Person */}
        <CACICard>
          <SectionHeading title="Contact Person" className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CACIInput
              label="Contact Name"
              value={form.emergencyContactName}
              onChange={(e) => set("emergencyContactName", e.target.value)}
              leftIcon={<User size={16} />}
              placeholder="Next of kin"
            />
            <CACIInput
              label="Contact Phone"
              type="tel"
              inputMode="numeric"
              value={form.emergencyContactPhone}
              onChange={setPhone("emergencyContactPhone")}
              leftIcon={<Phone size={16} />}
              placeholder="024 XXX XXXX"
            />
            <CACIInput
              label="Relationship"
              value={form.emergencyContactRelationship}
              onChange={(e) => set("emergencyContactRelationship", e.target.value)}
              leftIcon={<Heart size={16} />}
              placeholder="e.g. Spouse, Sibling"
              containerClassName="md:col-span-2"
            />
          </div>
        </CACICard>

        {/* Mobile save bar */}
        <div className="md:hidden flex gap-3 pt-2">
          <CACIButton variant="secondary" className="flex-1" onClick={onCancel}>Cancel</CACIButton>
          <CACIButton className="flex-1" loading={saving} onClick={handleSave}>
            {mode === "add" ? "Add Member" : "Save Changes"}
          </CACIButton>
        </div>
      </div>
    </>
  );
}

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
  const { params, resetTo } = useApp();
  return (
    <MemberForm
      mode="edit"
      memberId={params.memberId}
      onSuccess={() => resetTo("admin-members")}
      onCancel={() => resetTo("admin-members")}
    />
  );
}
