"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";

export default function FighterPanel({ nivel = 1 }) {
  const actionSurgeTotal = nivel >= 17 ? 2 : (nivel >= 2 ? 1 : 0);
  const extraAttackRank = nivel >= 20 ? 3 : (nivel >= 11 ? 2 : (nivel >= 5 ? 1 : 0));
  const indomitableTotal = nivel >= 17 ? 3 : (nivel >= 13 ? 2 : (nivel >= 9 ? 1 : 0));

  const oct = (val) => (
    <div className={styles.conjOctagon}>{val > 0 ? val : '—'}</div>
  );

  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardContent>
        <div className={styles.conjPanel}>
          <div className={styles.conjBoxRow}>
            <div className={styles.conjBox}>
              <div className={styles.conjLabel}>Surto de Ação</div>
              {oct(actionSurgeTotal)}
            </div>
            <div className={styles.conjBox}>
              <div className={styles.conjLabel}>Ataque Extra</div>
              {oct(extraAttackRank)}
            </div>
            <div className={styles.conjBox}>
              <div className={styles.conjLabel}>Indomável</div>
              {oct(indomitableTotal)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
