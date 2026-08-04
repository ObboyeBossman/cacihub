"use client";

import { useEffect, useRef, useState } from "react";
import {
  User, Phone, Heart, Briefcase, MapPin, Calendar, Info, Camera,
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

export function MemberProfileEdit() {
  const { user, setUser, back, resetTo } = useApp();
  const [form, setForm] = useState<any>({
    fullName: "", title: "", gender: "", dateOfBirth: "", maritalStatus: "single",
    occupation: "", location: "", phoneNumber: "", whatsappNumber: "",
    emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelationship: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.profilePhotoUrl ?? null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoJustUploaded, setPhotoJustUploaded] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const whatsappRef = useRef<HTMLInputElement>(null);
  const emergRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phoneRef.current) return attachPhoneInputFormatter(phoneRef.current);
  }, []);
  useEffect(() => {
    if (whatsappRef.current) return attachPhoneInputFormatter(whatsappRef.current);
  }, []);
  useEffect(() => {
    if (emergRef.current) return attachPhoneInputFormatter(emergRef.current);
  }, []);

  useEffect(() => {
    if (!user?.memberId) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const res = await api.members.get(user.memberId!);
        if (!mounted) return;
        const m = res.member;
        setForm({
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
  }, [user?.memberId]); // intentionally omit `back` — it's a stable Zustand action but its reference changes on re-render, which would re-fetch and discard the user's edits mid-save

  const set = (k: string, v: string) => {
    setForm((f: any) => ({ ...f, [k]: v }));
    // Clear field error as the user types
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: "" }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

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

      // Persist to member profile
      await api.members.update(user.memberId, { profilePhotoUrl: url });

      // Update local state and session so nav avatars refresh immediately
      setPhotoUrl(url);
      setUser({ ...user, profilePhotoUrl: url });

      setPhotoJustUploaded(true);
      setTimeout(() => setPhotoJustUploaded(false), 1800);
      toast.success("Photo updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to upload photo");
    } finally {
      setPhotoUploading(false);
      // Reset input so the same file can be re-selected if needed
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!user?.memberId) return;
    if (!validate()) return;
    setSaving(true);
    try {
      await api.members.update(user.memberId, form);
      toast.success("Profile updated");
      resetTo("member-profile");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <MobileHeader title="Edit Profile" onBack={back} />
        <DesktopTopBar title="Edit Profile" />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4">
          <div className="h-40 skeleton-caci rounded-lg" />
          <div className="h-60 skeleton-caci rounded-lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <MobileHeader title="Edit Profile" onBack={back} />
      <DesktopTopBar
        title="Edit Profile"
        subtitle="Update your personal information"
        action={
          <div className="flex gap-2">
            <CACIButton variant="secondary" size="sm" onClick={() => resetTo("member-profile")}>Cancel</CACIButton>
            <CACIButton size="sm" loading={saving} onClick={handleSave}>Save Changes</CACIButton>
          </div>
        }
      />
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4">
        {/* Photo upload */}
        <div className="flex flex-col items-center py-2">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handlePhotoChange}
            disabled={photoUploading}
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={photoUploading}
            className="relative group focus:outline-none"
            aria-label="Change profile photo"
          >
            {/* Ring pulse on upload success — the signature interaction */}
            <span
              className={[
                "absolute inset-0 rounded-full transition-all duration-700",
                photoJustUploaded ? "ring-4 ring-caci-blue/40 scale-110 opacity-0" : "opacity-0",
              ].join(" ")}
            />
            <CaciAvatar
              name={user?.fullName ?? ""}
              photoUrl={photoUrl}
              size={88}
              className={[
                "transition-all duration-300",
                photoUploading ? "opacity-50 scale-95" : "group-hover:scale-105",
                photoJustUploaded ? "ring-2 ring-caci-blue ring-offset-2" : "",
              ].join(" ")}
            />
            {/* Camera overlay — slides up on hover */}
            <span className={[
              "absolute inset-0 rounded-full flex flex-col items-center justify-end pb-1.5 overflow-hidden",
              "transition-all duration-200",
              photoUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            ].join(" ")}>
              <span className="w-full bg-black/45 flex items-center justify-center py-1.5 rounded-b-full">
                {photoUploading ? (
                  <svg className="animate-spin size-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <Camera size={14} className="text-white" />
                )}
              </span>
            </span>
          </button>
          <p className="text-[12px] text-n400 mt-2">
            {photoUploading ? "Uploading…" : "Tap to change photo"}
          </p>
        </div>

        <div className="bg-caci-blue-bg border border-caci-blue/10 rounded-lg p-3 flex items-start gap-2">
          <Info size={16} className="text-caci-blue shrink-0 mt-0.5" />
          <p className="text-[13px] text-caci-blue">
            Some fields (like membership status and assembly role) are managed by your assembly administrator. Contact them to update those.
          </p>
        </div>

        <CACICard>
          <SectionHeading title="Personal" className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CACIInput label="Title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Mr, Mrs, Rev, Elder" />
            <CACIInput label="Full Name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} leftIcon={<User size={16} />} error={errors.fullName} required />
            {/* Gender - radio */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-n700">Gender</span>
              <div className="flex gap-4 pt-1">
                {(["male", "female"] as const).map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer select-none group">
                    <span className={[
                      "size-[18px] rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                      form.gender === g ? "border-caci-blue bg-caci-blue" : "border-n300 bg-white group-hover:border-caci-blue",
                    ].join(" ")}>
                      {form.gender === g && <span className="size-[7px] rounded-full bg-white block" />}
                    </span>
                    <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => set("gender", g)} className="sr-only" />
                    <span className="text-[14px] text-n800 capitalize">{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <CACIInput label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} leftIcon={<Calendar size={16} />} />
            <CACISelect label="Marital Status" value={form.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)}>
              <option value="">Select...</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="other">Other</option>
            </CACISelect>
            <CACIInput label="Occupation" value={form.occupation} onChange={(e) => set("occupation", e.target.value)} leftIcon={<Briefcase size={16} />} />
          </div>
        </CACICard>

        <CACICard>
          <SectionHeading title="Contact" className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CACIInput ref={phoneRef} label="Phone Number" value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} leftIcon={<Phone size={16} />} placeholder="024 XXX XXXX" />
            <CACIInput ref={whatsappRef} label="WhatsApp Number" value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} leftIcon={<Phone size={16} />} placeholder="024 XXX XXXX" />
            <CACIInput label="Location" value={form.location} onChange={(e) => set("location", e.target.value)} leftIcon={<MapPin size={16} />} containerClassName="md:col-span-2" />
          </div>
        </CACICard>

        <CACICard>
          <SectionHeading title="Contact Person" className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CACIInput label="Contact Name" value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} leftIcon={<User size={16} />} />
            <CACIInput ref={emergRef} label="Contact Phone" value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} leftIcon={<Phone size={16} />} placeholder="024 XXX XXXX" />
            <CACIInput label="Relationship" value={form.emergencyContactRelationship} onChange={(e) => set("emergencyContactRelationship", e.target.value)} leftIcon={<Heart size={16} />} containerClassName="md:col-span-2" />
          </div>
        </CACICard>

        <div className="md:hidden flex gap-3 pt-2">
          <CACIButton variant="secondary" className="flex-1" onClick={() => resetTo("member-profile")}>Cancel</CACIButton>
          <CACIButton className="flex-1" loading={saving} onClick={handleSave}>Save Changes</CACIButton>
        </div>
      </div>
    </>
  );
}
