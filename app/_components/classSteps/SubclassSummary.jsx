"use client";

import styles from "../../_styles/character/CharacterForm.module.css";

export default function SubclassSummary({ subDb = null, subLevels = [], openInfo }) {
  if (!subDb && (!subLevels || !subLevels.length)) return null;
  return (
    <div className={styles.featureSection}>
      {!!subDb && (
        <>
          <div className={styles.featureHeader}>Subclasse</div>
          <div className={styles.featureCard}>
            <div className={styles.featureTitle}>{subDb.name}</div>
          </div>
          {subDb.description && (
            <div className={styles.featureCard}>
              <div className={styles.featureDesc}>{subDb.description}</div>
            </div>
          )}
        </>
      )}
      {!!(subLevels && subLevels.length) && (
        <>
          <div className={styles.featureHeader}>Subclasse por Nível</div>
          {subLevels.map((row, idx) => (
            <div key={`s-${idx}`} className={styles.featureCard}>
              <div className={styles.featureTitle}>
                {(row.features || []).map((e, i2) => (
                  <div key={i2} style={{ marginBottom: 4 }}>
                    <button type="button" className={styles.linkLike} onClick={() => openInfo?.(e.name, e.description)}>{e.name}</button>
                  </div>
                ))}
              </div>
              <div className={styles.levelBadge}>{row.level}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
