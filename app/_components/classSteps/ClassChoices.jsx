"use client";

import Select from "../UI/Select";
import Input from "../UI/Input";
import FeatChoices from "./FeatChoices";
import { useFeats } from "../../_hooks/useFeats";
import { useMemo, useState, useEffect } from "react";
import styles from "../../_styles/character/CharacterForm.module.css";
import ProficiencySelect from "../common/ProficiencySelect";
import AbilityIncreaseSelector from "./AbilityIncreaseSelector";
import FeatPicker from "./FeatPicker";
import ASISelector from "./ASISelector";
import SpellPicker from "./SpellPicker";
import SpellPickerPrepared from "./SpellPickerPrepared";
import { apiClient } from "../../_lib/api/client";

const ClassChoices = ({
  rule, dicts,
  level,
  klassLevels = [],
  classSkillPicks, setClassSkillPicks,
  classInstrumentPicks, setClassInstrumentPicks,
  classFightingStyle, setClassFightingStyle,
  cantripOptions = [], spellOptions = [],
  spellCatalog = [],
  pickedCantrips, setPickedCantrips,
  pickedSpells, setPickedSpells,
  abilityScores = { str:10, dex:10, con:10, int:10, wis:10, cha:10 },
  preparedPicks = [], setPreparedPicks = () => {},
  asiChoice, setAsiChoice,
  excludeSkillIds = [],
  raceSelectedFeatId = null,
  excludeCantrips = [],
  excludeKnown = [],
  excludePrepared = [],
  aggKnownBefore = [],
  aggKnownAll = [],
  klasses = [],
  picksByLevel = {},
  subclassId = null,
  onKnownChange = null,
  aggPreparedBefore = [],
  aggPreparedAll = [],
  onPreparedChange = null,
  allowedInvocations = 0,
  prevAllowedInvocations = 0,
  aggInvocationsAll = [],
  onInvocationsChange = null,
  extraCantrips = [],
  extraSpells = [],
  // new: generic level patch updater
  applyLevelPatch = null,
}) => {
  const { feats, loading: featsLoading, error: featsError } = useFeats();
  
  // ==== FIX 1: normalizar o id da feat selecionada (compatível com estado antigo featName)
  // URGENT FIX: Se asiChoice for uma função, execute-a para obter o objeto
  const asiChoiceObj = typeof asiChoice === 'function' ? asiChoice() : asiChoice;
  const currentFeatId = asiChoiceObj?.featId ?? asiChoiceObj?.featName ?? null;
  
  // Debug: rastrear a inicialização do asiChoice
  console.log('=== ASI Choice Initialization Debug ===');
  console.log('asiChoice prop received:', asiChoice);
  console.log('asiChoiceObj processed:', asiChoiceObj);
  console.log('Has mode property?', 'mode' in (asiChoiceObj || {}));
  console.log('Mode value:', asiChoiceObj?.mode);
  console.log('========================================');
  
  // Debug detalhado para rastrear comportamento

  // Coletar todos os feats já escolhidos em todos os níveis
  const selectedFeatIds = useMemo(() => {
    const selectedIds = new Set();
    
    // Percorrer todos os níveis para encontrar feats escolhidos
    for (let level = 1; level <= 20; level++) {
      const levelPicks = picksByLevel?.[level];
      if (levelPicks?.asi?.mode === 'feat' && levelPicks.asi.featId) {
        selectedIds.add(levelPicks.asi.featId);
        console.log(`Found feat ${levelPicks.asi.featId} at level ${level}`);
      }
    }
    
    console.log('=== Selected Feat IDs Debug ===');
    console.log('picksByLevel:', picksByLevel);
    console.log('Selected feat IDs:', Array.from(selectedIds));
    console.log('===============================');
    
    if (raceSelectedFeatId) selectedIds.add(raceSelectedFeatId);
    return Array.from(selectedIds);
  }, [picksByLevel, raceSelectedFeatId]);

  // Opções para o Select de feats (filtradas para remover feats já escolhidos)
  const featOptions = useMemo(
    () => {
      const allFeats = (feats || []).map(f => ({ id: f.id, name: f.name, desc: f.description }));
      const filtered = allFeats.filter(f => !selectedFeatIds.includes(f.id));
      
      console.log('=== Feat Options Filter Debug ===');
      console.log('All feats count:', allFeats.length);
      console.log('Selected feat IDs:', selectedFeatIds);
      console.log('Filtered feats count:', filtered.length);
      console.log('=================================');
      
      return filtered;
    },
    [feats, selectedFeatIds]
  );

  // Valor (objeto da opção) para o Select de feats
  const featValueObj = useMemo(
    () => featOptions.find(o => o.id === currentFeatId) || null,
    [featOptions, currentFeatId]
  );
  
  // Dados completos da feat selecionada
  const selectedFeat = useMemo(
    () => (currentFeatId && feats.length ? feats.find(f => f.id === currentFeatId) : null),
    [currentFeatId, feats]
  );
  if (!rule) return null;
  console.log('=== ClassChoices Debug ===');
  console.log('asiChoice type:', typeof asiChoice);
  console.log('asiChoice:', asiChoice);
  
  // Se asiChoice for uma função, vamos executá-la para ver o resultado
  if (typeof asiChoice === 'function') {
    console.log('asiChoice is FUNCTION! Executing...');
    try {
      const executed = asiChoice();
      console.log('Executed result:', executed);
    } catch (e) {
      console.log('Error executing asiChoice function:', e);
    }
  }
  
  console.log('asiChoiceObj?.featId', asiChoiceObj?.featId);
  console.log('asiChoiceObj?.featName', asiChoiceObj?.featName);
  console.log('currentFeatId:', currentFeatId);
  console.log('mode === feat?', asiChoiceObj?.mode === 'feat');
  console.log('shouldRenderFeatComponent?', asiChoiceObj?.mode === 'feat');
  console.log('shouldRenderFeatChoices?', currentFeatId !== null);
  console.log('featOptions length:', featOptions?.length || 0);
  console.log('========================');
  // Magical Secrets (Bardo): catálogo de todas as magias
  const [anySpells, setAnySpells] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        if (String(rule?.id || '').toLowerCase() !== 'bard') return;
        const { spells = [] } = await apiClient.get('/api/v1/public/spells');
        const opts = (spells || []).map(s => ({ id: s.id, name: `${s.name} (Nv ${s.level || 0})`, level: s.level || 0 }));
        setAnySpells(opts);
      } catch (_) { setAnySpells([]); }
    })();
  }, [rule?.id]);
  const skillChoose = (Number(level) === 1) ? Number(rule?.skill_proficiencies?.choose || 0) : 0;
  const skillOptions = (rule?.skill_proficiencies?.options === 'any')
    ? (dicts?.skills_all || [])
    : (rule?.skill_proficiencies?.options || []);
  const skillOptsNormalized = (skillOptions || [])
    .map((s) => (typeof s === 'string' ? { id: s, name: s } : s))
    .filter((s) => !excludeSkillIds.includes(s.id));

  const instChoose = (Number(level) === 1) ? Number(rule?.tool_proficiencies?.instruments?.choose || 0) : 0;
  const toolGenericChoose = (Number(level) === 1) ? Number((rule?.tool_proficiencies?.choose || rule?.tool_proficiencies?.tools?.choose || 0)) : 0;
  const needsInstruments = instChoose > 0;
  const needsTools = Math.max(instChoose, toolGenericChoose) > 0;
  const instrumentOptions = (dicts?.instruments || []).map((i) => ({ id: i, name: i }));
  const artisanOptions = (dicts?.artisan_tools || []).map((t) => ({ id: t, name: t }));
  const toolsOptionsMerged = (() => {
    const map = new Map();
    [...instrumentOptions, ...artisanOptions].forEach(o => { if (!map.has(o.id)) map.set(o.id, o); });
    return Array.from(map.values());
  })();

  // Fighting Style when required at this level
  const requiredExact = (rule?.required_choices_at_level || {})[String(level)] || null;
  const needsFightingStyle = !!requiredExact?.fighting_style;
  const fightingStyleOptions = (dicts?.fighting_styles || []).map((fs) => ({ id: fs, name: fs }));


  // Spell counts from klassLevels (when available)
  const lvlRow = (klassLevels || []).find((cl) => Number(cl.level) === Number(level));
  const prevRow = (klassLevels || []).find((cl) => Number(cl.level) === (Number(level) - 1));
  const totalCantripsAtLevel = Number(
    lvlRow?.spellcasting?.cantrips_known ?? (Number(level) === 1 ? (rule?.spellcasting?.cantrips_known_at_1 || 0) : 0)
  ) || 0;
  const totalCantripsPrev = Number(prevRow?.spellcasting?.cantrips_known || 0) || 0;
  const cantripsGrant = Math.max(0, totalCantripsAtLevel - totalCantripsPrev);
  const totalSpellsKnown = (lvlRow?.spellcasting && lvlRow.spellcasting.spells_known != null) ? Number(lvlRow.spellcasting.spells_known) : null;
  const totalSpellsPrev = (prevRow?.spellcasting && prevRow.spellcasting.spells_known != null) ? Number(prevRow.spellcasting.spells_known) : null;
  const spellsGrant = (totalSpellsKnown != null && totalSpellsPrev != null)
    ? Math.max(0, totalSpellsKnown - totalSpellsPrev)
    : null;
  const profBonus = lvlRow?.prof_bonus != null ? Number(lvlRow.prof_bonus) : null;
  // ASI: prefer ClassLevel cumulative field; fallback to class_rules feature_rules
  const asiFromRuleAt = (lvl) => {
    try {
      const arr = (rule?.feature_rules?.ability_score_improvement?.levels) || [];
      if (!Array.isArray(arr) || arr.length === 0) return 0;
      return arr.filter((n) => Number(n) <= Number(lvl)).length;
    } catch (_) { return 0; }
  };
  const asiTotalRow = (lvlRow && lvlRow.ability_score_bonuses != null) ? Number(lvlRow.ability_score_bonuses) : null;
  const asiTotalPrev = (prevRow && prevRow.ability_score_bonuses != null) ? Number(prevRow.ability_score_bonuses) : null;
  const totalAsi = (asiTotalRow != null) ? asiTotalRow : asiFromRuleAt(level);
  const prevAsi  = (asiTotalPrev != null) ? asiTotalPrev : asiFromRuleAt(Math.max(0, Number(level) - 1));
  const asiGrant = Math.max(0, totalAsi - prevAsi);
  const sc = lvlRow?.spellcasting || null;
  let slots = {};
  let pactSlots = null;
  try {
    if (sc?.spell_slots) {
      if (typeof sc.spell_slots === 'string') {
        slots = JSON.parse(sc.spell_slots) || {};
      } else if (typeof sc.spell_slots === 'object') {
        slots = sc.spell_slots || {};
      }
    } else {
      slots = {};
    }
  } catch(_) { slots = {}; }
  try {
    if (sc?.pact_slots) {
      if (typeof sc.pact_slots === 'string') {
        pactSlots = JSON.parse(sc.pact_slots) || null;
      } else if (typeof sc.pact_slots === 'object') {
        pactSlots = sc.pact_slots || null;
      }
    } else {
      pactSlots = null;
    }
  } catch(_) { pactSlots = null; }

  const abilityMod = (score) => Math.floor((Number(score || 10) - 10) / 2);
  const castingAbility = ((lvlRow?.spellcasting?.casting_ability) || (rule?.spellcasting?.casting_ability) || '').toLowerCase();
  const modMap = { str: abilityMod(abilityScores.str), dex: abilityMod(abilityScores.dex), con: abilityMod(abilityScores.con), int: abilityMod(abilityScores.int), wis: abilityMod(abilityScores.wis), cha: abilityMod(abilityScores.cha) };
  const casterMod = modMap[castingAbility] ?? 0;
  // Determine prepared vs known caster from class rule, not from spells_known presence
  const preparedCaster = String(rule?.spellcasting?.preparation || '').toLowerCase() === 'prepared';
  const isWizard = String(rule?.id || '').toLowerCase() === 'wizard';
  const isCleric = String(rule?.id || '').toLowerCase() === 'cleric';
  const isDruid = String(rule?.id || '').toLowerCase() === 'druid';
  const isCook = String(rule?.id || '').toLowerCase() === 'cozinheiro';

  console.log(isWizard, isCleric, isDruid)
  // Prepared count: Paladin uses floor(level/2)+CHA, others level+casting mod
  const paladinPrepared = (String(rule?.id||'').toLowerCase() === 'paladin');
  const preparedAllowed = preparedCaster
    ? (paladinPrepared ? Math.max(1, Math.floor(Number(level||1)/2) + (modMap.cha||0)) : Math.max(1, Number(level) + casterMod))
    : 0;
  let allowedSpellLevel = Number(lvlRow?.spellcasting?.level || 0) || 0;
  if (!allowedSpellLevel && lvlRow?.spellcasting?.pact_slot_level != null) {
    const ps = Number(lvlRow.spellcasting.pact_slot_level);
    if (Number.isFinite(ps)) allowedSpellLevel = ps;
  }
  // Fallback: derive from slots map if level is missing (e.g., half-casters at early levels)
  if (!allowedSpellLevel) {
    try {
      const keys = Object.keys(slots || {}).map((k) => Number(k)).filter((n) => Number.isFinite(n));
      const withSlots = keys.filter((k) => Number(slots[k] || 0) > 0);
      if (withSlots.length) allowedSpellLevel = Math.max(...withSlots);
    } catch(_) {}
  }
  // Para Mago (grimório), limitar aprendizado ao maior nível de magia disponível (PHB)
  const allowedKnownLevel = preparedCaster ? allowedSpellLevel : Math.max(1, allowedSpellLevel);

  const withLevelLabel = (list) => (list || []).map((s) => ({ id: s.id, name: `${s.name} (Nv ${s.level || 0})`, level: s.level || 0 }));
  const leveledCantripOptions = (cantripOptions || [])
    .filter(s => !(excludeCantrips || []).includes(s.id))
    .map((s) => ({ id: s.id, name: `${s.name} (Nv ${s.level || 0})`, level: s.level || 0 }));
  const excludeKnownIds = new Set([...(excludeKnown || []), ...(excludePrepared || []), ...((extraSpells || []).map(s=>s.id))]);
  // Arcane Trickster: restrict to Illusion/Enchantment except at levels 8/14/20 (PHB windows)
  const isRogue = String(rule?.id || '').toLowerCase() === 'rogue';
  const isFighter = String(rule?.id || '').toLowerCase() === 'fighter';
  const isArcaneTrickster = isRogue && (
    String(subclassId || '') === 'arcane_trickster' ||
    (subclassId != null && !!rule?.subclass?.options?.arcane_trickster)
  );
  const isEldritchKnight = isFighter && (
    String(subclassId || '') === 'eldritch_knight' ||
    (subclassId != null && !!rule?.subclass?.options?.eldritch_knight)
  );
  const ignoreSchoolFilter = (isArcaneTrickster || isEldritchKnight) && [8,14,20].includes(Number(level));
  const biasList = (() => {
    try {
      if (isArcaneTrickster) return rule?.subclass?.options?.arcane_trickster?.grants?.spellcasting?.school_bias || [];
      if (isEldritchKnight) return rule?.subclass?.options?.eldritch_knight?.grants?.spellcasting?.school_bias || [];
      return [];
    } catch(_) { return []; }
  })();
  const allowedSchools = new Set((biasList || []).map(s => String(s).toLowerCase()));
  const catalogById = useMemo(() => {
    const m = new Map();
    (spellCatalog || []).forEach(s => { if (s && s.id != null) m.set(s.id, s); });
    return m;
  }, [spellCatalog]);
  const passesSchool = (id) => {
    if (!(isArcaneTrickster || isEldritchKnight) || ignoreSchoolFilter || allowedSchools.size === 0) return true;
    const s = catalogById.get(id);
    if (!s) return true;
    const sch = String(s.school || s.school_name || '').toLowerCase();
    // Accept English or PT-BR matches by contains
    if (sch.includes('ilusão') || sch.includes('ilus') || sch.includes('illusion')) return allowedSchools.has('ilusão') || allowedSchools.has('ilusao') || allowedSchools.has('illusion');
    if (sch.includes('encant') || sch.includes('enchant')) return allowedSchools.has('encantamento') || allowedSchools.has('enchantment');
    return false;
  };
  const leveledSpellOptions = (spellOptions || [])
    .filter(s => (s.level || 0) <= allowedKnownLevel)
    .filter(s => !excludeKnownIds.has(s.id))
    .filter(s => passesSchool(s.id))
    .map((s) => ({ id: s.id, name: `${s.name} (Nv ${s.level || 0})`, level: s.level || 0 }));
  const leveledSpellCatalog = (spellCatalog || [])
    .filter(s => (s.level || 0) > 0 && (s.level || 0) <= allowedSpellLevel)
    .filter(s => !excludeKnownIds.has(s.id))
    .filter(s => passesSchool(s.id))
    .map((s) => ({ id: s.id, name: `${s.name} (Nv ${s.level || 0})`, level: s.level || 0 }));

  const levelById = new Map(
    ([])
      .concat(cantripOptions || [])
      .concat(spellOptions || [])
      .concat(spellCatalog || [])
      .map((s) => [s.id, s.level || 0])
  );

  const filterValueByAllowedLevel = (list, limitLevel = allowedSpellLevel) => {
    if (!Array.isArray(list)) return [];
    return list.filter((s) => {
      let lvl = (s && (s.level != null ? s.level : s.level === 0 ? 0 : null));
      if (lvl == null) lvl = levelById.get(s?.id) ?? null;
      if (lvl == null) return false; // sem nível conhecido
      return Number(lvl) <= limitLevel && Number(lvl) > 0;
    });
  };

  const ABILITY_OPTIONS = [
    { id:'STR', name:'FOR' },
    { id:'DEX', name:'DES' },
    { id:'CON', name:'CON' },
    { id:'INT', name:'INT' },
    { id:'WIS', name:'SAB' },
    { id:'CHA', name:'CAR' },
  ];

  const slotQtyFor = (lvl) => {
    const key = String(lvl);
    const v = slots && (slots[key] != null ? Number(slots[key]) : null);
    return Number.isFinite(v) ? Math.max(0, v) : 0;
  };
  const knownList = (() => {
    const base = (aggKnownAll && aggKnownAll.length ? aggKnownAll : pickedSpells) || [];
    const seen = new Set();
    const out = [];
    (extraSpells || []).forEach(s => { const id = s.id || s; if(!seen.has(id)){ seen.add(id); out.push(s); }});
    base.forEach(s => { const id = s.id || s; if(!seen.has(id)){ seen.add(id); out.push(s); }});
    return out;
  })();
  const preparedList = (aggPreparedAll && aggPreparedAll.length ? aggPreparedAll : preparedPicks) || [];
  const cantripList = (() => {
    const seen = new Set();
    const out = [];
    (extraCantrips || []).forEach(c => { const id = c.id || c; if (!seen.has(id)) { seen.add(id); out.push(c); } });
    (pickedCantrips || []).forEach(c => { const id = c.id || c; if (!seen.has(id)) { seen.add(id); out.push(c); } });
    return out;
  })();
  const spellListToShow = preparedCaster ? (() => {
    const seen = new Set();
    const out = [];
    (extraSpells || []).forEach(s => { const id = s.id || s; if(!seen.has(id)){ seen.add(id); out.push(s); }});
    preparedList.forEach(s => { const id = s.id || s; if(!seen.has(id)){ seen.add(id); out.push(s); }});
    return out;
  })() : knownList;
  const twoColumns = (arr) => { const mid = Math.ceil(arr.length/2); return [arr.slice(0,mid), arr.slice(mid)]; };

  return (
    <div className={styles.stepContent}>

      {/* Skills */}
      {skillChoose > 0 && (
        <ProficiencySelect
          title={`Perícias da classe`}
          options={skillOptsNormalized}
          value={(classSkillPicks || []).filter((v)=> !excludeSkillIds.includes(v?.id || v))}
          choose={skillChoose}
          excludeIds={excludeSkillIds}
          onChange={setClassSkillPicks}
        />
      )}

      {/* Instruments (Bard) */}
      {needsInstruments && (
        <ProficiencySelect
          title={`Instrumentos`}
          options={instrumentOptions}
          value={classInstrumentPicks || []}
          choose={instChoose}
          onChange={setClassInstrumentPicks}
        />
      )}

      {/* Subclass choices moved to SubClassChoices component */}

      {/* Fighting Style (Fighter/Paladin/Ranger) */}
      {needsFightingStyle && (
        <>
          <label className={styles.label}>Estilo de Luta:</label>
          <Select
            placeholder="Selecione estilo de luta"
            options={((requiredExact?.fighting_style?.options) || fightingStyleOptions).map((fs)=> (typeof fs === 'string' ? { id: fs, name: fs } : fs))}
            value={classFightingStyle || null}
            onChange={(val) => setClassFightingStyle(val)}
          />
        </>
      )}

      {/* Other dynamic required choices (e.g., metamagic, pact_boon, expertise_skills, favored_enemy/terrain) */}
      {(() => {
        if (!requiredExact) return null;
        const entries = Object.entries(requiredExact).filter(([k]) => !['fighting_style','learn_any_class_spells','invocations'].includes(k));
        if (entries.length === 0) return null;
        const lvlRow = picksByLevel?.[level] || {};
        const normOpts = (opts) => {
          if (Array.isArray(opts)) return opts.map((v)=> (typeof v === 'string' ? { id: v, name: v } : v));
          if (typeof opts === 'string' && dicts && dicts[opts]) return (dicts[opts]||[]).map((v)=> ({ id: v, name: v }));
          if (typeof opts === 'symbol' && dicts && dicts[String(opts)]) return (dicts[String(opts)]||[]).map((v)=> ({ id: v, name: v }));
          return [];
        };
        const onPick = (key, value) => {
          if (applyLevelPatch) applyLevelPatch(level, { [key]: value });
        };
        const pickBlock = (key, conf) => {
          const choose = Number(conf?.choose || 1);
          const isExpertise = key === 'expertise_skills';
          const isFavEnemy = key === 'favored_enemy';
          const isFavTerrain = key === 'favored_terrain';
          const options = (() => {
            if (isExpertise) {
              // Aggregate proficient skills across all levels (e.g., class picks are usually at nível 1)
              const seen = new Set();
              const out = [];
              const add = (arr = []) => {
                (arr || []).forEach((s) => {
                  const id = (s && typeof s === 'object') ? (s.id || s.name || String(s)) : s;
                  const name = (s && typeof s === 'object') ? (s.name || s.id || String(s)) : String(s);
                  const key = String(id);
                  if (!key) return;
                  if (!seen.has(key)) { seen.add(key); out.push({ id: key, name }); }
                });
              };
              // Current level picks
              add(Array.isArray(classSkillPicks) ? classSkillPicks : (classSkillPicks ? [classSkillPicks] : []));
              // Per-level accumulated picks (especially nível 1)
              try {
                Object.keys(picksByLevel || {}).forEach((k) => {
                  const row = (picksByLevel || {})[k] || {};
                  add(Array.isArray(row.skills) ? row.skills : (row.skills ? [row.skills] : []));
                });
              } catch(_) {}
              return out;
            }
            const all = normOpts(conf?.options);
            if (isFavEnemy || isFavTerrain) {
              try {
                // Build a set of already picked values for this key across other levels
                const picked = new Set();
                Object.keys(picksByLevel || {}).forEach((k) => {
                  if (Number(k) === Number(level)) return; // keep current level's value available
                  const row = (picksByLevel || {})[k] || {};
                  const v = row?.[key];
                  if (!v) return;
                  const arr = Array.isArray(v) ? v : [v];
                  arr.forEach((it) => {
                    const id = (it && typeof it === 'object') ? (it.id || it.name || String(it)) : String(it);
                    if (id) picked.add(String(id));
                  });
                });
                // Keep current selection in the list even if "already picked" (editing)
                const curr = (lvlRow?.[key]);
                const currId = curr ? String((curr && typeof curr === 'object') ? (curr.id || curr.name || String(curr)) : String(curr)) : null;
                return all.filter((opt) => {
                  const oid = String(opt.id || opt.name);
                  if (currId && oid === currId) return true;
                  return !picked.has(oid);
                });
              } catch(_) { return all; }
            }
            return all;
          })();
          const value = lvlRow?.[key] || (choose > 1 ? [] : null);
          const label = ({
            metamagic: 'Metamágica',
            pact_boon: 'Pacto (Bruxo)',
            invocations: 'Invocações (Bruxo)',
            expertise_skills: 'Perícias com Perícia',
            favored_enemy: 'Inimigo Favorito',
            favored_terrain: 'Terreno Favorito',
            terrain: 'Terreno do Círculo',
            totem_spirit: 'Totem Espiritual',
            beast_aspect: 'Aspecto da Besta',
            totemic_attunement: 'Sintonização Totêmica',
          })[key] || key;
          // Render chooser
          if (choose > 1) {
            return (
              <ProficiencySelect
                key={`req-${key}`}
                title={label}
                options={options}
                value={Array.isArray(value) ? value : []}
                choose={choose}
                onChange={(val)=> onPick(key, val)}
              />
            );
          }
          // single
          return (
            <>
              <label className={styles.label}>{label}:</label>
              <Select
                key={`req-${key}`}
                placeholder={`Selecione ${label.toLowerCase()}`}
                options={options}
                value={value || null}
                onChange={(val)=> onPick(key, val)}
                clearable
              />
              {/* Special sub-choice when humanoids is selected for favored enemy */}
              {isFavEnemy && ((value && (value.id || value) === 'Humanoides (2 raças)')) && (
                <ProficiencySelect
                  title={`Raças de Humanoides (escolha 2)`}
                  options={(dicts?.ranger_humanoid_races || []).map((v)=>({ id: v, name: v }))}
                  value={lvlRow?.favored_enemy_details || []}
                  choose={2}
                  onChange={(val)=> onPick('favored_enemy_details', val)}
                />
              )}
            </>
          );
        };
        return (
          <div>
            {entries.map(([key, conf]) => pickBlock(key, conf))}
          </div>
        );
      })()}

      {/* ASI choice when available */}
      {asiGrant > 0 && (
        <ASISelector
          title={`Aprimoramento de Atributo (ASI)`}
          asiGrant={asiGrant}
          asiChoice={asiChoiceObj}
          setAsiChoice={setAsiChoice}
          cantripOptions={cantripOptions}
          spellOptions={spellOptions}
          klasses={klasses}
          dictionaries={dicts}
          currentFeatId={currentFeatId}
          excludeIds={selectedFeatIds}
          defaultMode={(!asiChoiceObj || asiChoiceObj?.mode === 'attributes') ? 'attributes' : 'feat'}
          abilityScores={abilityScores}
          hasSpellcasting={Boolean(rule?.spellcasting)}
          armorCatsFromClass={(() => {
            const out = new Set();
            (rule?.armor_proficiencies || []).forEach((v)=>{
              const t = String(v||'').toLowerCase();
              if (t.includes('leve') || t.includes('light')) out.add('light');
              if (t.includes('média') || t.includes('media') || t.includes('medium')) out.add('medium');
              if (t.includes('pesad') || t.includes('heavy')) out.add('heavy');
              if (t.includes('escudo') || t.includes('shield')) out.add('shields');
            });
            return Array.from(out);
          })()}
          weaponCatsFromClass={(() => {
            const out = new Set();
            (rule?.weapon_proficiencies || []).forEach((v)=>{
              const t = String(v||'').toLowerCase();
              if (t.includes('armas simples') || t.includes('simple')) out.add('simple');
              if (t.includes('armas marciais') || t.includes('martial')) out.add('martial');
            });
            return Array.from(out);
          })()}
        />
      )}

      {/* Ferramentas/Instrumentos (genérico) */}
      {needsTools && (
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Ferramentas / Instrumentos</div>
          <label className={styles.label}>Escolha {Math.max(instChoose, toolGenericChoose)}:</label>
          <Select
            multiselect
            options={toolsOptionsMerged}
            value={classInstrumentPicks || []}
            onChange={(list) => setClassInstrumentPicks((list || []).slice(0, Math.max(instChoose, toolGenericChoose)))}
          />
          {!!(classInstrumentPicks && classInstrumentPicks.length) && (
            <div className={styles.small} style={{ marginTop: 6 }}>
              Selecionados: {(classInstrumentPicks || []).map(x => x?.name || x).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Spells selection (basic) */}
      {!!(lvlRow?.spellcasting || rule?.spellcasting) && (
        <>
          {cantripsGrant > 0 && (
            <SpellPicker
              title={`Cantrips deste nível (até ${cantripsGrant})`}
              options={cantripOptions}
              value={pickedCantrips || []}
              max={cantripsGrant}
              allowedLevel={0}
              excludeIds={excludeCantrips || []}
              onChange={setPickedCantrips}
            />
          )}
          {((!isWizard && !isCleric && !isDruid) || (!preparedCaster && totalSpellsKnown != null && totalSpellsKnown != 0)) && (
            <SpellPicker title={`Magias conhecidas (total até ${totalSpellsKnown})`} options={spellOptions} value={(aggKnownAll && aggKnownAll.length ? aggKnownAll : pickedSpells) || []} max={totalSpellsKnown} allowedLevel={allowedKnownLevel} excludeIds={[...excludeKnown]} onChange={(list)=> { if (onKnownChange) onKnownChange(list, totalSpellsKnown); else setPickedSpells(list); }} />
          )}

          {/* Wizard: Grimório (cumulativo 6 + 2*(nível-1)) */}
          {isWizard && (() => {
            const wizardTotalKnown = 6 + Math.max(0, Number(level || 1) - 1) * 2;
            // Restringe por nível máximo de magia disponível (allowedSpellLevel)
            const options = (spellOptions || [])
              .filter(s => (s.level || 0) > 0 && (s.level || 0) <= Number(allowedSpellLevel || 0))
              .filter(s => !excludeKnownIds.has(s.id))
              .map((s) => ({ id: s.id, name: `${s.name} (Nv ${s.level || 0})`, level: s.level || 0 }));
            const value = (aggKnownAll && aggKnownAll.length ? aggKnownAll : pickedSpells) || [];
            return (
              <SpellPicker
                title={`Magias do Grimório (total até ${wizardTotalKnown})`}
                options={options}
                value={value}
                max={wizardTotalKnown}
                allowedLevel={allowedSpellLevel}
                excludeIds={[...excludeKnown]}
                onChange={(list)=> { if (onKnownChange) onKnownChange(list, wizardTotalKnown); else setPickedSpells(list); }}
              />
            );
          })()}

          {preparedCaster && allowedSpellLevel > 0 && (
            <>
              {(() => {
                // Para Mago: restringir preparação ao grimório (conhecidas) + extras
                const knownIds = new Set(((aggKnownAll && aggKnownAll.length ? aggKnownAll : pickedSpells) || []).map((s) => (s?.id || s)));
                const extraIds = new Set((extraSpells || []).map((s) => s.id));
                const prepCatalog = isWizard
                  ? (spellCatalog || []).filter((s) => knownIds.has(s.id) || extraIds.has(s.id))
                  : (spellCatalog || []);
                return (
                  <SpellPickerPrepared
                    title={`Magias preparadas (até ${preparedAllowed})`}
                    catalog={prepCatalog}
                    value={(aggPreparedAll && aggPreparedAll.length ? aggPreparedAll : preparedPicks) || []}
                    max={preparedAllowed}
                    allowedLevel={allowedSpellLevel}
                    excludeIds={[...excludePrepared]}
                    onChange={(list)=> { if (onPreparedChange) onPreparedChange(list, preparedAllowed); else setPreparedPicks(list); }}
                  />
                );
              })()}
              <div className={styles.small}>Limite baseado em {rule?.spellcasting?.casting_ability}+nível da classe. Ajuste dos atributos impacta este valor.</div>
            </>
          )}

          {/* Bard: Magical Secrets (níveis 10,14,18) — seleção de magias de qualquer classe */}
          {String(rule?.id || '').toLowerCase() === 'bard' && (() => {
            try {
              const gains = (rule?.feature_rules?.magical_secrets?.gains || []);
              const hit = gains.find(g => Number(g?.level) === Number(level));
              const choose = Number(hit?.learn || 0);
              if (choose <= 0) return null;
              const picksRow = picksByLevel?.[level] || {};
              const curr = Array.isArray(picksRow?.learn_any_class_spells) ? picksRow.learn_any_class_spells : [];
              // Excluir magias já conhecidas (qualquer nível) e também as escolhidas
              // como "Magias conhecidas" neste mesmo nível, para evitar duplicidade.
              const excludeKnownIds = new Set([...(excludeKnown || []), ...(excludePrepared || []), ...((extraSpells || []).map(s=>s.id))]);
              try { (Array.isArray(picksRow?.spells) ? picksRow.spells : []).forEach((s) => { const id = s?.id || s; if (id != null) excludeKnownIds.add(id); }); } catch(_) {}
              const filtered = (anySpells || [])
                .filter(s => (s.level || 0) > 0 && (s.level || 0) <= Number(allowedSpellLevel || 0))
                .filter(s => !excludeKnownIds.has(s.id));
              return (
                <div className={styles.panel}>
                  <SpellPicker
                    title={`Magical Secrets (escolha ${choose})`}
                    options={filtered}
                    value={curr}
                    max={choose}
                    allowedLevel={allowedSpellLevel}
                    excludeIds={[...excludeKnownIds]}
                    onChange={(val) => applyLevelPatch && applyLevelPatch(level, { learn_any_class_spells: val })}
                  />
                </div>
              );
            } catch(_) { return null; }
          })()}

          {/* Warlock: Eldritch Invocations cumulative selector */}
          {String(rule?.id || '').toLowerCase() === 'warlock' && Number(allowedInvocations || 0) > 0 && (() => {
            try {
              const prevAllowed = Number(prevAllowedInvocations || 0);
              const totalAllowed = Number(allowedInvocations || 0);
              // Base options from dicts
              const base = (dicts?.invocations_core || []).map((v) => ({ id: v, name: v }));
              // Prereqs: determine Pact Boon and Eldritch Blast known
              const pactBoon = (() => {
                try {
                  // Find any chosen pact_boon across levels
                  for (let i = 1; i <= 20; i++) {
                    const row = picksByLevel?.[i] || {};
                    if (row?.pact_boon) return (row.pact_boon.id || row.pact_boon);
                  }
                } catch(_) {}
                return null;
              })();
              const ebId = (() => {
                const pools = [];
                pools.push(...(cantripOptions || []));
                pools.push(...(spellOptions || []));
                pools.push(...(spellCatalog || []));
                const names = new Set(['Eldritch Blast','Rajada Mística','Rajada Mistica']);
                const found = pools.find((s) => names.has(String(s?.name || '')));
                return found?.id || null;
              })();
              const hasEldritchBlast = (() => {
                if (!ebId) return false;
                // Check aggregated known
                const inKnown = (aggKnownAll || []).some((s) => Number((s?.id || s)) === Number(ebId));
                if (inKnown) return true;
                // Check per-level picks (cantrips/spells/learn_any_class_spells)
                try {
                  for (let i = 1; i <= 20; i++) {
                    const row = picksByLevel?.[i] || {};
                    const has = [row.cantrips, row.spells, row.learn_any_class_spells]
                      .flatMap((arr)=> Array.isArray(arr) ? arr : [])
                      .some((x)=> Number((x?.id || x)) === Number(ebId));
                    if (has) return true;
                  }
                } catch(_) {}
                return false;
              })();
              // Min level + pact prereqs (mirror of BE guard; simplified)
              const minReqs = {
                'Thirsting Blade': { min: 5, pact: 'Pacto da Lâmina' },
                'Lifedrinker': { min: 12, pact: 'Pacto da Lâmina' },
                'Voice of the Chain Master': { pact: 'Pacto da Corrente' },
                'Chains of Carceri': { min: 15, pact: 'Pacto da Corrente' },
                'Sculptor of Flesh': { min: 7 },
                'Dreadful Word': { min: 7 },
                'Sign of Ill Omen': { min: 5 },
                'Otherworldly Leap': { min: 9 },
                'Minions of Chaos': { min: 9 },
                'Master of Myriad Forms': { min: 15 },
                'Visions of Distant Realms': { min: 15 },
                'Witch Sight': { min: 15 },
                'Eldritch Spear': { blast: true },
                'Repelling Blast': { blast: true },
                'Agonizing Blast': { blast: true },
                'Book of Ancient Secrets': { pact: 'Pacto do Tomo' }
              };
              const currLevel = Number(level) || 1;
              const normalizedBoon = String(pactBoon || '');
              const meetsPact = (need) => {
                if (!need) return true;
                const n = String(need).toLowerCase();
                const b = normalizedBoon.toLowerCase();
                if (n.includes('tomo')) return b.includes('tomo');
                if (n.includes('lâmina') || n.includes('lamina')) return b.includes('lâmina') || b.includes('lamina');
                if (n.includes('corrente')) return b.includes('corrente');
                return false;
              };
              // Filter options by prerequisites
              const filtered = base.filter((opt) => {
                const name = String(opt?.name || opt?.id || '');
                const req = minReqs[name] || {};
                if (req.min && currLevel < Number(req.min)) return false;
                if (req.pact && !meetsPact(req.pact)) return false;
                if (req.blast && !hasEldritchBlast) return false;
                return true;
              });
              const val = (aggInvocationsAll && aggInvocationsAll.length ? aggInvocationsAll : (picksByLevel?.[level]?.invocations || []));
              if (totalAllowed <= prevAllowed) {
                return (
                  <div className={styles.panel}>
                    <label className={styles.label}>Invocações Místicas</label>
                    <div className={styles.small}>Total permitido: {totalAllowed}. Próximo ganho em níveis superiores.</div>
                    <div className={styles.small}>Selecionadas (total): {(val || []).length}/{totalAllowed}</div>
                  </div>
                );
              }
              return (
                <div className={styles.panel}>
                  <ProficiencySelect
                    title={`Invocações Místicas`}
                    options={filtered}
                    value={val}
                    choose={totalAllowed}
                    onChange={(list) => onInvocationsChange && onInvocationsChange(list, totalAllowed)}
                  />
                  {/* Tips for common prereqs */}
                  {(!hasEldritchBlast) && (
                    <div className={styles.small}>Algumas invocações (Agonizing/Eldritch/Repelling Blast) requerem o truque Eldritch Blast.</div>
                  )}
                  {normalizedBoon && (
                    <div className={styles.small}>Pacto atual: {normalizedBoon}. Algumas invocações requerem Pacto específico.</div>
                  )}
                  <div className={styles.small}>Algumas invocações só liberam em níveis maiores (ex.: 5, 7, 9, 12, 15).</div>
                </div>
              );
            } catch(_) { return null; }
          })()}

          {/* Warlock: Mystic Arcanum (fixed level picks at 11/13/15/17) */}
          {String(rule?.id || '').toLowerCase() === 'warlock' && (() => {
            try {
              const grants = rule?.feature_rules?.mystic_arcanum?.grants || {};
              const hit = grants[String(level)] || grants[level];
              const targetLevel = Number(hit?.level || 0);
              if (!targetLevel) return null;
              const options = (spellCatalog || [])
                .filter((s) => Number(s.level || 0) === targetLevel)
                .map((s) => ({ id: s.id, name: `${s.name} (Nv ${s.level || 0})`, level: s.level || 0, rawName: s.name }));
              const currentId = (() => {
                const row = picksByLevel?.[level] || {};
                const v = row?.mystic_arcanum || row?.arcanum || null;
                return v ? (v.id || v) : null;
              })();
              return (
                <div className={styles.panel}>
                  <label className={styles.label}>{`Mystic Arcanum — Magia de Nível ${targetLevel}`}</label>
                  <Select
                    placeholder={`Escolha uma magia de nível ${targetLevel}`}
                    options={options}
                    value={currentId}
                    onChange={(id) => {
                      if (!applyLevelPatch) return;
                      if (id == null) { applyLevelPatch(level, { mystic_arcanum: null }); return; }
                      const opt = options.find(o => String(o.id) === String(id));
                      const raw = (opt?.rawName || opt?.name || '').replace(/\s*\(Nv\s*\d+\)\s*$/i,'');
                      applyLevelPatch(level, { mystic_arcanum: { id, name: raw } });
                    }}
                    clearable
                  />
                </div>
              );
            } catch(_) { return null; }
          })()}

          {/* Slots grid preview */}
          {(
            (() => {
              // Suportar slots como string JSON ou objeto serializado
              let norm = {};
              if (sc?.spell_slots) {
                if (typeof sc.spell_slots === 'string') {
                  try { norm = JSON.parse(sc.spell_slots) || {}; } catch (_) { norm = {}; }
                } else if (typeof sc.spell_slots === 'object') {
                  norm = sc.spell_slots || {};
}
              }
              return Object.keys(norm).length > 0 ? norm : null;
            })()
          ) && (
            <div className={styles.frameBox} style={{ marginTop: 10 }}>
              <div className={styles.frameHeader}>Espaços de Magia</div>
              <div className={styles.slotsGrid}>
                {Array.from({length:9}).map((_,i)=>{
                  const lvl = i+1; const qty = slotQtyFor(lvl);
                  return (
                    <div key={lvl} className={styles.slotCol}>
                      <div className={styles.slotHeader}>{lvl}º</div>
                      <div className={styles.slotDots}>
                        {Array.from({length:qty}).map((__,j)=>(<span key={j} className={styles.slotDot}></span>))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Monk: Ki note (level 1) */}
      {String(rule?.id || '').toLowerCase() === 'monk' && Number(level) < 2 && (
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Ki (informativo)</div>
          <div className={styles.small}>
            No 1º nível você ainda não possui pontos de Ki. O recurso Ki é adquirido a partir do 2º nível; técnicas de Ki e efeitos associados ficam disponíveis quando essa característica é obtida.
          </div>
        </div>
      )}

      {/* Druid: Wild Shapes notes (from level 2) */}
      {String(rule?.id || '').toLowerCase() === 'druid' && Number(level) >= 2 && (
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Formas Selvagens (anotações)</div>
          <div className={styles.small} style={{ marginBottom: 6 }}>
            Liste as formas que seu druida costuma usar (uma por linha). Isto é opcional e serve para referência na ficha.
          </div>
          <textarea
            rows={5}
            style={{ width: '100%', resize: 'vertical', background: 'var(--light)', color: 'var(--text)', borderRadius: 6, padding: 8, border: '1px solid var(--muted)' }}
            placeholder={`Ex.:\nLobo\nPantera\nUrso pardo`}
            value={(() => {
              const arr = Array.isArray(picksByLevel?.[level]?.wild_shapes)
                ? (picksByLevel[level].wild_shapes || [])
                : (picksByLevel?.[level]?.wild_shapes ? [picksByLevel[level].wild_shapes] : []);
              return arr.map(x => (typeof x === 'string' ? x : (x?.name || x?.id || ''))).filter(Boolean).join('\n');
            })()}
            onChange={(e) => {
              const lines = String(e.target.value || '')
                .split(/\r?\n/)
                .map(s => s.trim())
                .filter(Boolean);
              applyLevelPatch && applyLevelPatch(level, { wild_shapes: lines });
            }}
          />
          <div className={styles.small} style={{ marginTop: 6, color: 'var(--muted)' }}>
            Restrições padrão: ND máx. 1/4 no 2º nível (sem natação), 1/2 no 4º (natação ok), ND 1 no 8º (voo permitido).
          </div>
        </div>
      )}

      {/* Cook: Petiscos (Snacks) conhecidos por nível */}
      {isCook && (() => {
        try {
          const map = rule?.feature_rules?.cook?.snacks?.known_by_level || {};
          const totalAt = Number(map[String(level)] ?? map[level] ?? 0) || 0;
          const totalPrev = Number(map[String(Math.max(1, Number(level) - 1))] ?? map[Math.max(1, Number(level) - 1)] ?? 0) || 0;
          const grant = Math.max(0, totalAt - totalPrev);
          if (grant <= 0) return null;

          // Excluir petiscos já escolhidos em outros níveis
          const excludeSnackIds = (() => {
            const set = new Set();
            try {
              for (let i = 1; i <= 20; i++) {
                if (i === Number(level)) continue;
                const row = picksByLevel?.[i] || {};
                const arr = Array.isArray(row.snacks) ? row.snacks : (row.snacks ? [row.snacks] : []);
                arr.forEach(s => { const id = s?.id || s; if (id != null) set.add(id); });
              }
            } catch(_) {}
            return Array.from(set);
          })();

          // Valor atual deste nível
          const value = (() => {
            const row = picksByLevel?.[level] || {};
            const arr = Array.isArray(row.snacks) ? row.snacks : (row.snacks ? [row.snacks] : []);
            return arr;
          })();

          // Filtrar opções de petiscos por min_class_level (do backend)
          const snackOptions = (cantripOptions || []).filter((opt) => {
            const minLv = Number(opt?.min_class_level || 1);
            return Number(level) >= minLv;
          });

          // Recurso (informativo): usos e CD conforme regra derivada
          const conModVal = abilityMod(abilityScores.con);
          const prof = Number(profBonus || 2);
          const extraFromOrders = Number(level) >= 7 ? Math.max(0, conModVal) : 0;
          const uses = Math.max(1, conModVal) + extraFromOrders;
          const dc = 8 + prof + conModVal;

          return (
            <div className={styles.panel}>
              <div className={styles.panelTitle}>Petiscos</div>
              <SpellPicker
                title={`Petiscos deste nível (até ${grant})`}
                options={snackOptions}
                value={value}
                max={grant}
                allowedLevel={0}
                excludeIds={excludeSnackIds}
                onChange={(list) => {
                  if (applyLevelPatch) applyLevelPatch(level, { snacks: list });
                }}
              />
              <div className={styles.small} style={{ marginTop: 6 }}>
                Usos por descanso: {uses} · CD dos petiscos: {dc} (8 + Prof {prof} + CON {conModVal})
              </div>
            </div>
          );
        } catch(_) { return null; }
      })()}
    </div>
  );
};

export default ClassChoices;
