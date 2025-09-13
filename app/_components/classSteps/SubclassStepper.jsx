"use client";

import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";

const SubclassStepper = ({
  rule,
  level,
  classSubclassId, setClassSubclassId,
}) => {
  if (!rule) return null;
  const chooseLevel = Number(rule?.subclass?.choose_level || 0);
  const canChoose = chooseLevel > 0 && Number(level) >= chooseLevel;
  const options = Object.values(rule?.subclass?.options || {}).map((o) => ({ id: o.id, name: o.name, grants: o.grants }));

  return (
    <div className={styles.stepContent}>
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Subclasse</div>
        {!canChoose && (
          <div className={styles.small}>Disponível a partir do nível {chooseLevel}.</div>
        )}
        <Select
          placeholder={canChoose ? "Selecione a subclasse" : `Disponível no nível ${chooseLevel}`}
          options={options}
          value={classSubclassId || null}
          onChange={(val) => setClassSubclassId(val)}
          disabled={!canChoose}
        />
        {canChoose && (
          <div className={styles.small} style={{ marginTop: 8 }}>
            Algumas subclasses podem conceder recursos adicionais (ex.: magias de lista expandida ou conjuração parcial).
          </div>
        )}
      </div>
    </div>
  );
};

export default SubclassStepper;
