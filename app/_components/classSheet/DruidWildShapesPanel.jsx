"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";

function collectWildShapes(meta = {}) {
  const list = [];
  // Accept multiple possible keys users might save
  const top = meta?.class_choices?.wild_shapes || meta?.class_choices?.formas || meta?.class_choices?.beasts || [];
  (Array.isArray(top) ? top : []).forEach(x => list.push(x?.name || x));
  const per = meta?.class_choices?.per_level || {};
  Object.values(per).forEach((row) => {
    const arr = row?.wild_shapes || row?.formas || row?.beasts;
    if (Array.isArray(arr)) arr.forEach(x => list.push(x?.name || x));
  });
  return Array.from(new Set(list.filter(Boolean)));
}

export default function DruidWildShapesPanel({ meta = {} }) {
  const items = collectWildShapes(meta);
  const [left, right] = (() => {
    const mid = Math.ceil(items.length / 2);
    return [items.slice(0, mid), items.slice(mid)];
  })();
  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardContent>
        <div className={styles.sectionCap}>FORMAS DE BESTAS CONHECIDAS</div>
        <div className={styles.bigBox} style={{ minHeight: 180 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{(left.length ? left.join("\n") : '—')}</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{(right.length ? right.join("\n") : '')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
