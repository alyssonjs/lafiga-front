"use client";

import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";

const LANGUAGE_OPTIONS = ['Anão','Halfling','Dracônico','Gnômico','Orc','Infernal']
  .map(l => ({ id: l, name: l }));

const RaceElf = ({ subRuleId, picks, setPicks, wizardCantripOptions = [], cantripOptions = [] }) => {
  if (subRuleId !== 'high') return null;
  const rawList = wizardCantripOptions.length ? wizardCantripOptions : cantripOptions;
  const cantripList = (rawList || []).map((s) => ({ id: s.id, name: s.name }));
  const valueId = picks?.highElfCantrip && typeof picks.highElfCantrip === 'object'
    ? picks.highElfCantrip.id
    : picks?.highElfCantrip || null;
  return (
    <div>
      <label className={styles.label}>Truque de Mago (Alto Elfo):</label>
      <Select
        placeholder="Escolha 1 cantrip"
        options={cantripList}
        value={valueId}
        onChange={(valId) => setPicks({ ...(picks || {}), highElfCantrip: valId })}
      />
      <label className={styles.label}>Idioma extra (Alto Elfo):</label>
      <Select
        placeholder="Escolha 1 idioma"
        options={LANGUAGE_OPTIONS}
        value={picks?.highElfExtraLanguage || null}
        onChange={(val) => setPicks({ ...(picks || {}), highElfExtraLanguage: val })}
      />
    </div>
  );
};

export default RaceElf;
