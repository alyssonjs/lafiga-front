"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../_lib/api/client";

export default function useAlignmentOptions(alignmentKey) {
  const [alignments, setAlignments] = useState([]);
  const [alignmentMap, setAlignmentMap] = useState({});
  const [alignmentDetails, setAlignmentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let list = [];
        try {
          const resp = await apiClient.get("/api/v1/public/alignments");
          const map = resp.alignments || {};
          list = Object.values(map).map((a) => ({
            index: a.index || a.id,
            name: a.name || a.title || a.id,
            desc: a.desc || a.description || "",
          }));
        } catch (_) {}
        if (!Array.isArray(list) || list.length === 0) {
          try {
            const res = await fetch("https://www.dnd5eapi.co/api/alignments");
            const data = await res.json();
            list = (data.results || []).map((a) => ({ index: a.index, name: a.name, url: a.url }));
          } catch (_) {}
        }
        if (cancelled) return;
        setAlignments(list);
        const mapBy = {};
        list.forEach((a) => {
          mapBy[a.index] = a;
        });
        setAlignmentMap(mapBy);
      } catch (e) {
        if (cancelled) return;
        setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!alignmentKey) {
        setAlignmentDetails(null);
        return;
      }
      const cached = alignmentMap[alignmentKey];
      if (cached?.desc) {
        setAlignmentDetails(cached);
        return;
      }
      try {
        try {
          const res = await apiClient.get(`/api/v1/public/alignments/${alignmentKey}`);
          const a = res.alignment || res;
          if (cancelled) return;
          if (a && (a.index || a.id)) {
            setAlignmentDetails({ index: a.index || a.id, name: a.name || a.title, desc: a.desc || a.description || "" });
            return;
          }
        } catch (_) {}
        const res = await fetch(`https://www.dnd5eapi.co/api/alignments/${alignmentKey}`);
        const data = await res.json();
        if (cancelled) return;
        setAlignmentDetails({ index: data.index, name: data.name, desc: data.desc });
      } catch (e) {
        if (cancelled) return;
        setAlignmentDetails({ index: alignmentKey, name: cached?.name || alignmentKey, desc: "" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [alignmentKey, alignmentMap]);

  return { alignments, alignmentMap, alignmentDetails, loading, error };
}

