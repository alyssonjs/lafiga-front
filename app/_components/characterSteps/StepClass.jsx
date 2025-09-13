"use client";

import Select from "../UI/Select";
import Input from "../UI/Input";
import { DialogDescription } from "../Dialog";
import styles from "../../_styles/character/CharacterForm.module.css";

const StepClass = ({
  klasses, subKlasses,
  klassId, setKlassId,
  subKlassId, setSubKlassId,
  level, setLevel,
  clamp, profBonusFor,
}) => (
  <div className={styles.stepContent}>
    <DialogDescription>Escolha sua classe inicial</DialogDescription>
    <label className={styles.label}>Classe:</label>
    <Select placeholder="Selecione a classe" options={klasses} value={klassId} onChange={(val) => { setKlassId(val); setSubKlassId(""); }} />
    <label className={styles.label}>Subclasse (geralmente no nível 3):</label>
    <Select placeholder="Selecione a subclasse" options={subKlasses.filter(sk => !klassId || Number(sk.klass_id) === Number(klassId))} value={subKlassId} onChange={(val) => setSubKlassId(val)} disabled={!klassId} />

    <label className={styles.label}>Nível inicial:</label>
    <div style={{ display: "flex", alignItems: "center", gap: "0.75em" }}>
      <Input type="number" min={1} max={20} value={level} onChange={(e) => setLevel(clamp(e.target.value, 1, 20))} />
      <span className={styles.small}>Bônus de Proficiência: +{profBonusFor(level)}</span>
    </div>
  </div>
);

export default StepClass;
