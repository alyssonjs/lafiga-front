"use client";

import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";

export default function SpellPicker({ title, options = [], value = [], max = 0, allowedLevel = 0, excludeIds = [], onChange }) {
  const filtered = (options || [])
    .filter((s) => (s.level || 0) <= (allowedLevel || 0) || (s.level || 0) === 0)
    .filter((s) => !excludeIds.includes(s.id))
    .map((s) => ({ id: s.id, name: `${s.name} (Nv ${s.level || 0})`, level: s.level || 0 }));
  const val = (value || []).map((s) => ({ id: s.id || s, name: s.name || String(s), level: s.level || 0 }));
  const handle = (list) => {
    const arr = (list || []).slice(0, max).map((s) => ({ id: s.id, name: s.name, level: s.level || 0 }));
    onChange && onChange(arr);
  };
  return (
    <div>
      <label className={styles.label}>{title}</label>
      <Select multiselect placeholder={`Selecione até ${max}`} options={filtered} value={val} onChange={handle} />
    </div>
  );
}
