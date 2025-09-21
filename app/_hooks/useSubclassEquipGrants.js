"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../_lib/api/client";

// Resolve subclass armor/weapon proficiency categories granted up to a given level
export default function useSubclassEquipGrants({ subclassId, klassId, level, subKlasses }) {
  const [armorCats, setArmorCats] = useState([]);
  const [weaponCats, setWeaponCats] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setArmorCats([]);
        setWeaponCats([]);
        if (!subclassId || !klassId) return;
        const hit = (subKlasses || []).find(
          (sk) => (String(sk.id) === String(subclassId) || String(sk.api_index) === String(subclassId)) && String(sk.klass_id) === String(klassId)
        );
        const subId = hit?.id;
        if (!subId) return;
        const { sub_klasses: single, sub_klass_levels = [] } = await apiClient.get(`/api/v1/public/sub_klasses/${subId}/levels`);
        const upto = Number(level || 1);
        const armorSet = new Set();
        const weaponSet = new Set();
        const norm = (s) => String(s || "").toLowerCase();
        (sub_klass_levels || [])
          .filter((r) => Number(r.level) > 0 && Number(r.level) <= upto)
          .forEach((row) => {
            const grants = row.grants || {};
            const prof = grants.proficiencies || {};
            const armor = Array.isArray(prof.armor) ? prof.armor : [];
            const weapons = Array.isArray(prof.weapons) ? prof.weapons : [];
            armor.forEach((a) => {
              const t = norm(a);
              if (t.includes("light") || t.includes("leve")) armorSet.add("light");
              if (t.includes("medium") || t.includes("média") || t.includes("media")) armorSet.add("medium");
              if (t.includes("heavy") || t.includes("pesad")) armorSet.add("heavy");
              if (t.includes("shield") || t.includes("escudo")) armorSet.add("shields");
            });
            weapons.forEach((w) => {
              const t = norm(w);
              if (t.includes("simple") || t.includes("simples")) weaponSet.add("simple");
              if (t.includes("martial") || t.includes("marcial")) weaponSet.add("martial");
            });
          });
        setArmorCats(Array.from(armorSet));
        setWeaponCats(Array.from(weaponSet));
      } catch (_) {
        setArmorCats([]);
        setWeaponCats([]);
      }
    })();
  }, [subclassId, klassId, level, subKlasses]);

  return { armorCats, weaponCats };
}

