"use client";

import Select from "../UI/Select";
import { DialogDescription } from "../Dialog";
import styles from "../../_styles/character/CharacterForm.module.css";

const StepRace = ({
  races, subRaces,
  raceId, setRaceId,
  subRaceId, setSubRaceId,
}) => (
  <div className={styles.stepContent}>
    <DialogDescription>Escolha sua raça e sub‑raça</DialogDescription>
    <label className={styles.label}>Raça:</label>
    <Select placeholder="Selecione a raça" options={races} value={raceId} onChange={(val) => { setRaceId(val); setSubRaceId(""); }} />
    <label className={styles.label}>Sub‑raça:</label>
    <Select placeholder="Selecione a sub‑raça" options={subRaces.filter(sr => !raceId || Number(sr.race_id) === Number(raceId))} value={subRaceId} onChange={(val) => setSubRaceId(val)} disabled={!raceId} />
  </div>
);

export default StepRace;
