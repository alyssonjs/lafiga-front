"use client";

import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";

const ABILITY_OPTIONS_NO_CHA = [
  { id:'STR', name:'FOR' },
  { id:'DEX', name:'DES' },
  { id:'CON', name:'CON' },
  { id:'INT', name:'INT' },
  { id:'WIS', name:'SAB' },
];

const RaceHalfElf = ({ picks, setPicks, skillOptions = [] }) => (
  <div>
    <label className={styles.label}>Meio‑Elfo: escolha 2 atributos (+1 cada)</label>
    <Select
      multiselect
      placeholder="Escolha 2 (exceto CAR)"
      options={ABILITY_OPTIONS_NO_CHA}
      value={picks?.halfElfAbilityPicks || []}
      onChange={(val)=>setPicks({ ...(picks||{}), halfElfAbilityPicks: (val||[]).slice(0,2) })}
    />
    <label className={styles.label}>Meio‑Elfo: 2 proficiências</label>
    <Select
      multiselect
      placeholder="Escolha 2"
      options={skillOptions}
      value={picks?.halfElfSkillPicks || []}
      onChange={(val)=>setPicks({ ...(picks||{}), halfElfSkillPicks: (val||[]).slice(0,2) })}
    />
  </div>
);

export default RaceHalfElf;
