"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../_lib/api/client";

export default function useSpellCatalog(klassId, subclassId, level) {
  const [spellCatalog, setSpellCatalog] = useState([]);
  const [cantripOptions, setCantripOptions] = useState([]);
  const [spellOptions, setSpellOptions] = useState([]);
  const [klassLevels, setKlassLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!klassId) return;
        setLoading(true);
        setError(null);
        const subclassParam = subclassId ? `&subclass_id=${encodeURIComponent(subclassId)}` : "";
        const levelParam = Number(level) ? `&level=${Number(level)}` : "";
        const [{ spells = [] }, { class_levels = [] }] = await Promise.all([
          apiClient.get(`/api/v1/public/spells?klass_id=${klassId}${subclassParam}${levelParam}`),
          apiClient.get(`/api/v1/public/klasses/${klassId}/levels${subclassParam ? `?subclass_id=${encodeURIComponent(subclassId)}` : ""}`),
        ]);
        if (cancelled) return;
        setKlassLevels(class_levels || []);
        setSpellCatalog(spells || []);
        const cantrips = (spells || [])
          .filter((s) => (s.level || 0) === 0)
          .map((s) => ({ id: s.id, name: s.name, level: s.level || 0, min_class_level: s.min_class_level }));
        const leveled = (spells || [])
          .filter((s) => (s.level || 0) > 0)
          .map((s) => ({ id: s.id, name: s.name, level: s.level || 0, min_class_level: s.min_class_level }));
        setCantripOptions(cantrips);
        setSpellOptions(leveled);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [klassId, subclassId, level]);

  return { spellCatalog, cantripOptions, spellOptions, klassLevels, loading, error };
}

