"use client";

import styles from "../../_styles/character/CharacterForm.module.css";

export default function SpellsSummary({ allCan = [], knownByLevel = [], preparedByLevel = [], autoPrepared = [], spellDict = {}, openInfo }) {
  const parseLabels = (text) => {
    let nm = String(text || '');
    const labels = [];
    // Detect labels appended as suffixes
    if (/\(Talento\)\s*$/i.test(nm)) { labels.push('Talento'); nm = nm.replace(/\s*\(Talento\)\s*$/i, ''); }
    if (/\(Raça\)\s*$/i.test(nm)) { labels.push('Raça'); nm = nm.replace(/\s*\(Raça\)\s*$/i, ''); }
    // Remove any "(Nv X)" suffixes accidentally embedded in names
    nm = nm.replace(/\s*\(Nv\s*\d+\)\s*$/i, '');
    return { name: nm.trim(), labels };
  };
  const badge = (lbl) => (
    <span key={lbl} className={lbl === 'Talento' ? styles.talentTag : styles.raceTag}>{lbl}</span>
  );
  const renderPill = (nm, key) => {
    const { name, labels } = parseLabels(nm);
    const desc = (Object.values(spellDict || {}).find((s) => s?.name === name)?.desc) || '';
    return (
      <span key={key} className={styles.spellPill}>
        <button type="button" className={styles.linkLike} onClick={() => openInfo?.(name, desc)}>{name}</button>
        {labels.map(badge)}
      </span>
    );
  };

  return (
    <div className={styles.featureCard}>
      {!!(allCan && allCan.length) && (
        <div className={styles.previewTitle}>Cantrips:</div>
      )}
      {!!(allCan && allCan.length) && (
        <div className={styles.pillList}>
          {allCan.map((nm, i) => renderPill(nm, `can-${i}`))}
        </div>
      )}

      {(knownByLevel || []).map(({ level, list }) => (
        <div key={`kn-${level}`} className={styles.levelCard}>
          <div className={styles.levelTitle}>Nível {level}</div>
          <div className={styles.pillList}>
            {(list || []).map((nm, idx) => renderPill(nm, `kn-${level}-${idx}`))}
          </div>
        </div>
      ))}

      {!!(autoPrepared && autoPrepared.length) && (
        <>
          <div className={styles.previewTitle} style={{ marginTop: 16 }}>Sempre Preparadas (Subclasse)</div>
          <div className={styles.pillList}>
            {(autoPrepared || []).map((nm, idx) => renderPill(nm, `ap-${idx}`))}
          </div>
        </>
      )}

      {!!(preparedByLevel && preparedByLevel.length) && (
        <>
          <div className={styles.previewTitle} style={{ marginTop: 16 }}>Magias Preparadas</div>
          {(preparedByLevel || []).map(({ level, list }) => (
            <div key={`prep-${level}`} className={styles.levelCard}>
              <div className={styles.levelTitle}>Nível {level}</div>
              <div className={styles.pillList}>
                {(list || []).map((nm, idx) => renderPill(nm, `prep-${level}-${idx}`))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
