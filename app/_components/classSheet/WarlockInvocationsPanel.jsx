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

export default function WarlockInvocationsPanel({ nivel = 1, meta = {} }) {
  const items = collectInvocations(meta);
  const content = items.length ? items.join("\n") : '—';
  const allowed = (() => {
    try {
      const lvl = Number(nivel) || 1;
      const map = { 2:2,3:2,4:2,5:3,6:3,7:4,8:4,9:5,10:5,11:5,12:6,13:6,14:7,15:7,16:8,17:8,18:8,19:9,20:9 };
      if (lvl < 2) return 0;
      return map[lvl] || 0;
    } catch(_) { return 0; }
  })();
  const over = items.length > allowed && allowed > 0;

  const pact = (() => {
    try {
      const top = meta?.class_choices?.pact_boon;
      let chosen = top;
      if (!chosen) {
        const per = meta?.class_choices?.per_level || {};
        for (const [_, row] of Object.entries(per)) {
          if (row?.pact_boon) { chosen = row.pact_boon; break; }
        }
      }
      const nm = (chosen && typeof chosen === 'object') ? (chosen.name || chosen.id || String(chosen)) : (chosen ? String(chosen) : '');
      return nm || '—';
    } catch(_) { return '—'; }
  })();
  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardContent>
        <div className={styles.sectionCap}>PACTO (BRUXO)</div>
        <div className={styles.bigBox} style={{ marginBottom: 12, minHeight: 40, display: 'flex', alignItems: 'center' }}>
          {pact}
        </div>

        <div className={styles.sectionCap}>
          INVOCACOES MÍSTICAS
          <span style={{ marginLeft: 8, fontSize: '0.9em', opacity: 0.9 }}>
            ({items.length}/{allowed || 0})
          </span>
        </div>
        <div className={styles.bigBox} style={{ minHeight: 180, whiteSpace: 'pre-wrap', borderColor: over ? 'var(--accent)' : undefined }}>
          {content}
        </div>
        {over && (
          <div className={styles.small} style={{ color: 'var(--accent)', marginTop: 6 }}>
            Você selecionou {items.length} invocações, mas o limite no nível atual é {allowed}.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
