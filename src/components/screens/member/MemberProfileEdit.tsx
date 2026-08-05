"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  User, Phone, Heart, Briefcase, MapPin, Calendar, Info, Camera, Lock,
  ChevronRight, Save,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { MemberDTO } from "@/lib/types";
import { attachPhoneInputFormatter } from "@/lib/phone";
import {
  CACIButton, CACIInput, CACISelect, CACICard, SectionHeading, CaciAvatar,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Which sub-section to show ──
type EditSection = "photo" | "details" | "contact" | "contact-person";

// ── Shared form shape ──
type ProfileForm = {
  fullName: string;
  title: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  occupation: string;
  location: string;
  phoneNumber: string;
  whatsappNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
};

// ── Read-only fields (admin-managed) ──
const READONLY_FIELDS = ["membershipStatus", "assemblyRole", "membershipNumber", "joinDate"];

export function MemberProfileEdit() {
  const { user, setUser, back, navigate, params } = useApp();

  // Which section was requested via setParam("section", ...)
  const section: EditSection = (params?.section as EditSection) || "details";

  const [member, setMember] = useState<MemberDTO | null>(null);
  const [form, setFormState] = useState<ProfileForm>({
    fullName: "", title: "", gender: "", dateOfBirth: "", maritalStatus: "single",
    occupation: "", location: "", phoneNumber: "", whatsappNumber: "",
    emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelationship: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Photo state
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.profilePhotoUrl ?? null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoJustUploaded, setPhotoJustUploaded] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Phone refs
  const phoneRef = useRef<HTMLInputElement>(null);
  const whatsappRef = useRef<HTMLInputElement>(null);
  const emergRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phoneRef.current) return attachPhoneInputFormatter(phoneRef.current);
  }, [loading]);
  useEffect(() => {
    if (whatsappRef.current) return attachPhoneInputFormatter(whatsappRef.current);
  }, [loading]);
  useEffect(() => {
    if (emergRef.current) return attachPhoneInputFormatter(emergRef.current);
  }, [loading]);

  useEffect(() => {
    if (!user?.memberId) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const res = await api.members.get(user.memberId!);
        if (!mounted) return;
        const m = res.member;
        setMember(m);
        setFormState({
          fullName: m.fullName,
          title: m.title || "",
          gender: m.gender || "",
          dateOfBirth: m.dateOfBirth ? m.dateOfBirth.split("T")[0] : "",
          maritalStatus: m.maritalStatus || "",
          occupation: m.occupation || "",
          location: m.location || "",
          phoneNumber: m.phoneNumber || "",
          whatsappNumber: m.whatsappNumber || "",
          emergencyContactName: m.emergencyContactName || "",
          emergencyContactPhone: m.emergencyContactPhone || "",
          emergencyContactRelationship: m.emergencyContactRelationship || "",
        });
      } catch (e: any) {
        toast.error(e?.message || "Failed to load profile");
        back();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.memberId]);

  const set = (k: keyof ProfileForm, v: string) => {
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

  // Discard changes and go back
  const handleDiscard = () => {
    back();
  };

  const handleSave = async () => {
    if (!user?.memberId) return;
    if (!validate()) return;
    setSaving(true);
    try {
      await api.members.update(user.memberId, form);
      toast.success("Changes saved");
      setDirty(false);
      back();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Photo upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.memberId) return;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "profile-photos");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Upload failed");
      }
      const { url } = await res.json();
      await api.members.update(user.memberId, { profilePhotoUrl: url });
      setPhotoUrl(url);
      setUser({ ...user, profilePhotoUrl: url });
      setPhotoJustUploaded(true);
      setTimeout(() => setPhotoJustUploaded(false), 1800);
      toast.success("Photo updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to upload photo");
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <>
        <MobileHeader title="Edit Profile" onBack={back} />
        <DesktopTopBar title="Edit Profile" />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4">
          <div className="h-40 skeleton-caci rounded-2xl" />
          <div className="h-60 skeleton-caci rounded-2xl" />
        </div>
      </>
    );
  }

  // ── Section: Photo ──
  if (section === "photo") {
    return (
      <>
        <MobileHeader
          title="Profile Photo"
          onBack={handleDiscard}
        />
        <DesktopTopBar title="Profile Photo" subtitle="Update your profile picture" onBack={handleDiscard} />

        <div className="px-4 py-8 md:px-8 md:py-10 max-w-md mx-auto md:max-w-2xl flex flex-col items-center gap-6 animate-fade-in">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handlePhotoChange}
            disabled={photoUploading}
          />

          {/* Big centred avatar with camera badge */}
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={photoUploading}
            className="relative group focus:outline-none"
            aria-label="Change profile photo"
          >
            <span className={cn(
              "absolute inset-0 rounded-full transition-all duration-700",
              photoJustUploaded ? "ring-4 ring-caci-blue/40 scale-110 opacity-0" : "opacity-0"
            )} />
            <CaciAvatar
              name={user?.fullName ?? ""}
              photoUrl={photoUrl}
              size={120}
              className={cn(
                "transition-all duration-300",
                photoUploading ? "opacity-50 scale-95" : "group-hover:scale-105",
                photoJustUploaded ? "ring-2 ring-caci-blue ring-offset-2" : ""
              )}
            />
            {/* Camera overlay on hover */}
            <span className={cn(
              "absolute inset-0 rounded-full flex flex-col items-center justify-end pb-2 overflow-hidden transition-all duration-200",
              photoUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <span className="w-full bg-black/45 flex items-center justify-center py-2 rounded-b-full">
                {photoUploading ? (
                  <svg className="animate-spin size-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <Camera size={18} className="text-white" />
                )}
              </span>
            </span>
          </button>

          <div className="text-center">
            <p className="text-[16px] font-semibold text-foreground">{member?.fullName}</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              {photoUploading ? "Uploading…" : "Tap photo to change"}
            </p>
          </div>

          <CACIButton
            onClick={() => photoInputRef.current?.click()}
            disabled={photoUploading}
            loading={photoUploading}
            leftIcon={<Camera size={16} />}
            className="w-full max-w-xs"
          >
            {photoUploading ? "Uploading…" : "Choose new photo"}
          </CACIButton>

          <CACIButton
            variant="secondary"
            onClick={handleDiscard}
            className="w-full max-w-xs"
          >
            Back
          </CACIButton>
        </div>
      </>
    );
  }

  // ── Section: Profile Details (name, title, gender, dob, marital status, occupation) ──
  if (section === "details") {
    return (
      <>
        <SectionHeader
          title="Profile Details"
          subtitle="Name, gender, and personal info"
          dirty={dirty}
          saving={saving}
          onBack={handleDiscard}
          onSave={handleSave}
        />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 animate-fade-in">

          <AdminNote />

          <CACICard>
            <SectionHeading title="Identity" className="mb-4" />
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
                leftIcon={<User size={16} />}
                error={errors.fullName}
                required
              />
            </div>
          </CACICard>

          <CACICard>
            <SectionHeading title="Personal" className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gender */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-n700">Gender</span>
                <div className="flex gap-4 pt-1">
                  {(["male", "female"] as const).map((g) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer select-none group">
                      <span className={cn(
                        "size-[18px] rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                        form.gender === g ? "border-caci-blue bg-caci-blue" : "border-n300 bg-white group-hover:border-caci-blue"
                      )}>
                        {form.gender === g && <span className="size-[7px] rounded-full bg-white block" />}
                      </span>
                      <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => set("gender", g)} className="sr-only" />
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
              />
            </div>
          </CACICard>

          {/* Admin-only fields shown disabled */}
          <CACICard>
            <SectionHeading title="Assembly (admin-managed)" className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadonlyField label="Membership Status" value={member?.membershipStatus || "-"} />
              <ReadonlyField label="Assembly Role" value={member?.assemblyRole || "-"} />
              <ReadonlyField label="Membership Number" value={member?.membershipNumber || "-"} />
              <ReadonlyField label="Join Date" value={member?.joinDate ? new Date(member.joinDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-"} />
            </div>
          </CACICard>

          <SaveDiscardBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={handleDiscard} />
        </div>
      </>
    );
  }

  // ── Section: Contact ──
  if (section === "contact") {
    return (
      <>
        <SectionHeader
          title="Contact"
          subtitle="Phone number and location"
          dirty={dirty}
          saving={saving}
          onBack={handleDiscard}
          onSave={handleSave}
        />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 animate-fade-in">
          <CACICard>
            <SectionHeading title="Contact Details" className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CACIInput
                ref={phoneRef}
                label="Phone Number"
                value={form.phoneNumber}
                onChange={(e) => set("phoneNumber", e.target.value)}
                leftIcon={<Phone size={16} />}
                placeholder="024 XXX XXXX"
              />
              <CACIInput
                ref={whatsappRef}
                label="WhatsApp Number"
                value={form.whatsappNumber}
                onChange={(e) => set("whatsappNumber", e.target.value)}
                leftIcon={<Phone size={16} />}
                placeholder="024 XXX XXXX"
              />
              <CACIInput
                label="Location"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                leftIcon={<MapPin size={16} />}
                containerClassName="md:col-span-2"
              />
            </div>
          </CACICard>
          <SaveDiscardBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={handleDiscard} />
        </div>
      </>
    );
  }

  // ── Section: Contact Person ──
  if (section === "contact-person") {
    return (
      <>
        <SectionHeader
          title="Contact Person"
          subtitle="Emergency or next-of-kin contact"
          dirty={dirty}
          saving={saving}
          onBack={handleDiscard}
          onSave={handleSave}
        />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 animate-fade-in">
          <CACICard>
            <SectionHeading title="Contact Person Details" className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CACIInput
                label="Contact Name"
                value={form.emergencyContactName}
                onChange={(e) => set("emergencyContactName", e.target.value)}
                leftIcon={<User size={16} />}
              />
              <CACIInput
                ref={emergRef}
                label="Contact Phone"
                value={form.emergencyContactPhone}
                onChange={(e) => set("emergencyContactPhone", e.target.value)}
                leftIcon={<Phone size={16} />}
                placeholder="024 XXX XXXX"
              />
              <CACIInput
                label="Relationship"
                value={form.emergencyContactRelationship}
                onChange={(e) => set("emergencyContactRelationship", e.target.value)}
                leftIcon={<Heart size={16} />}
                containerClassName="md:col-span-2"
              />
            </div>
          </CACICard>
          <SaveDiscardBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={handleDiscard} />
        </div>
      </>
    );
  }

  return null;
}

// ── Shared sub-components ──

function SectionHeader({
  title, subtitle, dirty, saving, onBack, onSave,
}: {
  title: string;
  subtitle?: string;
  dirty: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}) {
  return (
    <>
      {/* Mobile header: back on left, "Save" on right (only active when dirty) */}
      <MobileHeader
        title={title}
        onBack={onBack}
        action={
          <CACIButton
            size="sm"
            onClick={onSave}
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
        title={title}
        subtitle={subtitle}
        onBack={onBack}
        action={
          <div className="flex gap-2">
            <CACIButton variant="secondary" size="sm" onClick={onBack}>Discard</CACIButton>
            <CACIButton size="sm" loading={saving} disabled={!dirty} onClick={onSave}>Save Changes</CACIButton>
          </div>
        }
      />
    </>
  );
}

function SaveDiscardBar({
  dirty, saving, onSave, onDiscard,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="md:hidden flex gap-3 pt-2 pb-8">
      <CACIButton variant="secondary" className="flex-1" onClick={onDiscard}>
        Discard
      </CACIButton>
      <CACIButton
        className="flex-1"
        loading={saving}
        disabled={!dirty}
        onClick={onSave}
      >
        Save Changes
      </CACIButton>
    </div>
  );
}

function AdminNote() {
  return (
    <div className="bg-caci-blue-bg border border-caci-blue/10 rounded-xl p-3 flex items-start gap-2">
      <Lock size={15} className="text-caci-blue shrink-0 mt-0.5" />
      <p className="text-[13px] text-caci-blue leading-snug">
        Fields like membership status and assembly role are managed by your administrator.
      </p>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-medium text-n400">{label}</span>
      <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-n50 border border-n100">
        <Lock size={13} className="text-n300 shrink-0" />
        <span className="text-[14px] text-n500 truncate">{value}</span>
      </div>
    </div>
  );
}
