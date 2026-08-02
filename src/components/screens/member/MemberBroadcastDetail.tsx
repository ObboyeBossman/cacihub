"use client";

import { useEffect, useState } from "react";
import { Radio, Paperclip, Users, AlertCircle } from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { BroadcastDTO } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import {
  CACICard, CACISkeleton, EmptyState, TargetingBadge, CACIButton, CaciAvatar,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";

/** Extract an uppercase file-type label from a URL (e.g. "PDF", "MP3"). */
function fileExtensionFromUrl(url: string): string | null {
  try {
    const path = url.split("?")[0].split("#")[0];
    const last = path.split("/").pop();
    if (!last || !last.includes(".")) return null;
    const ext = last.split(".").pop()!;
    if (ext.length < 2 || ext.length > 5) return null;
    return ext.toUpperCase();
  } catch {
    return null;
  }
}

export function MemberBroadcastDetail() {
  const { params, back } = useApp();
  const broadcastId = params.broadcastId;
  const [broadcast, setBroadcast] = useState<BroadcastDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!broadcastId) { back(); return; }
    let mounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await api.broadcasts.get(broadcastId);
        if (mounted) setBroadcast(res.broadcast);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "We couldn't load this broadcast.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [broadcastId, back]);

  if (loading) {
    return (
      <>
        <MobileHeader title="Broadcast" onBack={back} />
        <DesktopTopBar title="Broadcast" />
        <div className="px-4 py-4 max-w-md mx-auto md:max-w-3xl space-y-4">
          <CACISkeleton className="h-8 w-3/4" />
          <CACISkeleton className="h-4 w-1/3" />
          <CACISkeleton className="h-32 w-full" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <MobileHeader title="Broadcast" onBack={back} />
        <DesktopTopBar title="Broadcast" />
        <EmptyState
          icon={<AlertCircle size={26} />}
          title="Couldn't load broadcast"
          description={error}
          action={<CACIButton onClick={back}>Go back</CACIButton>}
        />
      </>
    );
  }

  if (!broadcast) {
    return (
      <>
        <MobileHeader title="Broadcast" onBack={back} />
        <DesktopTopBar title="Broadcast" />
        <EmptyState
          icon={<Radio size={26} />}
          title="Broadcast not found"
          description="This broadcast may have been deleted."
          action={<CACIButton onClick={back}>Go back</CACIButton>}
        />
      </>
    );
  }

  const attachmentExt = broadcast.attachmentUrl
    ? fileExtensionFromUrl(broadcast.attachmentUrl)
    : null;

  return (
    <>
      <MobileHeader title="Broadcast" onBack={back} />
      <DesktopTopBar title={broadcast.title} subtitle={`Sent ${formatDateTime(broadcast.sentAt)}`} />
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl">
        <CACICard padding="lg">
          <div className="flex items-center gap-2 mb-3">
            <TargetingBadge mode={broadcast.targetingMode} />
            {broadcast.targetGroupName && (
              <span className="text-[12px] text-n400">to {broadcast.targetGroupName}</span>
            )}
            {typeof broadcast.recipientCount === "number" && (
              <span className="ml-auto inline-flex items-center gap-1 text-[12px] text-n400">
                <Users size={13} />
                {broadcast.recipientCount} recipient{broadcast.recipientCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <h1 className="text-[22px] font-bold text-n900 leading-tight">{broadcast.title}</h1>
          <div className="flex items-center gap-3 mt-3">
            <CaciAvatar name={broadcast.sentByName || "Assembly"} size={40} />
            <div className="min-w-0">
              <p className="font-medium text-n700 truncate">{broadcast.sentByName || "Assembly"}</p>
              <p className="text-[12px] text-n400">{formatDateTime(broadcast.sentAt)}</p>
            </div>
          </div>
          <div className="mt-4 prose prose-sm max-w-none">
            <p className="text-[15px] text-n700 leading-relaxed whitespace-pre-wrap">{broadcast.body}</p>
          </div>
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
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-medium text-n900 truncate">View attachment</p>
                  {attachmentExt && (
                    <span className="shrink-0 rounded bg-n100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-n600 uppercase">
                      {attachmentExt}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-n400 truncate">{broadcast.attachmentUrl}</p>
              </div>
            </a>
          )}
        </CACICard>
      </div>
    </>
  );
}
