"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardHeader, CardTitle, CardContent } from "../UI/Card";

function extractArcanum(meta = {}) {
  const byGain = { 11: null, 13: null, 15: null, 17: null };
  const per = meta?.class_choices?.per_level || {};
  Object.entries(byGain).forEach(([lvl]) => {
    const row = per?.[String(lvl)] || {};
    const val = row?.mystic_arcanum || row?.arcanum || row?.arcana || row?.arcanum_spell;
    if (val) byGain[lvl] = (val.name || val);
  });
  return byGain;
}

export default function WarlockArcanumPanel({ nivel = 1, meta = {} }) {
  if ((Number(nivel)||1) < 11) return null;
  const byGain = extractArcanum(meta);
  const rows = [
    { gain: 11, level: 6 },
    { gain: 13, level: 7 },
    { gain: 15, level: 8 },
    { gain: 17, level: 9 },
  ].filter(r => (Number(nivel)||1) >= r.gain);

  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardHeader><CardTitle>ARCANA MÍSTICA</CardTitle></CardHeader>
      <CardContent>
        <table className={styles.table}>
          <thead>
            <tr><th>Ganho</th><th>Nível</th><th>Uso</th><th>Magia</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`a-${r.gain}`}>
                <td>{`${r.gain}º`}</td>
                <td>{`${r.level}º`}</td>
                <td>◯</td>
                <td>{byGain[r.gain] || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
