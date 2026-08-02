// ============================================================
// CACI Hub — API client (browser-side fetch wrapper)
// ============================================================

import type {
  MemberDTO,
  GroupDTO,
  BroadcastDTO,
  SermonSeriesDTO,
  SermonSeriesWithSermons,
  SermonDTO,
  NotificationDTO,
  AuditLogDTO,
  AssemblySettingsDTO,
  ForumMessageDTO,
  GroupMessageDTO,
  SessionUser,
  DashboardStatsDTO,
  UserProfileDTO,
  AttendanceDTO,
  AttendanceSummaryDTO,
  ServiceType,
} from "@/lib/types";

async function jsonFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as any)?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  auth: {
    login: (phone: string, password: string) =>
      jsonFetch<{ ok: boolean; user: SessionUser; redirect: string; error?: string }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ phone, password }) },
      ),
    logout: () => jsonFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
    me: () =>
      jsonFetch<{ user: SessionUser | null; suspended?: boolean; suspendedName?: string }>(
        "/api/auth/me",
      ),
    changePassword: (currentPassword: string, newPassword: string) =>
      jsonFetch<{ ok: boolean; user: SessionUser }>(
        "/api/auth/change-password",
        { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) },
      ),
  },

  dashboard: {
    get: () => jsonFetch<{ stats: DashboardStatsDTO }>("/api/dashboard"),
  },

  members: {
    list: (opts: { q?: string; status?: string; includeDeleted?: boolean } = {}) => {
      const p = new URLSearchParams();
      if (opts.q) p.set("q", opts.q);
      if (opts.status) p.set("status", opts.status);
      if (opts.includeDeleted) p.set("includeDeleted", "true");
      return jsonFetch<{ members: MemberDTO[] }>(`/api/members?${p.toString()}`);
    },
    get: (id: string) => jsonFetch<{ member: MemberDTO }>(`/api/members?id=${id}`),
    create: (data: any) =>
      jsonFetch<{ member: MemberDTO }>("/api/members", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      jsonFetch<{ member: MemberDTO }>(`/api/members`, { method: "PATCH", body: JSON.stringify({ id, ...data }) }),
    remove: (id: string) =>
      jsonFetch<{ ok: boolean }>(`/api/members?id=${id}`, { method: "DELETE" }),
  },

  groups: {
    list: (opts: { memberId?: string; includeInactive?: boolean } = {}) => {
      const p = new URLSearchParams();
      if (opts.memberId) p.set("memberId", opts.memberId);
      if (opts.includeInactive) p.set("includeInactive", "true");
      return jsonFetch<{ groups: GroupDTO[] }>(`/api/groups?${p.toString()}`);
    },
    get: (id: string) => jsonFetch<{ group: any }>(`/api/groups?id=${id}`),
    create: (data: any) =>
      jsonFetch<{ group: GroupDTO }>("/api/groups", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      jsonFetch<{ group: GroupDTO }>("/api/groups", { method: "PATCH", body: JSON.stringify({ id, ...data }) }),
    archive: (id: string) =>
      jsonFetch<{ ok: boolean }>(`/api/groups?id=${id}`, { method: "DELETE" }),
    join: (groupId: string, memberId: string) =>
      jsonFetch<{ ok: boolean }>(`/api/groups?sub=join`, { method: "PUT", body: JSON.stringify({ groupId, memberId }) }),
    leave: (groupId: string, memberId: string) =>
      jsonFetch<{ ok: boolean }>(`/api/groups?sub=leave`, { method: "PUT", body: JSON.stringify({ groupId, memberId }) }),
  },

  broadcasts: {
    list: (memberId?: string) =>
      jsonFetch<{ broadcasts: BroadcastDTO[] }>(`/api/broadcasts${memberId ? `?memberId=${memberId}` : ""}`),
    get: (id: string) => jsonFetch<{ broadcast: BroadcastDTO }>(`/api/broadcasts?id=${id}`),
    create: (data: any) =>
      jsonFetch<{ broadcast: BroadcastDTO; recipientCount: number }>("/api/broadcasts", { method: "POST", body: JSON.stringify(data) }),
    remove: (id: string) =>
      jsonFetch<{ ok: boolean }>(`/api/broadcasts?id=${id}`, { method: "DELETE" }),
  },

  sermonSeries: {
    list: () => jsonFetch<{ series: SermonSeriesDTO[] }>("/api/sermon-series"),
    listWithSermons: () => jsonFetch<{ series: SermonSeriesWithSermons[] }>("/api/sermon-series?include=sermons"),
    get: (id: string) => jsonFetch<{ series: SermonSeriesDTO }>(`/api/sermon-series?id=${id}`),
    getWithSermons: (id: string) => jsonFetch<{ series: SermonSeriesWithSermons }>(`/api/sermon-series?id=${id}&include=sermons`),
    create: (data: any) =>
      jsonFetch<{ series: SermonSeriesDTO }>("/api/sermon-series", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      jsonFetch<{ series: SermonSeriesDTO }>("/api/sermon-series", { method: "PATCH", body: JSON.stringify({ id, ...data }) }),
    remove: (id: string) => jsonFetch<{ ok: boolean }>(`/api/sermon-series?id=${id}`, { method: "DELETE" }),
  },

  sermons: {
    list: (seriesId?: string) => {
      const p = seriesId ? `?seriesId=${seriesId}` : "";
      return jsonFetch<{ sermons: SermonDTO[] }>(`/api/sermons${p}`);
    },
    get: (id: string) => jsonFetch<{ sermon: SermonDTO }>(`/api/sermons?id=${id}`),
    create: (data: any) =>
      jsonFetch<{ sermon: SermonDTO }>("/api/sermons", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      jsonFetch<{ sermon: SermonDTO }>("/api/sermons", { method: "PATCH", body: JSON.stringify({ id, ...data }) }),
    remove: (id: string) => jsonFetch<{ ok: boolean }>(`/api/sermons?id=${id}`, { method: "DELETE" }),
    reorder: (id: string, direction: "up" | "down") =>
      jsonFetch<{ ok: boolean }>("/api/sermons", { method: "PATCH", body: JSON.stringify({ id, reorder: direction }) }),
  },

  notifications: {
    list: (memberId?: string, unreadOnly?: boolean) => {
      const p = new URLSearchParams();
      if (memberId) p.set("memberId", memberId);
      if (unreadOnly) p.set("unreadOnly", "true");
      return jsonFetch<{ notifications: NotificationDTO[] }>(`/api/notifications?${p.toString()}`);
    },
    markRead: (id: string) =>
      jsonFetch<{ notification: NotificationDTO }>(`/api/notifications`, { method: "PATCH", body: JSON.stringify({ id, isRead: true }) }),
    markAllRead: (memberId: string) =>
      jsonFetch<{ ok: boolean }>(`/api/notifications`, { method: "PATCH", body: JSON.stringify({ allForMember: memberId, isRead: true }) }),
  },

  audit: {
    list: (memberId?: string, limit?: number) => {
      const p = new URLSearchParams();
      if (memberId) p.set("memberId", memberId);
      if (limit) p.set("limit", String(limit));
      return jsonFetch<{ logs: AuditLogDTO[] }>(`/api/audit?${p.toString()}`);
    },
  },

  settings: {
    get: () => jsonFetch<{ settings: AssemblySettingsDTO }>("/api/settings"),
    update: (data: any) =>
      jsonFetch<{ settings: AssemblySettingsDTO }>("/api/settings", { method: "PATCH", body: JSON.stringify(data) }),
  },

  forum: {
    list: () => jsonFetch<{ messages: ForumMessageDTO[] }>("/api/forum"),
    post: (content: string) =>
      jsonFetch<{ message: ForumMessageDTO }>("/api/forum", { method: "POST", body: JSON.stringify({ content }) }),
    remove: (id: string) => jsonFetch<{ ok: boolean }>(`/api/forum?id=${id}`, { method: "DELETE" }),
  },

  groupMessages: {
    list: (groupId: string) => jsonFetch<{ messages: GroupMessageDTO[] }>(`/api/group-messages?groupId=${groupId}`),
    post: (groupId: string, content: string) =>
      jsonFetch<{ message: GroupMessageDTO }>("/api/group-messages", { method: "POST", body: JSON.stringify({ groupId, content }) }),
    remove: (id: string) => jsonFetch<{ ok: boolean }>(`/api/group-messages?id=${id}`, { method: "DELETE" }),
  },

  accounts: {
    list: () => jsonFetch<{ accounts: any[] }>("/api/accounts"),
    provision: (data: { fullName: string; phone: string; role: string; linkedMemberId?: string; password?: string }) =>
      jsonFetch<{ user: any; defaultPassword: string }>(`/api/accounts`, { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      jsonFetch<{ account: any; resetTo?: string }>("/api/accounts", { method: "PATCH", body: JSON.stringify({ id, ...data }) }),
    suspend: (id: string) => jsonFetch<{ ok: boolean }>(`/api/accounts?id=${id}`, { method: "DELETE" }),
  },

  attendance: {
    list: (opts: { date?: string; serviceType?: ServiceType; memberId?: string } = {}) => {
      const p = new URLSearchParams();
      if (opts.date) p.set("date", opts.date);
      if (opts.serviceType) p.set("serviceType", opts.serviceType);
      if (opts.memberId) p.set("memberId", opts.memberId);
      return jsonFetch<{ attendance: AttendanceDTO[] }>(`/api/attendance?${p.toString()}`);
    },
    summary: (date: string, serviceType?: ServiceType) => {
      const p = new URLSearchParams({ date, summary: "true" });
      if (serviceType) p.set("serviceType", serviceType);
      return serviceType
        ? jsonFetch<{ summary: AttendanceSummaryDTO }>(`/api/attendance?${p.toString()}`)
        : jsonFetch<{ summaries: AttendanceSummaryDTO[] }>(`/api/attendance?${p.toString()}`);
    },
    record: (data: { memberId: string; serviceType: ServiceType; serviceDate: string; present: boolean; note?: string }) =>
      jsonFetch<{ attendance: AttendanceDTO }>("/api/attendance", { method: "POST", body: JSON.stringify(data) }),
    bulkRecord: (data: { serviceType: ServiceType; serviceDate: string; records: { memberId: string; present: boolean }[] }) =>
      jsonFetch<{ ok: boolean; count: number }>("/api/attendance", { method: "PUT", body: JSON.stringify(data) }),
  },
};
