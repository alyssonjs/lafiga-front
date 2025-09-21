"use client";

import { useEffect, useMemo, useState } from "react";
import { crudFor } from "../_services/railsApi";
import { apiClient } from "../_lib/api/client";

const defaultDicts = { instruments: [], fighting_styles: [], skills_all: [] };

export function useCharacterCatalogs() {
  const [catalogs, setCatalogs] = useState({
    races: [],
    subRaces: [],
    klasses: [],
    subKlasses: [],
    raceRules: {},
    raceTraitDefs: {},
    classRules: {},
    classDicts: defaultDicts,
    backgroundOptions: [],
    backgroundIndexMap: {},
    loading: false,
    error: null,
  });

  const publicRacesApi = useMemo(() => crudFor("races", "public"), []);
  const publicSubRacesApi = useMemo(() => crudFor("sub_races", "public"), []);
  const publicKlassesApi = useMemo(() => crudFor("klasses", "public"), []);
  const publicSubKlassesApi = useMemo(() => crudFor("sub_klasses", "public"), []);

  useEffect(() => {
    let cancelled = false;

    const loadCatalogs = async () => {
      setCatalogs((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const [
          { races },
          { sub_races },
          { klasses },
          { sub_klasses },
          raceRulesPayload,
          classRulesIndex,
          backgroundsIndex,
        ] = await Promise.all([
          publicRacesApi.getAll(),
          publicSubRacesApi.getAll(),
          publicKlassesApi.getAll(),
          publicSubKlassesApi.getAll(),
          apiClient.get("/api/v1/public/race_rules").then((res) => res),
          apiClient.get("/api/v1/public/class_rules").then((res) => res),
          apiClient
            .get("/api/v1/public/backgrounds")
            .then((res) => res)
            .catch(() => ({ backgrounds: {} })),
        ]);

        if (cancelled) return;

        const raceRulesBundle = raceRulesPayload || {};
        const raceRules = raceRulesBundle.race_rules || raceRulesBundle;
        const raceTraitDefs = raceRulesBundle.trait_definitions || {};
        const classRules = classRulesIndex.class_rules || {};
        const classDicts = classRulesIndex.dictionaries || defaultDicts;

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

        setCatalogs({
          races: races || [],
          subRaces: sub_races || [],
          klasses: klasses || [],
          subKlasses: sub_klasses || [],
          raceRules: raceRules || {},
          raceTraitDefs,
          classRules,
          classDicts,
          backgroundOptions,
          backgroundIndexMap,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) return;
        setCatalogs((prev) => ({ ...prev, loading: false, error }));
      }
    };

    loadCatalogs();

    return () => {
      cancelled = true;
    };
  }, [publicRacesApi, publicSubRacesApi, publicKlassesApi, publicSubKlassesApi]);

  return catalogs;
}

export default useCharacterCatalogs;
