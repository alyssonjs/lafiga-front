"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardHeader, CardTitle, CardContent } from "../UI/Card";

export default function FeaturesList({ features = [], cfApi = null, onError = (e)=>console.error(e), onToggled = null }) {
  const onToggle = async (f) => {
    const recId = f.pref_id;
    if (!cfApi || !recId) return;
    try {
      const updated = await cfApi.update(recId, { show: !(f.show === true) });
      const newShow = updated.characters_feature?.show ?? !(f.show === true);
      if (onToggled) onToggled(f.id, newShow);
    } catch (e) { onError(e); }
  };

  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardHeader>Características de Classe</CardHeader>
      <CardContent>
        <div className={styles.featureScroll}>
          <div className={styles.featureList}>
            {(features.length > 0 ? features : []).map((f, idx) => {
              const muted = f.show === false;
              return (
                <div key={`${f.id || f.lvl}-${idx}`} className={styles.featureCard} style={muted ? { opacity: 0.45 } : undefined}>
                <button type="button" style={{ marginBottom: 10 }} className={styles.linkLike} onClick={() => onToggle(f)}>{muted ? 'Mostrar' : 'Ocultar'}</button>
                  <div className={styles.featureTitleUpper} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{(f.name || '—').toUpperCase()}</span>
                  </div>
                  {!muted && <div className={styles.featureDesc}>{f.desc || '—'}</div>}
                  <div className={styles.levelBadgeLg}>
                    <div className={styles.badgeSmall}>NÍVEL</div>
                    <div className={styles.badgeNum}>{f.lvl}</div>
                  </div>
                </div>
              );
            })}
            {features.length === 0 && (
              <div className={styles.featureCard}><div className={styles.featureDesc}>—</div></div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
