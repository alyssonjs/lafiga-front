"use client";

import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";

const ABILITY_OPTIONS = [
  { id: 'STR', name: 'FOR' },
  { id: 'DEX', name: 'DES' },
  { id: 'CON', name: 'CON' },
  { id: 'INT', name: 'INT' },
  { id: 'WIS', name: 'SAB' },
  { id: 'CHA', name: 'CAR' },
];

export default function AbilityIncreaseSelector({ value = [], onChange }) {
  const valueObjs = (value || []).map((id) => ABILITY_OPTIONS.find((o) => o.id === id) || { id, name: String(id) });
  const handle = (val) => {
    console.log(val, value)
    const ids = (val || []).map((x) => (x && typeof x === 'object') ? (x.id ?? x.name ?? x) : x);
    onChange && onChange(ids.slice(0, 2));
  };
  return (
    <div>
      <label className={styles.label}>Selecione até 2 atributos (duplique para +2 no mesmo):</label>
      <Select multiselect placeholder="Até 2 atributos" options={ABILITY_OPTIONS} value={valueObjs} onChange={handle} />
    </div>
  );
}
