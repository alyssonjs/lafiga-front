"use client";

import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";
import { useFeats } from "../../_hooks/useFeats";
import FeatChoices from "./FeatChoices";

export default function FeatPicker({ value = null, onChange, choices = {}, onChangeChoices, cantripOptions = [], spellOptions = [], klasses = [], dictionaries = {}, excludeIds = [], abilityScores = { str:10, dex:10, con:10, int:10, wis:10, cha:10 }, hasSpellcasting = false, armorCatsFromClass = [], weaponCatsFromClass = [] }) {
  const { feats, loading, error } = useFeats();
  const optionsAll = (feats || []).map((f) => ({ id: f.id, name: f.name, desc: f.description }));
  const options = optionsAll.filter(o => !(excludeIds || []).includes(o.id));
  const handle = (id) => { onChange && onChange(id); };
  const selectedFeat = (value && feats.length) ? feats.find((f) => f.id === value) : null;
  const prereqBadge = (() => {
    try {
      if (!selectedFeat) return null;
      const id = selectedFeat.id;
      const lower = (k) => Number(abilityScores[k] || 0);
      const hasArmor = (cat) => (armorCatsFromClass || []).includes(cat);
      // Map pré-requisitos
      if (['adepto_elemental','conjurador_de_batalha','sniper_magico','magico_iniciante'].includes(id)) {
        if (!hasSpellcasting) return 'Pré‑requisito não atendido: requer conjuração';
      }
      if (id === 'observador' && lower('wis') < 13) return 'Pré‑requisito: SAB 13';
      if (id === 'duelista_defensivo' && lower('dex') < 13) return 'Pré‑requisito: DES 13';
      if (id === 'sorrateiro' && lower('dex') < 13) return 'Pré‑requisito: DES 13';
      if (id === 'lider_inspirador' && lower('cha') < 13) return 'Pré‑requisito: CAR 13';
      if (id === 'imobilizador' && lower('str') < 13) return 'Pré‑requisito: FOR 13';
      if (id === 'conjurador_de_ritual' && (lower('int') < 13 && lower('wis') < 13)) return 'Pré‑requisito: INT 13 ou SAB 13';
      if (id === 'maestria_em_armadura_media' && !hasArmor('medium')) return 'Pré‑requisito: proficiência em armadura média';
      if (id === 'maestria_em_armadura_pesada' && !hasArmor('heavy')) return 'Pré‑requisito: proficiência em armadura pesada';
      if (id === 'protecao_moderada' && !hasArmor('light')) return 'Pré‑requisito: proficiência em armadura leve';
      if (id === 'protecao_pesada' && !hasArmor('medium')) return 'Pré‑requisito: proficiência em armadura média';
      return null;
    } catch (_) { return null; }
  })();
  return (
    <div>
      <label className={styles.label}>Talento (feat) disponível:</label>
      {error && (<div style={{ fontSize: '12px', color: '#dc3545', marginBottom: '8px' }}>⚠ Erro ao carregar feats: {error}</div>)}
      <Select placeholder={loading ? 'Carregando feats...' : `Selecione um talento (${options.length} disponíveis)`} options={options} value={value} disabled={loading} onChange={handle} />
      {prereqBadge && (
        <div className={styles.small} style={{ color: '#ffb34d', marginTop: 6 }}>⚠ {prereqBadge}</div>
      )}
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
            skillsAll={Array.isArray(dictionaries?.skills_all) ? dictionaries.skills_all : []}
            instruments={Array.isArray(dictionaries?.instruments) ? dictionaries.instruments : []}
          />
        </div>
      )}
    </div>
  );
}
