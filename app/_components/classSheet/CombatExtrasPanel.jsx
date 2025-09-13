"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";

function collectExtras(meta = {}) {
  const out = [];
  const per = meta?.class_choices?.per_level || {};
  Object.entries(per).forEach(([lvl, row]) => {
    if (!row) return;
    // Try generic keys that might exist in metadata for classes
    if (row.expertise_skills || row.expertise) {
      const arr = row.expertise_skills || row.expertise;
      const list = (Array.isArray(arr) ? arr : [arr]).map(x => x?.name || x).join(', ');
      out.push(`Perícia Aprimorada (${lvl}): ${list}`);
    }
    if (row.fighting_style) {
      const v = row.fighting_style;
      out.push(`Estilo de Luta (${lvl}): ${v.name || v}`);
    }
    if (row.maneuvers || row.manobras) {
      const mans = row.maneuvers || row.manobras;
      const list = (Array.isArray(mans) ? mans : [mans]).map(x => x?.name || x).join(', ');
      out.push(`Manobras (${lvl}): ${list}`);
    }
  });

  // Fighting Style bonuses ativos (do backend equipment.mods)
  try {
    const mods = meta?.equipment?.mods || {};
    const styles = mods.active_styles || [];
    if (styles.length) {
      out.push(`Estilo ativo: ${styles.join(', ')}`);
    }
    const wm = mods.weapon_mods || {};
    const fmt = (side, m) => {
      const parts = [];
      if ((m?.attack || 0) > 0) parts.push(`+${m.attack} Ataque`);
      if ((m?.damage || 0) > 0) parts.push(`+${m.damage} Dano`);
      if (m?.offhand_add_ability) parts.push('Off‑hand soma modificador');
      if (parts.length) out.push(`${side}: ${parts.join(', ')}`);
    };
    if (wm.main_hand) fmt('Mão principal', wm.main_hand);
    if (wm.off_hand) fmt('Mão secundária', wm.off_hand);
  } catch (_) {}

  // Ranger: exibir Inimigo/Terreno Favoritos agregados
  try {
    const enemies = [];
    const terrains = [];
    Object.values(per).forEach((row) => {
      const fav = row?.favored_enemy;
      if (fav) {
        const name = fav?.name || fav;
        let extra = '';
        if (String(name).toLowerCase().includes('humanoide') && Array.isArray(row?.favored_enemy_details) && row.favored_enemy_details.length) {
          const det = row.favored_enemy_details.map((x) => (x?.name || x)).join(', ');
          extra = ` (${det})`;
        }
        enemies.push(`${name}${extra}`);
      }
      const t = row?.favored_terrain;
      if (t) terrains.push(t?.name || t);
    });
    if (enemies.length) out.push(`Inimigos Favoritos: ${Array.from(new Set(enemies)).join(', ')}`);
    if (terrains.length) out.push(`Terrenos Favoritos: ${Array.from(new Set(terrains)).join(', ')}`);
  } catch (_) {}
  return Array.from(new Set(out));
}

export default function CombatExtrasPanel({ meta = {} }) {
  const lines = collectExtras(meta);
  const content = lines.length ? lines.join("\n") : '—';
  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardContent>
        <div className={styles.sectionCap}>CARACTERÍSTICAS ADICIONAIS DE COMBATE</div>
        <div className={styles.bigBox} style={{ minHeight: 220, whiteSpace: 'pre-wrap' }}>
          {content}
        </div>
      </CardContent>
    </Card>
  );
}
