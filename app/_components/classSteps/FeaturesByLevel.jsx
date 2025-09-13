"use client";

import styles from "../../_styles/character/CharacterForm.module.css";

export default function FeaturesByLevel({ items = [], openInfo }) {
  if (!items || !items.length) return null;
  return (
    <div className={styles.featureSection}>
      <div className={styles.featureHeader}>Características por Nível</div>
      {items.map(({ level, entries }) => (
        <div key={level} className={styles.featureCard}>
          <div className={styles.featureTitle}>
            {entries.map((e, idx) => (
              <div key={idx} style={{ marginBottom: 4 }}>
                <button type="button" className={styles.linkLike} onClick={() => openInfo?.(e.name, e.desc)}>{e.name}</button>
              </div>
            ))}
          </div>
          <div className={styles.levelBadge}>{level}</div>
        </div>
      ))}
    </div>
  );
}
