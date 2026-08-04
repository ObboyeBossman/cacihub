// ============================================================
// CACI HUB — Shared Types
// ============================================================

export type Role = "admin" | "member";

export type MembershipStatus = "visitor" | "active" | "inactive";

export type GenderType = "male" | "female";

export type MaritalStatusType =
  | "single"
  | "married"
  | "divorced"
  | "widowed"
  | "other";

export type TargetingMode = "assembly" | "group" | "members";

export type MessagingMode = "open" | "restricted";

export type PermissionKey =
  | "members.read"
  | "members.write"
  | "groups.read"
  | "groups.write"
  | "broadcasts.read"
  | "broadcasts.write";

export interface SessionUser {
  id: string;
  role: Role;
  fullName: string;
  isActive: boolean;
  isSuspended?: boolean; // true when the account has been suspended (isActive=false) but the session cookie is still present
  mustChangePassword: boolean;
  phone: string;
  memberId?: string; // linked member profile (for member role)
  profilePhotoUrl?: string | null; // member's profile photo URL, populated from member profile
}

// Client-facing DTOs (no sensitive fields)
export interface MemberDTO {
  id: string;
  membershipNumber: string | null;
  title: string | null;
  fullName: string;
  dateOfBirth: string | null;
  gender: GenderType | null;
  maritalStatus: MaritalStatusType | null;
  occupation: string | null;
  location: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  membershipStatus: MembershipStatus;
  assemblyRole: string | null;
  joinDate: string | null;
  profilePhotoUrl: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  isActive: boolean;
  deletedAt: string | null;
  authUserId: string | null;
  appRole: Role | null; // role from user_profiles (admin | member), null if no linked account
  createdAt: string;
  updatedAt: string;
  groupCount?: number;
  permissions?: PermissionKey[];
}

export interface GroupDTO {
  id: string;
  name: string;
  description: string | null;
  leaderId: string | null;
  leaderName: string | null;
  messagingMode: MessagingMode;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  isMember?: boolean;
}

export interface BroadcastDTO {
  id: string;
  sentById: string;
  sentByName: string | null;
  title: string;
  body: string;
  targetGroupId: string | null;
  targetGroupName: string | null;
  targetingMode: TargetingMode;
  attachmentUrl: string | null;
  sentAt: string;
  recipientCount?: number;
}

export interface SermonQuotation {
  reference: string;
  text: string;
}

export type SermonMediaType = "audio" | "video" | "document" | "image" | "slides";

export interface SermonMediaDTO {
  id: string;
  sermonId: string;
  type: SermonMediaType;
  url: string;
  label: string | null;
  description: string | null;
  sequence: number;
}

export type SeriesStatus = "ongoing" | "completed";

export interface SermonSeriesDTO {
  id: string;
  title: string;
  description: string | null;
  theme: string | null;
  anchorText: string | null;
  coverImage: string | null;
  year: number;
  status: SeriesStatus;
  startDate: string | null;
  endDate: string | null;
  sermonCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SermonDTO {
  id: string;
  seriesId: string | null;
  seriesTitle: string | null;
  sequence: number;
  title: string;
  speaker: string;
  date: string;
  description: string | null;
  theme: string | null;
  scriptureReference: string | null;
  quotations: SermonQuotation[];
  media: SermonMediaDTO[];
  coverImageUrl: string | null;
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SermonSeriesWithSermons extends SermonSeriesDTO {
  sermons: SermonDTO[];
}

export interface NotificationDTO {
  id: string;
  memberId: string;
  type: string; // "sermon" | "broadcast" | "event" | "group" | "system"
  referenceId: string | null; // ID of the related entity
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogDTO {
  id: string;
  memberId: string;
  memberName: string | null;
  changedById: string | null;
  changedByName: string | null;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
}

export interface AssemblySettingsDTO {
  id: string;
  assemblyName: string;
  assemblyLocation: string;
  assemblyAddress: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  defaultPassword: string;
  forcePasswordReset: boolean;
}

export interface ForumMessageDTO {
  id: string;
  memberId: string;
  memberName: string;
  memberRole: string | null;
  memberTitle: string | null;
  content: string;
  createdAt: string;
  isOwn?: boolean;
}

export interface GroupMessageDTO {
  id: string;
  groupId: string;
  memberId: string;
  memberName: string;
  memberTitle: string | null;
  content: string;
  createdAt: string;
  isOwn?: boolean;
}

export interface UserProfileDTO {
  id: string;
  role: Role;
  fullName: string;
  isActive: boolean;
  mustChangePassword: boolean;
  phone: string;
  createdAt: string;
  linkedMemberId: string | null;
}

export interface DashboardStatsDTO {
  totalMembers: number;
  activeMembers: number;
  visitorCount: number;
  inactiveCount: number;
  totalGroups: number;
  activeGroups: number;
  totalBroadcasts: number;
  broadcastsThisWeek: number;
  totalSermons: number;
  unreadNotifications: number;
  memberGrowth: { label: string; value: number }[];
  statusBreakdown: { label: string; value: number; color: string }[];
  recentMembers: MemberDTO[];
  recentBroadcasts: BroadcastDTO[];
}

// ============================================================
// Attendance
// ============================================================

export type ServiceType =
  | "sunday_first"
  | "sunday_second"
  | "midweek"
  | "friday"
  | "special";

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  sunday_first: "Sunday First Service",
  sunday_second: "Sunday Second Service",
  midweek: "Midweek Service",
  friday: "Friday Service",
  special: "Special Service",
};

export interface AttendanceDTO {
  id: string;
  memberId: string;
  memberName: string;
  serviceType: ServiceType;
  serviceDate: string; // ISO date
  present: boolean;
  note: string | null;
  recordedByName: string | null;
  createdAt: string;
}

/** Aggregated attendance counts for a single service date. */
export interface AttendanceSummaryDTO {
  serviceType: ServiceType;
  serviceDate: string;
  presentCount: number;
  absentCount: number;
  totalMembers: number;
}

// ============================================================
// Events (calendar)
// ============================================================

export type EventCategory =
  | "service"
  | "meeting"
  | "conference"
  | "retreat"
  | "outreach"
  | "other";

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  service: "Service",
  meeting: "Meeting",
  conference: "Conference",
  retreat: "Retreat",
  outreach: "Outreach",
  other: "Other",
};

export const EVENT_CATEGORY_COLORS: Record<EventCategory, { bg: string; text: string; dot: string }> = {
  service:    { bg: "bg-caci-blue-bg",   text: "text-caci-blue",   dot: "bg-caci-blue" },
  meeting:    { bg: "bg-[#fff8c5]",      text: "text-[#9a6700]",   dot: "bg-[#9a6700]" },
  conference: { bg: "bg-[#dafbe1]",      text: "text-[#1a7f37]",   dot: "bg-[#1a7f37]" },
  retreat:    { bg: "bg-caci-red-bg",    text: "text-caci-red",    dot: "bg-caci-red" },
  outreach:   { bg: "bg-[#f6f8fa]",      text: "text-n500",        dot: "bg-n400" },
  other:      { bg: "bg-n50",            text: "text-n500",        dot: "bg-n300" },
};

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly";

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export interface AssemblyEventDTO {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: string; // ISO datetime
  endDate: string | null; // ISO datetime
  isAllDay: boolean;
  category: EventCategory;
  recurrence: RecurrenceType;
  recurrenceEndDate: string | null; // ISO datetime
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Directory (member-safe public profile)
// ============================================================

export interface DirectoryMemberDTO {
  id: string;
  title: string | null;
  fullName: string;
  assemblyRole: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  membershipStatus: MembershipStatus;
  profilePhotoUrl: string | null;
  occupation: string | null;
  location: string | null;
}

// ============================================================
// Global search result
// ============================================================

export type SearchResultType = "sermon" | "broadcast" | "event" | "member";

export interface SearchResultDTO {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string | null;
  date: string | null;
}
