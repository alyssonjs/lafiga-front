"use client";

import styles from "../../_styles/character/CharacterForm.module.css";

export default function ClassFinalSummary({
  raceLabel,
  classLabel,
  alignmentLabel,
  backgroundName,
  hp,
  attributesText,
  cantripNames = [],
  spellNames = [],
  featCantripsCount = 0,
  featSpellsCount = 0,
}) {
  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}><strong>Raça/Sub‑raça:</strong> {raceLabel}</div>
        <div className={styles.summaryItem}><strong>Classe/Subclasse:</strong> {classLabel}</div>
        <div className={styles.summaryItem}><strong>Alinhamento:</strong> {alignmentLabel}</div>
        <div className={styles.summaryItem}><strong>Background:</strong> {backgroundName}</div>
        <div className={styles.summaryItem}><strong>HP calculado (com escolhas):</strong> {hp ?? '—'}</div>
        <div className={styles.summaryItem}><strong>Atributos finais:</strong> {attributesText}</div>
        <div className={styles.summaryItem}>
          <strong>Cantrips:</strong> {cantripNames.join(', ') || 'Nenhum'}
          {featCantripsCount > 0 && (
            <span style={{ fontSize: '12px', color: '#666', marginLeft: 8 }}>
              (incluindo {featCantripsCount} de feats)
            </span>
          )}
        </div>
        <div className={styles.summaryItem}>
          <strong>Magias:</strong> {spellNames.join(', ') || 'Nenhuma'}
          {featSpellsCount > 0 && (
            <span style={{ fontSize: '12px', color: '#666', marginLeft: 8 }}>
              (incluindo {featSpellsCount} de feats)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

