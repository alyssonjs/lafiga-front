"use client";

import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";

export default function ProficiencySelect({ title, options = [], value = [], choose = 1, excludeIds = [], onChange }) {
  const normalized = (options || []).map((o) => (typeof o === 'string' ? { id: o, name: o } : o));
  const filtered = normalized.filter((o) => !excludeIds.includes(o.id));
  const valueObjs = (value || []).map((v) => {
    const id = (v && typeof v === 'object') ? (v.id ?? v.name ?? v) : v;
    return filtered.find((o) => String(o.id) === String(id)) || { id, name: String(id) };
  });
  const handle = (val) => {
    const ids = (val || []).map((x) => (x && typeof x === 'object') ? (x.id ?? x.name ?? x) : x);
    onChange && onChange(ids.slice(0, Number(choose) || 1));
  };
  return (
    <div>
      <label className={styles.label}>{title} (escolha {choose}):</label>
      <Select multiselect placeholder={`Escolha ${choose}`} options={filtered} value={valueObjs} onChange={handle} />
      <div className={styles.small}>{(value || []).length}/{choose}</div>
    </div>
  );
}
