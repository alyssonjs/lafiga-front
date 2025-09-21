"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";

export default function BarbarianPanel({ nivel = 1 }) {
  // Rage uses per PHB progression: 1–2:2, 3–5:3, 6–11:4, 12–16:5, 17–20:6
  const rageUses = (() => {
    const n = Number(nivel) || 1;
    if (n >= 17) return 6;
    if (n >= 12) return 5;
    if (n >= 6) return 4;
    if (n >= 3) return 3;
    return 2;
  })();
  const extraAttackRank = (Number(nivel) || 1) >= 5 ? 1 : 0;
  const brutalCritDice = (() => {
    const n = Number(nivel) || 1;
    if (n >= 17) return 3;
    if (n >= 13) return 2;
    if (n >= 9) return 1;
    return 0;
  })();

  const oct = (val) => (
    <div className={styles.conjOctagon}>{val > 0 ? val : '—'}</div>
  );

  const Flag = ({ label, on }) => (
    <div className={styles.conjBox}>
      <div className={styles.conjLabel}>{label}</div>
      <div className={styles.conjPill} style={{ background: on ? 'var(--success)' : 'var(--muted)', color: '#fff' }}>{on ? 'Ativo' : '—'}</div>
    </div>
  );

  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardContent>
        <div className={styles.conjPanel}>
          <div className={styles.conjBoxRow}>
            <div className={styles.conjBox}>
              <div className={styles.conjLabel}>Fúria (usos)</div>
              {oct(rageUses)}
            </div>
            <div className={styles.conjBox}>
              <div className={styles.conjLabel}>Ataque Extra</div>
              {oct(extraAttackRank)}
            </div>
            <div className={styles.conjBox}>
              <div className={styles.conjLabel}>Crítico Brutal</div>
              {oct(brutalCritDice)}
            </div>
          </div>

          <div className={styles.conjBoxRow} style={{ marginTop: 8 }}>
            <Flag label="Instinto Feral (7º)" on={(Number(nivel)||1) >= 7} />
            <Flag label="Fúria Persistente (15º)" on={(Number(nivel)||1) >= 15} />
            <Flag label="Força Indomável (18º)" on={(Number(nivel)||1) >= 18} />
            <Flag label="Campeão Primitivo (20º)" on={(Number(nivel)||1) >= 20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

