"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";

function sneakDice(level = 1) {
  const n = Number(level) || 1;
  const d = Math.ceil(n / 2);
  return `${d}d6`;
}

export default function SneakAttackPanel({ nivel = 1 }) {
  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardContent>
        <div className={styles.conjPanel}>
          <div className={styles.conjTop} style={{ alignItems: 'center' }}>
            <div className={styles.conjLabel}>DANO DE ATAQUE FURTIVO</div>
            <div className={styles.conjBox} style={{ minWidth: 160, justifyContent: 'center' }}>
              <div className={styles.conjSmall}>{sneakDice(nivel)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
