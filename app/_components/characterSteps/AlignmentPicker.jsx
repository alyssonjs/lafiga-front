"use client";

import styles from "../../_styles/character/CharacterForm.module.css";

export default function AlignmentPicker({ alignmentMap = {}, alignments = [], activeKey, onSelect, details }) {
  const rows = [
    ['lawful-good','neutral-good','chaotic-good'],
    ['lawful-neutral','neutral','chaotic-neutral'],
    ['lawful-evil','neutral-evil','chaotic-evil'],
  ];

  const findAlignment = (idx) => alignmentMap[idx] || (alignments || []).find((x) => x.index === idx);

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>Selecione um alinhamento</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {rows.flat().map((idx) => {
          const a = findAlignment(idx);
          const active = (activeKey === idx);
          return (
            <button key={idx} type="button" onClick={() => onSelect(idx)} className={`${styles.stepTab} ${active ? styles.active : ''}`}>
              {a?.name || idx}
            </button>
          );
        })}
      </div>
      {!!details?.desc && (
        <div className={styles.small} style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{details.desc}</div>
      )}
    </div>
  );
}

