"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";

export default function TraitsProfsPanel({ tracosRaciais = [], meta = {} }) {
  const raceProfs = meta?.race_summary?.proficiencies || {};
  const classArmor = (meta?.class_summary?.armor_proficiencies || []).map(x=>String(x).toLowerCase());
  const classWeapons = (meta?.class_summary?.weapon_proficiencies || []).map(x=>String(x).toLowerCase());
  const raceArmor = (raceProfs?.armor || []).map(x=>String(x).toLowerCase());
  const raceWeapons = (raceProfs?.weapons || []).map(x=>String(x));
  const armor = [...classArmor, ...raceArmor];
  const weapons = [...classWeapons]; // UI toggles são por categoria; armas raciais específicas são listadas em "outras proficiências"
  const hasArmor = (key) => armor.some(a => a.includes(key));
  const hasWeapons = (key) => weapons.some(w => w.includes(key));
  const tools = (meta?.class_summary?.tools || []).map(t=>String(t));
  const instrumentsTop = (meta?.class_choices?.instruments || []).map(i => i.name || i.id);
  const instrumentsL1 = (meta?.class_choices?.per_level?.['1']?.instruments || []).map(i => i.name || i.id);
  const inst = instrumentsTop.length ? instrumentsTop : instrumentsL1;
  // Ferramentas da raça (ex.: anão: 1 escolha)
  const raceToolsFixed = Array.isArray(raceProfs?.tools?.fixed) ? raceProfs.tools.fixed.map(String) : [];
  const raceToolPick = meta?.race_choices?.dwarfTool ? [String(meta.race_choices.dwarfTool)] : [];
  const bgTools = Array.isArray(meta?.background_summary?.tools) ? meta.background_summary.tools.map(String) : [];
  // Build language list with source badges
  const langList = (() => {
    const out = [];
    const push = (name, src) => { if (!name) return; out.push({ name: String(name), src }); };
    (meta?.race_summary?.languages || []).forEach((l) => push(l, 'raça'));
    (meta?.background_summary?.languages || []).forEach((l) => push(l, 'background'));
    return out.filter((v, i, a) => a.findIndex(x => x.name === v.name) === i);
  })();

  // Tools and other profs with source badges
  const otherTools = (() => {
    const out = [];
    const push = (name, src) => { if (!name) return; out.push({ name: String(name), src }); };
    tools.forEach(t => push(t, 'classe'));
    inst.forEach(i => push(i, 'classe'));
    bgTools.forEach(t => push(t, 'background'));
    raceToolsFixed.forEach(t => push(t, 'raça'));
    raceToolPick.forEach(t => push(t, 'raça'));
    raceWeapons.forEach(t => push(t, 'raça'));
    // Feat proficiencies if present in metadata
    try {
      const feats = Array.isArray(meta?.feats) ? meta.feats : [];
      feats.forEach(f => {
        const pb = f?.proficiency_bonuses || {};
        (pb.skills || []).forEach(s => push(s, 'talento'));
        (pb.weapons || []).forEach(w => push(w, 'talento'));
        (pb.armor || []).forEach(a => push(a, 'talento'));
        (pb.tools || []).forEach(t => push(t, 'talento'));
      });
    } catch(_) {}
    // Dedup by name, preserve first source
    return out.filter((v, i, a) => a.findIndex(x => x.name === v.name) === i);
  })();

  const icon = (on, shape) => {
    const base = shape === 'square' ? styles.profIconSquare : (shape === 'star' ? styles.profIconStar : styles.profIconCircle);
    const cls = on ? `${styles.profIcon} ${base} ${styles.profOn}` : `${styles.profIcon} ${base}`;
    return <span className={cls} />;
  };

  const leftRows = [
    { label: 'ARMADURAS LEVES',   val: hasArmor('leve'),   shape: 'circle' },
    { label: 'ARMADURAS MÉDIAS',  val: hasArmor('méd') || hasArmor('med'), shape: 'square' },
    { label: 'ARMADURAS PESADAS', val: hasArmor('pesad'), shape: 'circle' },
  ];
  const rightRows = [
    { label: 'ARMAS SIMPLES',   val: hasWeapons('simples'),  shape: 'square' },
    { label: 'ARMAS MARCIAIS',  val: hasWeapons('marciais'), shape: 'star' },
    { label: 'ESCUDOS',         val: hasArmor('escudo') || hasWeapons('escudo'), shape: 'circle' },
  ];

  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardContent>
        <div className={styles.traitsProfGrid}>
          <div>
            <div className={styles.sectionCap}>TRAÇOS RACIAIS</div>
            <div className={styles.bigBox}>
              {(tracosRaciais.length > 0 ? tracosRaciais : ['—']).join(', ')}
            </div>
          </div>
          <div className={styles.twoColSplit}>
            <div className={styles.profsPanel}>
              <div className={styles.profsPanelHeader}>PROFICIÊNCIAS</div>
              <div className={styles.profRowGroup}>
                <div>
                  {leftRows.map((row, i)=> (
                    <div key={`pl-${i}`} className={styles.profRow}>
                      <span>{row.label}</span>
                      {icon(row.val, row.shape)}
                    </div>
                  ))}
                </div>
                <div>
                  {rightRows.map((row, i)=> (
                    <div key={`pr-${i}`} className={styles.profRow}>
                      <span>{row.label}</span>
                      {icon(row.val, row.shape)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className={styles.sectionCap}>IDIOMAS</div>
              <div className={styles.bigBox} style={{ minHeight: 80 }}>
                {langList.length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {langList.map((l) => (
                      <span key={l.name} style={{ background: 'var(--medium)', borderRadius: 4, padding: '2px 6px' }} title={`Fonte: ${l.src}`}>
                        {l.name}
                      </span>
                    ))}
                  </div>
                ) : '—'}
              </div>
              <div className={styles.sectionCap} style={{ marginTop: 8 }}>FERRAMENTAS & OUTRAS PROFICIÊNCIAS</div>
              <div className={styles.bigBox} style={{ minHeight: 80 }}>
                {otherTools.length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {otherTools.map((t) => (
                      <span key={t.name} style={{ background: 'var(--medium)', borderRadius: 4, padding: '2px 6px' }} title={`Fonte: ${t.src}`}>
                        {t.name}
                      </span>
                    ))}
                  </div>
                ) : '—'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
