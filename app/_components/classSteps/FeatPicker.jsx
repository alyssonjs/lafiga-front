"use client";

import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";
import { useFeats } from "../../_hooks/useFeats";
import FeatChoices from "./FeatChoices";

export default function FeatPicker({ value = null, onChange, choices = {}, onChangeChoices, cantripOptions = [], spellOptions = [], klasses = [], excludeIds = [] }) {
  const { feats, loading, error } = useFeats();
  const optionsAll = (feats || []).map((f) => ({ id: f.id, name: f.name, desc: f.description }));
  const options = optionsAll.filter(o => !(excludeIds || []).includes(o.id));
  const handle = (id) => { onChange && onChange(id); };
  const selectedFeat = (value && feats.length) ? feats.find((f) => f.id === value) : null;
  return (
    <div>
      <label className={styles.label}>Talento (feat) disponível:</label>
      {error && (<div style={{ fontSize: '12px', color: '#dc3545', marginBottom: '8px' }}>⚠ Erro ao carregar feats: {error}</div>)}
      <Select placeholder={loading ? 'Carregando feats...' : `Selecione um talento (${options.length} disponíveis)`} options={options} value={value} disabled={loading} onChange={handle} />
      {selectedFeat && (
        <div className={styles.featChoicesContainer}>
          <FeatChoices
            featId={value}
            featName={selectedFeat?.name || value}
            featData={selectedFeat}
            choices={choices || {}}
            onChoicesChange={onChangeChoices}
            cantripOptions={cantripOptions}
            spellOptions={spellOptions}
            klasses={klasses}
          />
        </div>
      )}
    </div>
  );
}
