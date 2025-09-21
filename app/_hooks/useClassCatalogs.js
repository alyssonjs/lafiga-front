"use client";

import { useEffect, useMemo, useState } from "react";
import { crudFor } from "../_services/railsApi";
import { apiClient } from "../_lib/api/client";

const defaultDicts = { instruments: [], fighting_styles: [], skills_all: [] };

export default function useClassCatalogs(enabled = true) {
  const [state, setState] = useState({
    klasses: [],
    subKlasses: [],
    classRules: {},
    classDicts: defaultDicts,
    loading: false,
    error: null,
  });

  const publicKlassesApi = useMemo(() => crudFor("klasses", "public"), []);
  const publicSubKlassesApi = useMemo(() => crudFor("sub_klasses", "public"), []);

  useEffect(() => {
    let cancelled = false;
    if (!enabled) return () => { cancelled = true; };

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const [ { klasses }, { sub_klasses }, classRulesIndex ] = await Promise.all([
          publicKlassesApi.getAll(),
          publicSubKlassesApi.getAll(),
          apiClient.get("/api/v1/public/class_rules").then((res) => res),
        ]);
        if (cancelled) return;
        const classRules = classRulesIndex.class_rules || {};
        const classDicts = classRulesIndex.dictionaries || defaultDicts;
        setState({
          klasses: klasses || [],
          subKlasses: sub_klasses || [],
          classRules,
          classDicts,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false, error }));
      }
    };
    load();
    return () => { cancelled = true; };
  }, [enabled, publicKlassesApi, publicSubKlassesApi]);

  return state;
}

