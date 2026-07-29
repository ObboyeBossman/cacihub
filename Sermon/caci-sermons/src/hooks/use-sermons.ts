"use client";

import { useState, useEffect, useCallback } from "react";
import type { SermonSeries, Ministry } from "@/lib/sermons";

interface SermonDetailResponse {
  sermon: import("@/lib/sermons").Sermon & {
    series: SermonSeries;
  };
  siblings: import("@/lib/sermons").SermonSummary[];
  prev: import("@/lib/sermons").SermonSummary | null;
  next: import("@/lib/sermons").SermonSummary | null;
}

export function useSeries() {
  const [series, setSeries] = useState<SermonSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/series");
        if (!res.ok) throw new Error("Failed to load series");
        const data = await res.json();
        if (active) {
          setSeries(data.series);
          setLoading(false);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Unknown error");
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { series, loading, error };
}

export function useMinistries() {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/ministries");
        if (!res.ok) throw new Error("Failed to load ministries");
        const data = await res.json();
        if (active) {
          setMinistries(data.ministries);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { ministries, loading };
}

export function useSermonDetail(sermonId: string | null) {
  const [data, setData] = useState<SermonDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSermon = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sermons/${id}`);
      if (!res.ok) throw new Error("Failed to load sermon");
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sermonId) {
      fetchSermon(sermonId);
    } else {
      setData(null);
    }
  }, [sermonId, fetchSermon]);

  return { data, loading };
}
