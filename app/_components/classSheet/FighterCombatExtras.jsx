"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";

function collectFighterExtras(meta = {}) {
  const out = [];
  // Estilo de Luta (salvo no summary e/ou escolhas)
  const fsSummary = meta?.class_summary?.fighting_style;
  const fsChoice = meta?.class_choices?.fighting_style;
  const fs = fsChoice || fsSummary;
  if (fs) out.push(`Estilo de Luta: ${fs.name || fs}`);

  // Percorre escolhas por nível e tenta capturar entradas relacionadas a combate
  const per = meta?.class_choices?.per_level || {};
  Object.values(per).forEach((row) => {
    if (!row) return;
    // suporte a textos livres ou arrays
    if (row.fighting_style) {
      const v = row.fighting_style;
      out.push(`Estilo de Luta: ${v.name || v}`);
    }
    // manobras (Mestre de Batalha) — aceitar tanto 'maneuvers' quanto 'manobras'
    const mans = row.maneuvers || row.manobras;
    if (Array.isArray(mans) && mans.length) {
      const list = mans.map(m => (m.name || m)).join(', ');
      out.push(`Manobras: ${list}`);
    }
  });

  return Array.from(new Set(out));
}

export default function FighterCombatExtras({ meta = {} }) {
  const lines = collectFighterExtras(meta);
  const content = lines.length ? lines.join("\n") : '—';
  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardContent>
        <div className={styles.sectionCap}>CARACTERÍSTICAS ADICIONAIS DE COMBATE</div>
        <div className={styles.bigBox} style={{ minHeight: 160, whiteSpace: 'pre-wrap' }}>
          {content}
        </div>
      </CardContent>
    </Card>
  );
}
