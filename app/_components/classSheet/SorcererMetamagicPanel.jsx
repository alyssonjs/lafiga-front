"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";

function collectMetamagic(meta = {}) {
  const list = [];
  const top = meta?.class_choices?.metamagic || meta?.class_choices?.metamágica || [];
  (Array.isArray(top) ? top : []).forEach(x => list.push(x?.name || x));
  const per = meta?.class_choices?.per_level || {};
  Object.values(per).forEach((row) => {
    const arr = row?.metamagic || row?.metamágica;
    if (Array.isArray(arr)) arr.forEach(x => list.push(x?.name || x));
  });
  return Array.from(new Set(list.filter(Boolean)));
}

export default function SorcererMetamagicPanel({ meta = {} }) {
  const items = collectMetamagic(meta);
  const content = items.length ? items.join("\n") : '—';
  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardContent>
        <div className={styles.sectionCap}>OPÇÕES METAMÁGICAS</div>
        <div className={styles.bigBox} style={{ minHeight: 180, whiteSpace: 'pre-wrap' }}>
          {content}
        </div>
      </CardContent>
    </Card>
  );
}
