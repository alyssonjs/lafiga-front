"use client";

import { useMemo } from "react";

export default function useRaceSpellExtras({ rule, subRuleId, level, spellByName, picks, wizardCantripOptions, cantripOptions, spellCatalog }) {
  const raceInnateByLevel = useMemo(() => {
    const list = [];
    if (rule) {
      const sub = subRuleId ? (rule.subraces || {})[subRuleId] : null;
      const merged = [ ...(rule.innateSpells || []), ...((sub && sub.innateSpells) || []) ];
      merged.forEach((entry) => {
        if (!entry) return;
        const reqLvl = Number(entry.level || 1);
        if (Number(level || 1) < reqLvl) return;
        (entry.spells || []).forEach((nm) => {
          const found = spellByName.get(String(nm).toLowerCase());
          if (found) list.push({ id: found.id, name: `${found.name} (Raça)`, level: found.level || 0 });
          else list.push({ id: `race:${String(nm).toLowerCase()}`, name: `${nm} (Raça)`, level: 0 });
        });
      });
    }
    const seen = new Set();
    return list.filter((s) => { const id = s.id || s.name; if (seen.has(id)) return false; seen.add(id); return true; });
  }, [rule, subRuleId, level, spellByName]);

  const raceCantripsExtraList = useMemo(() => {
    const extra = [];
    const cid = picks?.highElfCantrip || null;
    if (cid) {
      const pools = [ wizardCantripOptions || [], cantripOptions || [], spellCatalog || [] ];
      for (const list of pools) {
        const found = (list || []).find(s => String(s.id) === String(cid));
        if (found) { extra.push({ id: found.id, name: `${found.name} (Raça)`, level: found.level || 0 }); break; }
      }
    }
    raceInnateByLevel.filter(s => (s.level || 0) === 0).forEach(s => extra.push(s));
    const seen = new Set();
    return extra.filter(s => { const id = s.id || s.name; if (seen.has(id)) return false; seen.add(id); return true; });
  }, [picks, wizardCantripOptions, cantripOptions, spellCatalog, raceInnateByLevel]);

  const raceSpellsExtraList = useMemo(() => (
    raceInnateByLevel.filter(s => (s.level || 0) > 0)
  ), [raceInnateByLevel]);

  return { raceInnateByLevel, raceCantripsExtraList, raceSpellsExtraList };
}

