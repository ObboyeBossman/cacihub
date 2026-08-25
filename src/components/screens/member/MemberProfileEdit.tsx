"use client";

import { useEffect, useRef, useState } from "react";
import {
  User, Phone, Heart, MapPin, Calendar, Camera, Copy,
  Save, Check,
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

  // Clipboard copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
        if (m.profilePhotoUrl) {
          setPhotoUrl(m.profilePhotoUrl);
          if (user && user.profilePhotoUrl !== m.profilePhotoUrl) {
            setUser({ ...user, profilePhotoUrl: m.profilePhotoUrl });
          }
        }
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

  // Clipboard copy helper
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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

  // ── Section: Personal Information (details) ──
  if (section === "details") {
    return (
      <>
        <SectionHeader
          title="Personal Information"
          dirty={dirty}
          saving={saving}
          onBack={handleDiscard}
          onSave={handleSave}
        />
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 animate-fade-in">

          {/* Identity Card */}
          <EditCard>
            <h2 className="text-[18px] font-bold text-foreground mb-4">Identity</h2>
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
            </div>
          </EditCard>

          {/* Other Details Card */}
          <EditCard>
            <h2 className="text-[18px] font-bold text-foreground mb-4">Other Details</h2>
            <div className="space-y-4">
              <CACIInput
                label="Date of Birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
                leftIcon={<Calendar size={16} />}
              />

              {/* Gender — radio pills matching the new design's select pattern */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-foreground">Gender</span>
                <div className="flex gap-4 pt-1">
                  {(["male", "female"] as const).map((g) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer select-none group">
                      <span className={cn(
                        "size-[18px] rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                        form.gender === g ? "border-caci-blue bg-caci-blue" : "border-n300 bg-surface-input group-hover:border-caci-blue"
                      )}>
                        {form.gender === g && <span className="size-[7px] rounded-full bg-white block" />}
                      </span>
                      <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => set("gender", g)} className="sr-only" />
                      <span className="text-[14px] text-foreground capitalize">{g}</span>
                    </label>
                  ))}
                </div>
              </div>

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
              />
            </div>
          </EditCard>

          {/* Admin-managed fields shown disabled */}
          <EditCard>
            <h2 className="text-[18px] font-bold text-foreground mb-1">Assembly (admin-managed)</h2>
            <p className="text-[12px] text-muted-foreground mb-4">These fields are managed by your administrator.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadonlyField label="Membership Status" value={member?.membershipStatus || "-"} />
              <ReadonlyField label="Assembly Role" value={member?.assemblyRole || "-"} />
              <ReadonlyField label="Membership Number" value={member?.membershipNumber || "-"} />
              <ReadonlyField label="Join Date" value={member?.joinDate ? new Date(member.joinDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-"} />
            </div>
          </EditCard>

          {/* Save Changes Button */}
          <div className="pt-2 pb-32 md:pb-8">
            <button
              type="submit"
              disabled={!dirty || saving}
              className={cn(
                "w-full py-3.5 rounded-2xl font-bold text-[14px] shadow-md transition-all flex items-center justify-center gap-2",
                dirty
                  ? "bg-caci-blue hover:bg-caci-blue-dim text-white cursor-pointer active:scale-95 shadow-md"
                  : "bg-surface-card-alt text-muted-foreground border border-border cursor-not-allowed opacity-60 shadow-none"
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
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </>
    );
  }

  // ── Section: Contact Details ──
  if (section === "contact") {
    return (
      <>
        <SectionHeader
          title="Contact Details"
          dirty={dirty}
          saving={saving}
          onBack={handleDiscard}
          onSave={handleSave}
        />
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 animate-fade-in">
          <EditCard>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-[18px] font-bold text-foreground">Contact Information</h3>
                <p className="text-[12px] text-muted-foreground">Update your primary contact lines and residence</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Phone Number */}
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
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border border-n200 text-foreground text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-caci-blue transition-all bg-surface-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(form.phoneNumber, "phone")}
                    className="absolute right-3 p-1 text-n400 hover:text-caci-blue transition-colors"
                    title="Copy Phone Number"
                  >
                    {copiedField === "phone" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* WhatsApp Number */}
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
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border border-n200 text-foreground text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-caci-blue transition-all bg-surface-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(form.whatsappNumber, "whatsapp")}
                    className="absolute right-3 p-1 text-n400 hover:text-emerald-600 transition-colors"
                    title="Copy WhatsApp Number"
                  >
                    {copiedField === "whatsapp" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
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
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-n200 text-foreground text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-caci-blue transition-all bg-surface-input"
                    required
                  />
                </div>
              </div>
            </div>
          </EditCard>

          {/* Save Changes Button */}
          <div className="pt-2 pb-32 md:pb-8">
            <button
              type="submit"
              disabled={!dirty || saving}
              className={cn(
                "w-full py-3.5 rounded-2xl font-bold text-[14px] shadow-md transition-all flex items-center justify-center gap-2",
                dirty
                  ? "bg-caci-blue hover:bg-caci-blue-dim text-white cursor-pointer active:scale-95 shadow-md"
                  : "bg-surface-card-alt text-muted-foreground border border-border cursor-not-allowed opacity-60 shadow-none"
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
              {saving ? "Saving..." : "Save Contact Details"}
            </button>
          </div>
        </form>
      </>
    );
  }

  // ── Section: Contact Person / Next of Kin ──
  if (section === "contact-person") {
    return (
      <>
        <SectionHeader
          title="Contact Person"
          subtitle="Next of Kin"
          dirty={dirty}
          saving={saving}
          onBack={handleDiscard}
          onSave={handleSave}
        />
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4 animate-fade-in">
          <EditCard>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-[18px] font-bold text-foreground">Contact Person / Next of Kin</h3>
                <p className="text-[12px] text-muted-foreground">Emergency contact person details</p>
              </div>
            </div>

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
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-n200 text-foreground text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-caci-blue transition-all bg-surface-input"
                    required
                  />
                </div>
              </div>

              {/* Relationship */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-foreground">Relationship</span>
                <CACISelect
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
              </div>

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
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-n200 text-foreground text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-caci-blue transition-all bg-surface-input"
                    required
                  />
                </div>
              </div>
            </div>
          </EditCard>

          {/* Save Changes Button */}
          <div className="pt-2 pb-32 md:pb-8">
            <button
              type="submit"
              disabled={!dirty || saving}
              className={cn(
                "w-full py-3.5 rounded-2xl font-bold text-[14px] shadow-md transition-all flex items-center justify-center gap-2",
                dirty
                  ? "bg-caci-blue hover:bg-caci-blue-dim text-white cursor-pointer active:scale-95 shadow-md"
                  : "bg-surface-card-alt text-muted-foreground border border-border cursor-not-allowed opacity-60 shadow-none"
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
              {saving ? "Saving..." : "Save Contact Person"}
            </button>
          </div>
        </form>
      </>
    );
  }

  return null;
}

// ── Shared sub-components ──

function EditCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-card border border-border p-5 shadow-sm">
      {children}
    </div>
  );
}

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

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-medium text-n400">{label}</span>
      <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-n50 border border-n100">
        <span className="text-[14px] text-n500 truncate">{value}</span>
      </div>
    </div>
  );
}