"use client";

import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";

export default function LanguageSelect({ title = 'Idiomas', options = [], value = [], choose = 1, onChange }) {
  const normalized = (options || []).map((l) => (typeof l === 'string' ? { id: l, name: l } : l));
  const handle = (val) => {
    const ids = (val || []).map((x) => (x && typeof x === 'object') ? (x.id ?? x.name ?? x) : x);
    onChange && onChange(ids.slice(0, Number(choose) || 1));
  };

  const valueObjs = (value || []).map((id) => normalized.find((o) => String(o.id) === String(id)) || { id, name: String(id) });

  return (
    <div>
      <label className={styles.label}>{title} ({choose}):</label>
      <Select
        multiselect
        placeholder={`Escolha ${choose}`}
        options={normalized}
        value={valueObjs}
        onChange={handle}
      />
      <div className={styles.small}>{(value || []).length}/{choose}</div>
    </div>
  );
}
