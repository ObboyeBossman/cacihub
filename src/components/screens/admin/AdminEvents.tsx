"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarPlus, Calendar, MapPin, Clock, Trash2, Edit2, X, AlertCircle, ChevronLeft, ChevronRight, List, Grid,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { AssemblyEventDTO, EventCategory, RecurrenceType } from "@/lib/types";
import { EVENT_CATEGORY_LABELS, EVENT_CATEGORY_COLORS, RECURRENCE_LABELS } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  CACIButton, CACICard, CACIInput, CACITextarea, CACISelect, CACISkeleton, EmptyState, SectionHeading, MonthCalendar, type CalendarDayEvents,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORY_OPTIONS = Object.entries(EVENT_CATEGORY_LABELS) as [EventCategory, string][];

function toLocalInput(iso: string): string {
  // Convert ISO to datetime-local input value (YYYY-MM-DDTHH:MM)
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function AdminEvents() {
  const { back } = useApp();
  const [events, setEvents] = useState<AssemblyEventDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AssemblyEventDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssemblyEventDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Calendar state
  const nowDate = new Date();
  const [calYear, setCalYear] = useState(nowDate.getFullYear());
  const [calMonth, setCalMonth] = useState(nowDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.events.list({ limit: 100 });
      setEvents(res.events);
    } catch (e: any) {
      setError(e?.message || "Failed to load events.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Build calendar day-events from the events list
  const calendarEvents: CalendarDayEvents[] = (events || []).map((e) => {
    const d = new Date(e.startDate);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const colors = EVENT_CATEGORY_COLORS[e.category] || EVENT_CATEGORY_COLORS.other;
    return { date: dateStr, count: 1, dotColor: colors.dot };
  });
  const aggregated: CalendarDayEvents[] = [];
  const seen: Record<string, number> = {};
  for (const ce of calendarEvents) {
    if (seen[ce.date] !== undefined) {
      aggregated[seen[ce.date]].count += 1;
    } else {
      seen[ce.date] = aggregated.length;
      aggregated.push({ ...ce });
    }
  }

  const selectedDayEvents = (events || []).filter((e) => {
    if (!selectedDate) return false;
    const d = new Date(e.startDate);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return dateStr === selectedDate;
  });

  const handlePrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const handleEdit = (event: AssemblyEventDTO) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.events.remove(deleteTarget.id);
      toast.success("Event deleted");
      setEvents((prev) => (prev || []).filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete event.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <MobileHeader title="Events" onBack={back} />
      <DesktopTopBar
        title="Events"
        subtitle="Schedule and manage assembly events"
        onBack={back}
        action={
          <CACIButton
            size="sm"
            leftIcon={<CalendarPlus size={15} />}
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
          >
            New Event
          </CACIButton>
        }
      />
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-4xl space-y-4">
        {/* Mobile new event button */}
        <CACIButton
          className="w-full md:hidden"
          leftIcon={<CalendarPlus size={16} />}
          onClick={() => { setEditingEvent(null); setShowForm(true); }}
        >
          New Event
        </CACIButton>

        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <CACICard key={i} className="flex gap-3">
                <CACISkeleton className="h-16 w-14 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <CACISkeleton className="h-4 w-2/3" />
                  <CACISkeleton className="h-3 w-1/2" />
                  <CACISkeleton className="h-3 w-1/3" />
                </div>
              </CACICard>
            ))}
          </div>
        )}

        {!loading && error && (
          <EmptyState
            icon={<AlertCircle size={26} />}
            title="Couldn't load events"
            description={error}
            action={<CACIButton onClick={load}>Try again</CACIButton>}
          />
        )}

        {!loading && !error && events && events.length === 0 && (
          <EmptyState
            icon={<Calendar size={26} />}
            title="No events scheduled"
            description="Create your first event to keep the assembly informed about upcoming services and meetings."
            action={
              <CACIButton leftIcon={<CalendarPlus size={16} />} onClick={() => setShowForm(true)}>
                Create Event
              </CACIButton>
            }
          />
        )}

        {/* View toggle */}
        {!loading && !error && events && events.length > 0 && (
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-n50 border border-n100">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium transition-all",
                viewMode === "list" ? "bg-white text-caci-blue shadow-sm" : "text-n500 hover:text-n700",
              )}
            >
              <List size={15} /> List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium transition-all",
                viewMode === "calendar" ? "bg-white text-caci-blue shadow-sm" : "text-n500 hover:text-n700",
              )}
            >
              <Grid size={15} /> Calendar
            </button>
          </div>
        )}

        {/* Calendar view */}
        {!loading && !error && events && events.length > 0 && viewMode === "calendar" && (
          <CACICard>
            <MonthCalendar
              year={calYear}
              month={calMonth}
              events={aggregated}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
              onDayClick={(dateStr) => setSelectedDate(dateStr === selectedDate ? undefined : dateStr)}
              selectedDate={selectedDate}
            />
            {selectedDate && (
              <div className="mt-4 pt-4 border-t border-n100">
                <p className="text-[13px] font-semibold text-n700 mb-2">
                  {selectedDayEvents.length > 0
                    ? `${selectedDayEvents.length} event${selectedDayEvents.length !== 1 ? "s" : ""} on this day`
                    : "No events on this day"}
                </p>
                {selectedDayEvents.length > 0 && (
                  <div className="space-y-2">
                    {selectedDayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="w-full flex gap-3 p-2 rounded-md hover:bg-n50 transition-colors"
                      >
                        <span className={cn("size-2.5 rounded-full shrink-0 mt-1.5", (EVENT_CATEGORY_COLORS[event.category] || EVENT_CATEGORY_COLORS.other).dot)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-n900 truncate">{event.title}</p>
                          <p className="text-[12px] text-n400">
                            {event.isAllDay ? "All day" : new Date(event.startDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                            {event.location ? ` · ${event.location}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(event)}
                            className="size-7 flex items-center justify-center rounded-md text-n400 hover:text-caci-blue hover:bg-caci-blue-bg transition-colors"
                            aria-label="Edit event"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(event)}
                            className="size-7 flex items-center justify-center rounded-md text-n400 hover:text-caci-red hover:bg-caci-red-bg transition-colors"
                            aria-label="Delete event"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CACICard>
        )}

        {/* List view */}
        {!loading && !error && events && events.length > 0 && viewMode === "list" && (
          <div className="space-y-3">
            {events.map((event, idx) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => handleEdit(event)}
                onDelete={() => setDeleteTarget(event)}
                index={idx}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <EventForm
          event={editingEvent}
          onClose={() => { setShowForm(false); setEditingEvent(null); }}
          onSaved={() => {
            setShowForm(false);
            setEditingEvent(null);
            setLoading(true);
            load();
          }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `"${deleteTarget.title}" will be permanently removed.` : "This event will be permanently removed."}
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-caci-red text-white hover:bg-caci-red-light"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EventCard({
  event,
  onEdit,
  onDelete,
  index,
}: {
  event: AssemblyEventDTO;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}) {
  const colors = EVENT_CATEGORY_COLORS[event.category] || EVENT_CATEGORY_COLORS.other;
  const start = new Date(event.startDate);
  const day = start.getDate();
  const month = start.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
  const time = event.isAllDay
    ? "All day"
    : start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <CACICard
      padding="default"
      className="flex gap-3 animate-stagger"
      style={{ ["--stagger-i" as string]: Math.min(index, 8) }}
    >
      {/* Date badge */}
      <div className={cn("shrink-0 w-14 rounded-lg flex flex-col items-center justify-center py-2", colors.bg)}>
        <span className={cn("text-[18px] font-bold leading-none", colors.text)}>{day}</span>
        <span className={cn("text-[10px] font-semibold mt-0.5", colors.text)}>{month}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-n900 leading-snug">{event.title}</h3>
            <span className={cn("inline-flex items-center gap-1 mt-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded", colors.bg, colors.text)}>
              <span className={cn("size-1.5 rounded-full", colors.dot)} />
              {EVENT_CATEGORY_LABELS[event.category] || event.category}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="size-7 flex items-center justify-center rounded-md text-n400 hover:text-caci-blue hover:bg-caci-blue-bg transition-colors"
              aria-label="Edit event"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="size-7 flex items-center justify-center rounded-md text-n400 hover:text-caci-red hover:bg-caci-red-bg transition-colors"
              aria-label="Delete event"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 flex-wrap text-[12px] text-n400">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {time}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {event.location}
            </span>
          )}
          {event.endDate && (
            <span className="text-n300">
              until {formatDateTime(event.endDate)}
            </span>
          )}
        </div>

        {event.description && (
          <p className="text-[13px] text-n500 mt-2 line-clamp-2">{event.description}</p>
        )}
      </div>
    </CACICard>
  );
}

function EventForm({
  event,
  onClose,
  onSaved,
}: {
  event: AssemblyEventDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!event;
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [location, setLocation] = useState(event?.location || "");
  const [startDate, setStartDate] = useState(event ? toLocalInput(event.startDate) : "");
  const [endDate, setEndDate] = useState(event?.endDate ? toLocalInput(event.endDate) : "");
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false);
  const [category, setCategory] = useState<EventCategory>(event?.category || "service");
  const [recurrence, setRecurrence] = useState<RecurrenceType>(event?.recurrence || "none");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(
    event?.recurrenceEndDate ? event.recurrenceEndDate.split("T")[0] : "",
  );
  const [notifyMembers, setNotifyMembers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!startDate) {
      setError("Start date is required.");
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        isAllDay,
        category,
        recurrence,
        recurrenceEndDate: recurrence !== "none" && recurrenceEndDate
          ? new Date(recurrenceEndDate + "T23:59:59").toISOString()
          : undefined,
      };
      if (isEdit && event) {
        await api.events.update(event.id, data);
        toast.success("Event updated");
      } else {
        await api.events.create({ ...data, notifyMembers });
        toast.success(notifyMembers ? "Event created — members notified" : "Event created");
      }
      onSaved();
    } catch (e: any) {
      setError(e?.message || "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto scroll-caci shadow-xl animate-slide-up md:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-n100 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-[18px] font-bold text-n900">
            {isEdit ? "Edit Event" : "New Event"}
          </h2>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-md text-n400 hover:text-n700 hover:bg-n50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <CACIInput
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sunday Worship Service"
            error={error && !title.trim() ? error : null}
          />

          <CACISelect
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategory)}
          >
            {CATEGORY_OPTIONS.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </CACISelect>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CACIInput
              label="Starts"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <CACIInput
              label="Ends (optional)"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="size-4 rounded border-n200 accent-caci-blue"
            />
            <span className="text-[14px] text-n700">All-day event</span>
          </label>

          {/* Recurrence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CACISelect
              label="Repeat"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
            >
              {(Object.entries(RECURRENCE_LABELS) as [RecurrenceType, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </CACISelect>
            {recurrence !== "none" && (
              <CACIInput
                label="Stops repeating on (optional)"
                type="date"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
              />
            )}
          </div>

          <CACIInput
            label="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            leftIcon={<MapPin size={16} />}
            placeholder="e.g. Main Auditorium"
          />

          <CACITextarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about this event…"
            className="min-h-[80px]"
          />

          {/* Notify members toggle (create only) */}
          {!isEdit && (
            <label className="flex items-start gap-2.5 cursor-pointer select-none p-3 rounded-lg bg-caci-blue-bg/50 border border-caci-blue/10">
              <input
                type="checkbox"
                checked={notifyMembers}
                onChange={(e) => setNotifyMembers(e.target.checked)}
                className="size-4 rounded border-n200 accent-caci-blue mt-0.5"
              />
              <div>
                <span className="text-[14px] font-medium text-n700 block">Notify all members</span>
                <span className="text-[12px] text-n400">
                  Sends a notification to every active member about this new event.
                </span>
              </div>
            </label>
          )}

          {error && (
            <p className="text-[13px] text-caci-red flex items-center gap-1.5">
              <AlertCircle size={14} /> {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-n100 px-5 py-3 flex gap-3">
          <CACIButton variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </CACIButton>
          <CACIButton className="flex-1" onClick={handleSubmit} loading={saving}>
            {isEdit ? "Save Changes" : "Create Event"}
          </CACIButton>
        </div>
      </div>
    </div>
  );
}
