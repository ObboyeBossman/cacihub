"use client";

import { useEffect, useState } from "react";
import { Radio, Paperclip, Trash2, Users } from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { BroadcastDTO } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import {
  CACIButton, CACICard, CACISkeleton, EmptyState, TargetingBadge, CaciAvatar,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function AdminBroadcastDetail() {
  const { params, back } = useApp();
  const broadcastId = params.broadcastId;
  const [broadcast, setBroadcast] = useState<BroadcastDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!broadcastId) {
      back();
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const res = await api.broadcasts.get(broadcastId);
        if (mounted) setBroadcast(res.broadcast);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load broadcast");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [broadcastId, back]);

  const handleDelete = async () => {
    if (!broadcast) return;
    setDeleting(true);
    try {
      await api.broadcasts.remove(broadcast.id);
      toast.success("Broadcast deleted");
      back();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete broadcast");
    } finally {
      setDeleting(false);
    }
  };

  // Delete control — rendered in the desktop top bar action slot, and again
  // as a full-width button under the card on mobile (CSS-toggled by md:).
  const DeleteControl = () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <CACIButton variant="danger" size="sm" leftIcon={<Trash2 size={15} />} loading={deleting}>
          Delete
        </CACIButton>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this broadcast?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the broadcast and every notification tied to it for all recipients. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleDelete(); }}
            disabled={deleting}
            className="bg-caci-red text-white hover:bg-caci-red-light"
          >
            {deleting ? "Deleting…" : "Delete broadcast"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (loading) {
    return (
      <>
        <MobileHeader title="Broadcast" onBack={back} />
        <DesktopTopBar title="Broadcast" onBack={back} />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl space-y-4">
          <CACISkeleton className="h-6 w-1/3" />
          <CACISkeleton className="h-8 w-3/4" />
          <CACISkeleton className="h-4 w-1/2" />
          <CACISkeleton className="h-40 w-full" />
        </div>
      </>
    );
  }

  if (error || !broadcast) {
    return (
      <>
        <MobileHeader title="Broadcast" onBack={back} />
        <DesktopTopBar title="Broadcast" onBack={back} />
        <EmptyState
          icon={<Radio size={26} />}
          title="Broadcast not found"
          description={error || "This broadcast may have been deleted, or the link is invalid."}
          action={<CACIButton onClick={back}>Go back</CACIButton>}
        />
      </>
    );
  }

  const senderName = broadcast.sentByName || "Admin";

  return (
    <>
      <MobileHeader title="Broadcast" onBack={back} />
      <DesktopTopBar
        title={broadcast.title}
        subtitle={`Sent ${formatDateTime(broadcast.sentAt)}`}
        onBack={back}
        action={<DeleteControl />}
      />
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl">
        <CACICard padding="lg">
          {/* Targeting badge */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <TargetingBadge mode={broadcast.targetingMode} />
            {broadcast.targetGroupName && (
              <span className="text-[12px] text-n400">to {broadcast.targetGroupName}</span>
            )}
            <span className="ml-auto inline-flex items-center gap-1 text-[12px] text-n400">
              <Users size={12} />
              {broadcast.recipientCount ?? 0} {broadcast.recipientCount === 1 ? "recipient" : "recipients"}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-[22px] font-bold text-n900 leading-tight">{broadcast.title}</h1>

          {/* Sender row */}
          <div className="flex items-center gap-2.5 mt-3">
            <CaciAvatar name={senderName} size={36} />
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-n900 truncate">{senderName}</p>
              <p className="text-[12px] text-n400">{formatDateTime(broadcast.sentAt)}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-n100 my-4" />

          {/* Body */}
          <p className="text-[15px] text-n700 leading-relaxed whitespace-pre-wrap">{broadcast.body}</p>

          {/* Attachment */}
          {broadcast.attachmentUrl && (
            <a
              href={broadcast.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center gap-3 p-3 rounded-lg border border-n100 hover:border-caci-blue transition-colors"
            >
              <div className="size-10 rounded-lg bg-caci-blue-bg text-caci-blue flex items-center justify-center shrink-0">
                <Paperclip size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-n900 truncate">View attachment</p>
                <p className="text-[12px] text-n400 truncate">{broadcast.attachmentUrl}</p>
              </div>
            </a>
          )}
        </CACICard>

        {/* Full-width delete button on mobile only */}
        <div className="mt-4 md:hidden">
          <DeleteControl />
        </div>
      </div>
    </>
  );
}
