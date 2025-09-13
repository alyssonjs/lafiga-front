"use client";

import { DialogDescription } from "../Dialog";
import styles from "../../_styles/character/CharacterForm.module.css";

const StepReview = ({
  name, users, userId, groups, groupId,
  races, raceId, subRaces, subRaceId,
  klasses, klassId, subKlasses, subKlassId,
  level, profBonusFor,
  str, dex, con, intA, wis, cha,
}) => (
  <div className={styles.stepContent}>
    <DialogDescription>Revise os dados antes de salvar</DialogDescription>
    <div className={styles.reviewGrid}>
      <div><strong>Nome:</strong> {name || "—"}</div>
      <div><strong>Usuário:</strong> {users.find(u => u.id === userId)?.name || "—"}</div>
      <div><strong>Grupo:</strong> {groups.find(g => g.id === groupId)?.name || "—"}</div>
      <div><strong>Raça/Sub‑raça:</strong> {races.find(r => r.id === raceId)?.name || "—"} {subRaceId ? ` / ${subRaces.find(sr => sr.id === subRaceId)?.name || ""}` : ""}</div>
      <div><strong>Classe/Subclasse:</strong> {klasses.find(k => k.id === klassId)?.name || "—"} {subKlassId ? ` / ${subKlasses.find(sk => sk.id === subKlassId)?.name || ""}` : ""}</div>
      <div><strong>Nível:</strong> {level} <span className={styles.small}>(Proficiência +{profBonusFor(level)})</span></div>
      <div><strong>FOR/DEX/CON/INT/WIS/CHA:</strong> {str}/{dex}/{con}/{intA}/{wis}/{cha}</div>
    </div>
  </div>
);

export default StepReview;
