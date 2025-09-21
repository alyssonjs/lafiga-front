"use client";

import { useEffect, useMemo, useState } from "react";
import { crudFor } from "../_services/railsApi";
import { apiClient } from "../_lib/api/client";

export default function useRaceCatalogs(enabled = true) {
  const [state, setState] = useState({
    races: [],
    subRaces: [],
    raceRules: {},
    raceTraitDefs: {},
    loading: false,
    error: null,
  });

  const publicRacesApi = useMemo(() => crudFor("races", "public"), []);
  const publicSubRacesApi = useMemo(() => crudFor("sub_races", "public"), []);

  useEffect(() => {
    let cancelled = false;
    if (!enabled) return () => { cancelled = true; };

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const [ { races }, { sub_races }, raceRulesPayload ] = await Promise.all([
          publicRacesApi.getAll(),
          publicSubRacesApi.getAll(),
          apiClient.get("/api/v1/public/race_rules").then((res) => res),
        ]);
        if (cancelled) return;
        const raceRulesBundle = raceRulesPayload || {};
        const raceRules = raceRulesBundle.race_rules || raceRulesBundle;
        const raceTraitDefs = raceRulesBundle.trait_definitions || {};
        setState({
          races: races || [],
          subRaces: sub_races || [],
          raceRules: raceRules || {},
          raceTraitDefs,
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
  }, [enabled, publicRacesApi, publicSubRacesApi]);

  return state;
}

