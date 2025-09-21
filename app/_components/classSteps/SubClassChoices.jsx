"use client";

import { useEffect, useMemo, useState } from "react";
import Select from "../UI/Select";
import Input from "../UI/Input";
import ProficiencySelect from "../common/ProficiencySelect";
import SpellPicker from "./SpellPicker";
import { apiClient } from "../../_lib/api/client";
import styles from "../../_styles/character/CharacterForm.module.css";

const SubClassChoices = ({
  addChoices = {},
  level,
  picksByLevel = {},
  applyLevelPatch = null,
  proficientSkills = [],
  spellOptions = [],
  cantripOptions = [],
}) => {
  // Nothing to render if no choices
  console.log('addChoices', addChoices);
  console.log('level', level);
  console.log('picksByLevel', picksByLevel);
  console.log('applyLevelPatch', applyLevelPatch);
  console.log('proficientSkills', proficientSkills);
  const hasAny = (() => {
    if (!addChoices || typeof addChoices !== 'object') return false;
    // known keys
    const keys = ['languages','skills','tools','instruments','fighting_style','cantrips','spells'];
    for (const k of keys) {
      const c = addChoices[k];
      if (c && Number(c.choose) > 0) {
        // For cantrips/spells, check if we have options available
        if (k === 'cantrips' && cantripOptions.length > 0) return true;
        if (k === 'spells' && spellOptions.length > 0) return true;
        // For other keys, check options array
        if (Array.isArray(c.options) && c.options.length) return true;
      }
    }
    // generic keys
    return Object.entries(addChoices).some(([key, conf]) => {
      if (keys.includes(key)) return false;
      if (!conf || Number(conf.choose) <= 0) return false;
      // Special case: expertise_skills may not provide options in YAML; use proficient skills
      if (key === 'expertise_skills') {
        return (Array.isArray(proficientSkills) && proficientSkills.length > 0) || (Array.isArray(conf.options) && conf.options.length > 0);
      }
      return Array.isArray(conf.options) && conf.options.length > 0;
    });
  })();
  console.log('addChoices', addChoices);

  // When cantrips come from another class (e.g., Nature Domain -> Druid), fetch that class' cantrips
  const [externalCantrips, setExternalCantrips] = useState([]);
  const fromClass = addChoices?.cantrips?.from_class || addChoices?.cantrips?.fromClass || null;

  useEffect(() => {
    (async () => {
      try {
        if (!fromClass) { setExternalCantrips([]); return; }
        // Load classes to map API index to id
        const { klasses = [] } = await apiClient.get('/api/v1/public/klasses').catch(() => ({ klasses: [] }));
        const fc = String(fromClass).toLowerCase();
        const hit = (klasses || []).find(k => String(k.api_index || '').toLowerCase() === fc) ||
                    (klasses || []).find(k => String(k.name || '').toLowerCase().includes(fc));
        if (!hit || !hit.id) { setExternalCantrips([]); return; }
        const { spells = [] } = await apiClient.get(`/api/v1/public/spells?klass_id=${hit.id}`);
        const cantrips = (spells || [])
          .filter(s => (s.level || 0) === 0)
          .map(s => ({ id: s.id, name: `${s.name} (Nv ${s.level || 0})`, level: s.level || 0 }));
        setExternalCantrips(cantrips);
      } catch (_) {
        setExternalCantrips([]);
      }
    })();
  }, [fromClass]);

  if (!hasAny) return null;
  console.log('addChoices', addChoices);

  const toOptions = (arr = []) => (arr || []).map((v) =>
    (typeof v === 'object' ? ({ id: v.id || v.name || String(v), name: v.name || v.id || String(v) }) : ({ id: v, name: v }))
  );
  console.log('addChoices', addChoices);

  const proficientSkillOptions = toOptions(proficientSkills || []);
  console.log('proficientSkillOptions', proficientSkillOptions);
  const ChoiceBlock = ({ title, keyName, choose, options }) => {
    const prettyTitle = (() => {
      const key = String(keyName || '').toLowerCase();
      if (key === 'terrain' || key === 'terreno') return 'Terreno do Círculo';
      if (key === 'expertise_skills') return 'Perícias com Perícia';
      if (key === 'maneuvers') return 'Manobras';
      if (key === 'beast_companion') return 'Companheiro de Patrulha';
      if (key === 'hunter_prey') return 'Presa do Caçador';
      if (key === 'defensive_tactics') return 'Táticas Defensivas';
      if (key === 'multiattack') return 'Ataque Múltiplo';
      if (key === 'superior_defense') return 'Defesa de Caçador Superior';
      return title;
    })();
    // Evitar repetir Estilo de Luta já escolhido em níveis anteriores
    let normOptions = toOptions(options);
    if (String(keyName || '').toLowerCase() === 'fighting_style') {
      try {
        const seen = new Set();
        Object.keys(picksByLevel || {}).sort((a,b)=>Number(a)-Number(b)).forEach((lvl) => {
          const v = (picksByLevel?.[lvl]?.fighting_style);
          if (v) {
            const val = (typeof v === 'object') ? (v.name || v.id || String(v)) : String(v);
            if (val) seen.add(val);
          }
        });
        normOptions = normOptions.filter((o) => !seen.has(o.name || o.id));
      } catch (_) {}
    }
    const currVal = (picksByLevel?.[level]?.[keyName]) || (Number(choose) > 1 ? [] : null);
    if (Number(choose) > 1) {
      return (
        <div className={styles.panel}>
          <ProficiencySelect
            title={prettyTitle}
            options={normOptions}
            value={Array.isArray(currVal) ? currVal : (currVal ? [currVal] : [])}
            choose={Number(choose)}
            onChange={(val)=> applyLevelPatch && applyLevelPatch(level, { [keyName]: val })}
          />
        </div>
      );
    }
    // Single selection (default), with special support for beast_companion custom index
    if (String(keyName || '').toLowerCase() === 'beast_companion') {
      const selected = currVal || null;
      const selId = (selected && typeof selected === 'object') ? (selected.id || selected.name) : selected;
      const needsIndex = String(selId || '').toLowerCase().includes('outro');
      const currIndex = picksByLevel?.[level]?.beast_companion_index || '';
      return (
        <div className={styles.panel}>
          <div className={styles.panelTitle}>{`${prettyTitle} (escolha ${choose})`}</div>
          <Select
            placeholder={`Selecione ${prettyTitle.toLowerCase()}`}
            options={normOptions}
            value={selected || null}
            onChange={(val) => {
              if (!applyLevelPatch) return;
              applyLevelPatch(level, { [keyName]: Array.isArray(val) ? (val[0] || null) : val });
            }}
          />
          {needsIndex && (
            <div style={{ marginTop: 8 }}>
              <label className={styles.label}>Índice/ID do monstro (SRD):</label>
              <Input
                value={currIndex}
                onChange={(e) => applyLevelPatch && applyLevelPatch(level, { beast_companion_index: e.target.value })}
                placeholder="ex.: panther, hawk, mastiff"
              />
            </div>
          )}
        </div>
      );
    }
    return (
      <div className={styles.panel}>
        <div className={styles.panelTitle}>{`${prettyTitle} (escolha ${choose})`}</div>
        <Select
          placeholder={`Selecione ${prettyTitle.toLowerCase()}`}
          options={normOptions}
          value={currVal || null}
          onChange={(val) => {
            if (!applyLevelPatch) return;
            applyLevelPatch(level, { [keyName]: Array.isArray(val) ? (val[0] || null) : val });
          }}
        />
      </div>
    );
  };
  console.log('addChoices', addChoices);

  const items = [];
  try {
    // Known categories
    if (addChoices.languages?.options?.length && addChoices.languages?.choose > 0) {
      items.push(
        <ChoiceBlock key="sc-langs" title="Idiomas" keyName="languages" choose={addChoices.languages.choose} options={addChoices.languages.options} />
      );
    }
    ['skills','tools','instruments'].forEach((k) => {
      const conf = addChoices[k];
      if (conf?.options?.length && conf?.choose > 0) {
        items.push(
          <ChoiceBlock key={`sc-${k}`} title={k} keyName={k} choose={conf.choose} options={conf.options} />
        );
      }
    });
    
    // Cantrips choice (supports from_class override, e.g., druid)
    if (addChoices.cantrips?.choose > 0) {
      const conf = addChoices.cantrips;
      const currVal = (picksByLevel?.[level]?.['cantrips']) || [];
      const options = (fromClass && externalCantrips.length > 0)
        ? externalCantrips
        : cantripOptions;
      if (options.length > 0) {
      items.push(
        <div key="sc-cantrips" className={styles.panel}>
          <SpellPicker
            title={`Cantrips (escolha ${conf.choose})`}
            options={options}
            value={currVal}
            max={conf.choose}
            allowedLevel={0}
            onChange={(val) => applyLevelPatch && applyLevelPatch(level, { cantrips: val })}
          />
        </div>
      );
      }
    }
    
    // Spells choice
    if (addChoices.spells?.choose > 0 && spellOptions.length > 0) {
      const conf = addChoices.spells;
      const currVal = (picksByLevel?.[level]?.['spells']) || [];
      items.push(
        <div key="sc-spells" className={styles.panel}>
          <SpellPicker
            title={`Magias (escolha ${conf.choose})`}
            options={spellOptions}
            value={currVal}
            max={conf.choose}
            allowedLevel={conf.level || 1}
            onChange={(val) => applyLevelPatch && applyLevelPatch(level, { spells: val })}
          />
        </div>
      );
    }
    if (addChoices.fighting_style?.options?.length && addChoices.fighting_style?.choose > 0) {
      items.push(
        <ChoiceBlock key="sc-fs" title="Estilo de Luta" keyName="fighting_style" choose={addChoices.fighting_style.choose} options={addChoices.fighting_style.options} />
      );
    }
    // Maneuvers choice (Battle Master): excluir já aprendidas em outros níveis e por feats de raça
    if (addChoices.maneuvers?.options?.length && addChoices.maneuvers?.choose > 0) {
      const choose = Number(addChoices.maneuvers.choose) || 0;
      const allOptions = toOptions(addChoices.maneuvers.options || []);
      // coletar manobras já escolhidas em outros níveis
      const seen = new Set();
      try {
        Object.keys(picksByLevel || {}).forEach((lvl) => {
          const row = picksByLevel[lvl] || {};
          const arr = []
            .concat(Array.isArray(row.maneuvers) ? row.maneuvers : (row.maneuvers ? [row.maneuvers] : []))
            .concat(Array.isArray(row.manobras) ? row.manobras : (row.manobras ? [row.manobras] : []));
          arr.forEach((m) => { const id = (m && typeof m === 'object') ? (m.id || m.name) : m; if (id != null) seen.add(String(id)); });
          // feats (ASI como feat) que concedam manobras: considerar escolhas registradas
          const asi = row?.asi;
          const featChoices = asi && (asi.choices || asi?.choices);
          const featMans = featChoices?.maneuvers || featChoices?.manobras;
          if (Array.isArray(featMans)) {
            featMans.forEach((m) => { const id = (m && typeof m === 'object') ? (m.id || m.name) : m; if (id != null) seen.add(String(id)); });
          }
        });
        // considerar manobras escolhidas via talento da raça (Humano Variante)
        const raceFeatMans = (addChoices.__race_feat_maneuvers || []);
        if (Array.isArray(raceFeatMans)) {
          raceFeatMans.forEach((m) => { const id = (m && typeof m === 'object') ? (m.id || m.name) : m; if (id != null) seen.add(String(id)); });
        }
      } catch(_) {}
      // manter as escolhas atuais disponíveis, mas filtrar o restante
      const current = (picksByLevel?.[level]?.maneuvers || []).concat(picksByLevel?.[level]?.manobras || []);
      const currentSet = new Set((current || []).map(m => String((m && typeof m==='object') ? (m.id || m.name) : m)));
      const filtered = allOptions.filter((opt) => currentSet.has(String(opt.id)) || !seen.has(String(opt.id)));
      items.push(
        <ChoiceBlock
          key="sc-maneuvers"
          title="Manobras"
          keyName="maneuvers"
          choose={choose}
          options={filtered}
        />
      );
    }
    // Generic keys (with special handling for expertise_skills). Evitar duplicar blocos de Manobras.
    Object.entries(addChoices || {}).forEach(([key, conf]) => {
      if (["languages","skills","tools","instruments","fighting_style","maneuvers","manobras","__race_feat_maneuvers"].includes(key)) return;
      const choose = Number(conf?.choose || 0);
      if (key === 'expertise_skills') {
        // Only use proficient skills; do NOT fallback to YAML options
        const options = proficientSkillOptions;
        if (choose > 0 && options.length > 0) {
          items.push(
            <ChoiceBlock key={`sc-g-${key}`} title={"Perícias com Perícia"} keyName={key} choose={choose} options={options} />
          );
        }
        return;
      }
      const options = toOptions(Array.isArray(conf?.options) ? conf.options : []);
      if (choose > 0 && options.length > 0) {
        items.push(
          <ChoiceBlock key={`sc-g-${key}`} title={String(key).replace(/_/g,' ')} keyName={key} choose={choose} options={options} />
        );
      }
    });
  } catch (_) {}

  if (!items.length) return null;

  return (
    <div className={styles.stepContent}>
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Escolhas da Subclasse</div>
        {items}
      </div>
    </div>
  );
};

export default SubClassChoices;
