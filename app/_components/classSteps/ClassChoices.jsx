"use client";

import Select from "../UI/Select";
import Input from "../UI/Input";
import FeatChoices from "./FeatChoices";
import { useFeats } from "../../_hooks/useFeats";
import { useMemo } from "react";
import styles from "../../_styles/character/CharacterForm.module.css";
import ProficiencySelect from "../common/ProficiencySelect";
import AbilityIncreaseSelector from "./AbilityIncreaseSelector";
import FeatPicker from "./FeatPicker";
import ASISelector from "./ASISelector";
import SpellPicker from "./SpellPicker";
import SpellPickerPrepared from "./SpellPickerPrepared";

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
  onKnownChange = null,
  aggPreparedBefore = [],
  aggPreparedAll = [],
  onPreparedChange = null,
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
  const skillChoose = (Number(level) === 1) ? Number(rule?.skill_proficiencies?.choose || 0) : 0;
  const skillOptions = (rule?.skill_proficiencies?.options === 'any')
    ? (dicts?.skills_all || [])
    : (rule?.skill_proficiencies?.options || []);
  const skillOptsNormalized = (skillOptions || [])
    .map((s) => (typeof s === 'string' ? { id: s, name: s } : s))
    .filter((s) => !excludeSkillIds.includes(s.id));

  const instChoose = (Number(level) === 1) ? Number(rule?.tool_proficiencies?.instruments?.choose || 0) : 0;
  const needsInstruments = instChoose > 0;
  const instrumentOptions = (dicts?.instruments || []).map((i) => ({ id: i, name: i }));

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
  const totalAsi = Number(lvlRow?.ability_score_bonuses || 0);
  const prevAsi = Number(prevRow?.ability_score_bonuses || 0);
  const asiGrant = Math.max(0, totalAsi - prevAsi);
  const sc = lvlRow?.spellcasting || null;
  let slots = {};
  let pactSlots = null;
  try { slots = sc?.spell_slots ? JSON.parse(sc.spell_slots) : {}; } catch(_) { slots = {}; }
  try { pactSlots = sc?.pact_slots ? JSON.parse(sc.pact_slots) : null; } catch(_) { pactSlots = null; }

  const abilityMod = (score) => Math.floor((Number(score || 10) - 10) / 2);
  const castingAbility = ((lvlRow?.spellcasting?.casting_ability) || (rule?.spellcasting?.casting_ability) || '').toLowerCase();
  const modMap = { str: abilityMod(abilityScores.str), dex: abilityMod(abilityScores.dex), con: abilityMod(abilityScores.con), int: abilityMod(abilityScores.int), wis: abilityMod(abilityScores.wis), cha: abilityMod(abilityScores.cha) };
  const casterMod = modMap[castingAbility] ?? 0;
  // Determine prepared vs known caster from class rule, not from spells_known presence
  const preparedCaster = String(rule?.spellcasting?.preparation || '').toLowerCase() === 'prepared';
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
  const allowedKnownLevel = preparedCaster ? allowedSpellLevel : Math.max(1, allowedSpellLevel);

  const withLevelLabel = (list) => (list || []).map((s) => ({ id: s.id, name: `${s.name} (Nv ${s.level || 0})`, level: s.level || 0 }));
  const leveledCantripOptions = (cantripOptions || [])
    .filter(s => !(excludeCantrips || []).includes(s.id))
    .map((s) => ({ id: s.id, name: `${s.name} (Nv ${s.level || 0})`, level: s.level || 0 }));
  const excludeKnownIds = new Set([...(excludeKnown || []), ...(excludePrepared || []), ...((extraSpells || []).map(s=>s.id))]);
  const leveledSpellOptions = (spellOptions || [])
    .filter(s => (s.level || 0) <= allowedKnownLevel)
    .filter(s => !excludeKnownIds.has(s.id))
    .map((s) => ({ id: s.id, name: `${s.name} (Nv ${s.level || 0})`, level: s.level || 0 }));
  const leveledSpellCatalog = (spellCatalog || [])
    .filter(s => (s.level || 0) > 0 && (s.level || 0) <= allowedSpellLevel)
    .filter(s => !excludeKnownIds.has(s.id))
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
        const entries = Object.entries(requiredExact).filter(([k]) => k !== 'fighting_style');
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
              const base = (classSkillPicks || []).map((s)=> (typeof s === 'string' ? { id: s, name: s } : s));
              return base;
            }
            return normOpts(conf?.options);
          })();
          const value = lvlRow?.[key] || (choose > 1 ? [] : null);
          const label = ({
            metamagic: 'Metamágica',
            pact_boon: 'Pacto (Bruxo)',
            invocations: 'Invocações (Bruxo)',
            expertise_skills: 'Perícias com Perícia (Ladino)',
            favored_enemy: 'Inimigo Favorito',
            favored_terrain: 'Terreno Favorito',
          })[key] || key;
          // Render chooser
          if (choose > 1) {
            return (
              <ProficiencySelect
                key={`req-${key}`}
                title={`${label} (escolha ${choose})`}
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
          currentFeatId={currentFeatId}
          excludeIds={selectedFeatIds}
          defaultMode={(!asiChoiceObj || asiChoiceObj?.mode === 'attributes') ? 'attributes' : 'feat'}
        />
      )}

      {/* Spells selection (basic) */}
      {!!rule?.spellcasting && (
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
          {totalSpellsKnown != null && totalSpellsKnown != 0 && (
            <SpellPicker title={`Magias conhecidas (total até ${totalSpellsKnown})`} options={spellOptions} value={(aggKnownAll && aggKnownAll.length ? aggKnownAll : pickedSpells) || []} max={totalSpellsKnown} allowedLevel={allowedKnownLevel} excludeIds={[...excludeKnown]} onChange={(list)=> { if (onKnownChange) onKnownChange(list, totalSpellsKnown); else setPickedSpells(list); }} />
          )}

          {preparedCaster && allowedSpellLevel > 0 && (
            <>
              <SpellPickerPrepared title={`Magias preparadas (até ${preparedAllowed})`} catalog={spellCatalog} value={(aggPreparedAll && aggPreparedAll.length ? aggPreparedAll : preparedPicks) || []} max={preparedAllowed} allowedLevel={allowedSpellLevel} excludeIds={[...excludePrepared]} onChange={(list)=> { if (onPreparedChange) onPreparedChange(list, preparedAllowed); else setPreparedPicks(list); }} />
              <div className={styles.small}>Limite baseado em {rule?.spellcasting?.casting_ability}+nível da classe. Ajuste dos atributos impacta este valor.</div>
            </>
          )}

          {/* Slots grid preview */}
          {slots && Object.keys(slots).length > 0 && (
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
    </div>
  );
};

export default ClassChoices;
