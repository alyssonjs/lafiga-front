"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";

function collectInvocations(meta = {}) {
  const list = [];
  const top = meta?.class_choices?.invocations || [];
  top.forEach((x)=> list.push(x?.name || x));
  const per = meta?.class_choices?.per_level || {};
  Object.values(per).forEach((row) => {
    const invs = row?.invocations || row?.invocacoes;
    if (Array.isArray(invs)) invs.forEach((x)=> list.push(x?.name || x));
  });
  return Array.from(new Set(list.filter(Boolean)));
}

export default function WarlockInvocationsPanel({ meta = {} }) {
  const items = collectInvocations(meta);
  const content = items.length ? items.join("\n") : '—';
  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardContent>
        <div className={styles.sectionCap}>INVOCACOES MÍSTICAS</div>
        <div className={styles.bigBox} style={{ minHeight: 180, whiteSpace: 'pre-wrap' }}>
          {content}
        </div>
      </CardContent>
    </Card>
  );
}
