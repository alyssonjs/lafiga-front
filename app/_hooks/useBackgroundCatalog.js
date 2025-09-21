"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../_lib/api/client";

export default function useBackgroundCatalog(enabled = true) {
  const [state, setState] = useState({
    backgroundOptions: [],
    backgroundIndexMap: {},
    loading: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!enabled) return () => { cancelled = true; };

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const backgroundsIndex = await apiClient.get("/api/v1/public/backgrounds").then((res) => res).catch(() => ({ backgrounds: {} }));
        if (cancelled) return;
        let backgroundOptions = [];
        let backgroundIndexMap = {};
        try {
          const bgs = backgroundsIndex.backgrounds || {};
          backgroundIndexMap = bgs;
          backgroundOptions = Object.values(bgs).map((value) => ({
            id: value.id,
            name: value.name,
            index: value.api_index || value.index || value.id,
            skills: value.skills || [],
            tools: value.tools || [],
            desc: value.desc || value.description || "",
            languages: value.languages || null,
            equipment: value.equipment || [],
            feature: value.feature || null,
          }));
        } catch (_) {
          backgroundOptions = [];
          backgroundIndexMap = {};
        }
        setState({ backgroundOptions, backgroundIndexMap, loading: false, error: null });
      } catch (error) {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false, error }));
      }
    };
    load();
    return () => { cancelled = true; };
  }, [enabled]);

  return state;
}

