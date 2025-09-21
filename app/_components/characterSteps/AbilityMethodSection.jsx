"use client";

import Button from "../UI/Button";
import styles from "../../_styles/character/CharacterForm.module.css";

export default function AbilityMethodSection({
  abilityMethod,
  rolledScores = [],
  onPickPointBuy,
  onPickRoll4d6,
  onPickStandardArray,
  onRollSix,
}) {
  return (
    <div className={styles.panel} style={{ marginTop: 12 }}>
      <div className={styles.panelTitle}>Método de Atributos</div>
      <div className={styles.radioGroup}>
        <div className={styles.radioOption}>
          <input
            type="radio"
            name="attrMethod"
            className={styles.radioInput}
            checked={abilityMethod === 'point_buy'}
            onChange={onPickPointBuy}
          />
          <span className={styles.radioLabel}>Point Buy</span>
        </div>
        <div className={styles.radioOption}>
          <input
            type="radio"
            name="attrMethod"
            className={styles.radioInput}
            checked={(abilityMethod === 'roll_4d6') && (!Array.isArray(rolledScores) || rolledScores.length !== 6)}
            onChange={onPickRoll4d6}
          />
          <span className={styles.radioLabel}>Rolar 4d6 (descarta 1)</span>
        </div>
        <div className={styles.radioOption}>
          <input
            type="radio"
            name="attrMethod"
            className={styles.radioInput}
            checked={(abilityMethod === 'roll_4d6') && Array.isArray(rolledScores) && rolledScores.join(',') === '15,14,13,12,10,8'}
            onChange={onPickStandardArray}
          />
          <span className={styles.radioLabel}>Standard Array (15,14,13,12,10,8)</span>
        </div>
      </div>

      {abilityMethod === 'roll_4d6' && (
        <>
          <div className={styles.small}>
            Clique para gerar 6 valores. Você irá distribuí-los no próximo passo.
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <Button type="button" variant="secondary" onClick={onRollSix}>Rolar 6 valores</Button>
            {Array.isArray(rolledScores) && rolledScores.length === 6 && (
              <div className={styles.small}>Valores: {rolledScores.join(', ')}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

