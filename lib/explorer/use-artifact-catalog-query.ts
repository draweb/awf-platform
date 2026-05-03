"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArtifactListRow } from "@/components/explorer/file-tree";
import { buildArtifactListSearchParams } from "@/lib/explorer/build-artifact-list-url";

export type ArtifactCatalogFilters = {
  q: string;
  type: string;
  status: string;
  visibility: string;
};

type ListJson = { items?: ArtifactListRow[]; nextCursor?: string | null; error?: { message?: string } };

const DEFAULT_LIMIT = 100;

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function listUrl(params: URLSearchParams): string {
  return `/api/v1/artifacts?${params.toString()}`;
}

function stableFiltersKey(q: string, type: string, status: string, visibility: string): string {
  return JSON.stringify({
    q: q.trim(),
    type: type.trim(),
    status: status.trim(),
    visibility: visibility.trim(),
  });
}

export function useArtifactCatalogQuery(filters: ArtifactCatalogFilters) {
  const debouncedQ = useDebounced(filters.q, 220);
  const key = useMemo(
    () => stableFiltersKey(debouncedQ, filters.type, filters.status, filters.visibility),
    [debouncedQ, filters.type, filters.status, filters.visibility],
  );

  const [items, setItems] = useState<ArtifactListRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchFirstPage = useCallback(async (signal: AbortSignal) => {
    const params = buildArtifactListSearchParams({
      debouncedQ,
      type: filters.type,
      status: filters.status,
      visibility: filters.visibility,
      limit: DEFAULT_LIMIT,
    });
    const res = await fetch(listUrl(params), { credentials: "include", signal });
    const j = (await res.json()) as ListJson;
    if (!res.ok) {
      throw new Error(j.error?.message ?? "Error al cargar artefactos");
    }
    return { items: j.items ?? [], nextCursor: j.nextCursor ?? null };
  }, [debouncedQ, filters.type, filters.status, filters.visibility]);

  const fetchNextPageInternal = useCallback(
    async (cursor: string, signal: AbortSignal) => {
      const params = buildArtifactListSearchParams({
        debouncedQ,
        type: filters.type,
        status: filters.status,
        visibility: filters.visibility,
        limit: DEFAULT_LIMIT,
        cursor,
      });
      const res = await fetch(listUrl(params), { credentials: "include", signal });
      const j = (await res.json()) as ListJson;
      if (!res.ok) {
        throw new Error(j.error?.message ?? "Error al cargar más");
      }
      return { items: j.items ?? [], nextCursor: j.nextCursor ?? null };
    },
    [debouncedQ, filters.type, filters.status, filters.visibility],
  );

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const { items: first, nextCursor: nc } = await fetchFirstPage(ac.signal);
        if (keyRef.current !== key) return;
        setItems(first);
        setNextCursor(nc);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        if (keyRef.current !== key) return;
        setItems([]);
        setNextCursor(null);
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (keyRef.current === key) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [key, reloadNonce, fetchFirstPage]);

  const fetchMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    const ac = new AbortController();
    setLoadingMore(true);
    setError(null);
    try {
      const { items: more, nextCursor: nc } = await fetchNextPageInternal(nextCursor, ac.signal);
      if (keyRef.current !== key) return;
      setItems((prev) => {
        const seen = new Set(prev.map((a) => a.name));
        const merged = [...prev];
        for (const a of more) {
          if (!seen.has(a.name)) {
            seen.add(a.name);
            merged.push(a);
          }
        }
        return merged;
      });
      setNextCursor(nc);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, fetchNextPageInternal, key]);

  const mergeRowIfMissing = useCallback((row: ArtifactListRow) => {
    setItems((prev) => {
      if (prev.some((a) => a.name === row.name)) return prev;
      return [row, ...prev];
    });
  }, []);

  const refresh = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  return {
    items,
    nextCursor,
    loading,
    loadingMore,
    error,
    hasMore: Boolean(nextCursor),
    fetchMore,
    mergeRowIfMissing,
    refresh,
    debouncedQ,
  };
}
