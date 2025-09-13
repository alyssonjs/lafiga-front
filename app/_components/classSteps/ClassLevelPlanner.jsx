"use client";

import { useMemo, useState, useEffect } from "react";
import ClassChoices from "./ClassChoices";
import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";

const ClassLevelPlanner = ({
  rule,
  dicts,
  klassLevels = [],
  maxLevel = 1,
  cantripOptions = [],
  spellOptions = [],
  spellCatalog = [],
  // per-level picks map: { [level]: { skills:[], instruments:[], fighting_style:null, cantrips:[], spells:[], asi:{...}, subclass_id:null } }
  picksByLevel,
  setPicksByLevel,
  // aggregated states to keep legacy flows working
  setClassSkillPicks,
  setClassInstrumentPicks,
  setClassFightingStyle,
  setPickedCantrips,
  setPickedSpells,
  classSubclassId,
  setClassSubclassId,
  abilityScores = { str:10, dex:10, con:10, int:10, wis:10, cha:10 },
  klasses = [],
  excludeSkillIds = [],
  raceCantripsExtra = [],
  raceSpellsExtra = [],
  raceSelectedFeatId = null,
}) => {
  const [activeLevel, setActiveLevel] = useState(1);
  // When the character's max level changes, focus the planner on that level
  useEffect(() => {
    const ml = Number(maxLevel) || 1;
    setActiveLevel(ml);
  }, [maxLevel]);
  const chooseSubclassLevel = Number(rule?.subclass?.choose_level || 0);
  const subclassOptions = Object.values(rule?.subclass?.options || {}).map(o=>({ id:o.id, name:o.name, grants:o.grants }));

  const ensureLevel = (lvl) => {
    const current = picksByLevel[lvl] || {};
    // Preserve any existing custom keys (e.g., favored_enemy/terrain, invocations, metamagic, etc.)
    const result = {
      ...current,
      skills: current.skills || [],
      instruments: current.instruments || [],
      fighting_style: (current.fighting_style !== undefined ? current.fighting_style : null),
      cantrips: current.cantrips || [],
      spells: current.spells || [],
      asi: current.asi || { choices: {} },
      subclass_id: (current.subclass_id !== undefined ? current.subclass_id : null),
      prepared: current.prepared || [],
    };
    
    console.log('=== ensureLevel Debug ===');
    console.log('Level:', lvl);
    console.log('Current picksByLevel[lvl]:', current);
    console.log('Current asi:', current.asi);
    console.log('Result asi:', result.asi);
    console.log('========================');
    
    return result;
  };

  const updateLevel = (lvl, patch) => {
    console.log('=== updateLevel Debug ===');
    console.log('Level:', lvl);
    console.log('Patch:', patch);
    console.log('Patch.asi:', patch.asi);
    console.log('=======================');
    
    setPicksByLevel(prev => {
      const next = { ...prev };
      const ensured = ensureLevel(lvl);
      
      // CAUSA RAIZ: Fazer merge correto do asi em vez de sobrescrever
    const mergedLevel = { ...ensured, ...patch };
    if (patch.asi && ensured.asi) {
      mergedLevel.asi = { ...ensured.asi, ...patch.asi };
    }
      
      next[lvl] = mergedLevel;
      
      console.log('=== updateLevel Result ===');
      console.log('Ensured level data:', ensured);
      console.log('Patch:', patch);
      console.log('Merged level data:', mergedLevel);
      console.log('Final asi:', mergedLevel.asi);
      console.log('========================');
      
      // update aggregated derived states used elsewhere
      // skills/instruments typically at level 1
      if (lvl === 1 && patch.skills) setClassSkillPicks(patch.skills);
      if (lvl === 1 && patch.instruments) setClassInstrumentPicks(patch.instruments);
      if (patch.fighting_style !== undefined) setClassFightingStyle(patch.fighting_style);
      
      // flatten cantrips/spells across 1..maxLevel
      const allCan = [];
      const allSp = [];
      const allPrepared = [];
      for (let i = 1; i <= maxLevel; i++) {
        const p = next[i];
        if (!p) continue;
        if (Array.isArray(p.cantrips)) p.cantrips.forEach(c => { if (!allCan.find(x=>x.id===c.id)) allCan.push(c); });
        if (Array.isArray(p.spells)) p.spells.forEach(s => { if (!allSp.find(x=>x.id===s.id)) allSp.push(s); });
        if (Array.isArray(p.prepared)) p.prepared.forEach(s => { if (!allPrepared.find(x=>x.id===s.id)) allPrepared.push(s); });
      }
      setPickedCantrips(allCan);
      setPickedSpells(Array.from(new Set([...allSp, ...allPrepared])));
      
      return next;
    });
  };

  // Exclude arrays (tudo que já foi escolhido em outros níveis)
  const excludeForLevel = (lvl) => {
    const ex = { cantrips: [], known: [], prepared: [] };
    for (let i = 1; i <= maxLevel; i++) {
      if (i === lvl) continue;
      const p = picksByLevel[i] || {};
      if (Array.isArray(p.cantrips)) ex.cantrips.push(...p.cantrips.map(x=>x.id||x));
      if (Array.isArray(p.spells)) ex.known.push(...p.spells.map(x=>x.id||x));
      if (Array.isArray(p.prepared)) ex.prepared.push(...p.prepared.map(x=>x.id||x));
    }
    // dedup
    ex.cantrips = Array.from(new Set(ex.cantrips));
    ex.known = Array.from(new Set(ex.known));
    ex.prepared = Array.from(new Set(ex.prepared));
    return ex;
  };

  const lvlRow = (level) => (klassLevels || []).find((cl) => Number(cl.level) === Number(level)) || {};

  const LevelSidebar = useMemo(() => (
    <div className={styles.levelSidebar}>
      {Array.from({ length: Math.max(1, Number(maxLevel) || 1) }).map((_, idx) => {
        const lvl = idx + 1;
        const isActive = lvl === activeLevel;
        return (
          <button
            key={lvl}
            type="button"
            className={`${styles.levelButton} ${isActive ? styles.levelButtonActive : ''}`}
            onClick={() => setActiveLevel(lvl)}
            aria-current={isActive ? 'step' : undefined}
          >
            Nível {lvl}
          </button>
        );
      })}
    </div>
  ), [activeLevel, maxLevel]);


  // CAUSA RAIZ: ensureLevel estava sobrescrevendo o estado a cada render
  // Agora obtemos diretamente do picksByLevel e só usamos ensureLevel como fallback
  const picks = picksByLevel[activeLevel] || ensureLevel(activeLevel);
  
  console.log('=== picks Debug ===');
  console.log('activeLevel:', activeLevel);
  console.log('picksByLevel:', picksByLevel);
  console.log('picksByLevel[activeLevel]:', picksByLevel[activeLevel]);
  console.log('picks (final):', picks);
  console.log('picks.asi:', picks.asi);
  console.log('==================');

  // Aggregate spells/ prepared across levels
  const aggregateAcross = (upto) => {
    const out = { cantrips: [], known: [], prepared: [] };
    const seen = { cantrips: new Set(), known: new Set(), prepared: new Set() };
    for (let i = 1; i <= upto; i++) {
      const p = picksByLevel[i] || {};
      if (Array.isArray(p.cantrips)) p.cantrips.forEach(c => { const id = c.id || c; if (!seen.cantrips.has(id)) { seen.cantrips.add(id); out.cantrips.push(c); } });
      if (Array.isArray(p.spells)) p.spells.forEach(s => { const id = s.id || s; if (!seen.known.has(id)) { seen.known.add(id); out.known.push(s); } });
      if (Array.isArray(p.prepared)) p.prepared.forEach(s => { const id = s.id || s; if (!seen.prepared.has(id)) { seen.prepared.add(id); out.prepared.push(s); } });
    }
    return out;
  };

  const aggBefore = aggregateAcross(Math.max(1, activeLevel - 1));
  const aggAll    = aggregateAcross(activeLevel);

  const replaceLevelPicks = (lvl, patch) => {
    // use updateLevel to keep flattened state in sync upstream
    updateLevel(lvl, patch);
  };

  const applyKnownCumulative = (newList, allowedTotal = null) => {
    const totalAllowed = allowedTotal == null ? Infinity : Number(allowedTotal) || Infinity;
    const uniqueById = (arr) => {
      const seen = new Set();
      const out = [];
      for (const x of arr) { const id = x.id || x; if (!seen.has(id)) { seen.add(id); out.push(x); } }
      return out;
    };
    const selected = uniqueById((newList || []).slice(0, totalAllowed));
    const selectedIds = new Set(selected.map(x => x.id || x));

    // Keep earlier levels' spells if still selected; remove the rest
    const keptBefore = [];
    for (let i = 1; i < activeLevel; i++) {
      const prev = ensureLevel(i);
      const kept = (prev.spells || []).filter(s => selectedIds.has(s.id || s));
      kept.forEach(s => keptBefore.push(s));
      replaceLevelPicks(i, { spells: kept });
    }
    const keptIds = new Set(keptBefore.map(s => s.id || s));
    const toAssign = selected.filter(s => !keptIds.has(s.id || s));
    replaceLevelPicks(activeLevel, { spells: toAssign });
  };

  const applyPreparedCumulative = (newList, allowedTotal = null) => {
    const totalAllowed = allowedTotal == null ? Infinity : Number(allowedTotal) || Infinity;
    const uniqueById = (arr) => {
      const seen = new Set();
      const out = [];
      for (const x of arr) { const id = x.id || x; if (!seen.has(id)) { seen.add(id); out.push(x); } }
      return out;
    };
    const selected = uniqueById((newList || []).slice(0, totalAllowed));
    const selectedIds = new Set(selected.map(x => x.id || x));

    // Keep earlier levels' prepared if still selected; remove the rest
    const keptBefore = [];
    for (let i = 1; i < activeLevel; i++) {
      const prev = ensureLevel(i);
      const kept = (prev.prepared || []).filter(s => selectedIds.has(s.id || s));
      kept.forEach(s => keptBefore.push(s));
      replaceLevelPicks(i, { prepared: kept });
    }
    const keptIds = new Set(keptBefore.map(s => s.id || s));
    const toAssign = selected.filter(s => !keptIds.has(s.id || s));
    replaceLevelPicks(activeLevel, { prepared: toAssign });
  };

  return (
    <div className={styles.classLevelPlanner}>
      {LevelSidebar}
      <div className={styles.classLevelContent}>
        {/* Choices for the active level */}
        <ClassChoices
          rule={rule}
          dicts={dicts}
          level={activeLevel}
          klassLevels={klassLevels}
          classSkillPicks={(picks.skills || []).filter((v)=> !excludeSkillIds.includes(v?.id || v))}
          setClassSkillPicks={(val)=> updateLevel(activeLevel, { skills: val })}
          classInstrumentPicks={picks.instruments}
          setClassInstrumentPicks={(val)=> updateLevel(activeLevel, { instruments: val })}
          classFightingStyle={picks.fighting_style}
          setClassFightingStyle={(val)=> updateLevel(activeLevel, { fighting_style: val })}
          cantripOptions={cantripOptions}
          spellOptions={spellOptions}
          spellCatalog={spellCatalog}
          pickedCantrips={picks.cantrips}
          setPickedCantrips={(val)=> updateLevel(activeLevel, { cantrips: val })}
          pickedSpells={picks.spells}
          setPickedSpells={(val)=> updateLevel(activeLevel, { spells: val })}
          abilityScores={abilityScores}
          preparedPicks={picks.prepared}
          setPreparedPicks={(val)=> updateLevel(activeLevel, { prepared: val })}
          asiChoice={picks.asi}
          setAsiChoice={(val)=> {
            const asiValue = typeof val === 'function' ? val() : val;
            updateLevel(activeLevel, { asi: asiValue });
          }}
          excludeCantrips={[...excludeForLevel(activeLevel).cantrips, ...((raceCantripsExtra||[]).map(s=>s.id))]}
          excludeKnown={[...excludeForLevel(activeLevel).known, ...((raceSpellsExtra||[]).map(s=>s.id))]}
          excludePrepared={[...excludeForLevel(activeLevel).prepared, ...((raceSpellsExtra||[]).map(s=>s.id))]}
          excludeSkillIds={excludeSkillIds}
          raceSelectedFeatId={raceSelectedFeatId}
          aggKnownBefore={aggBefore.known}
          aggKnownAll={aggAll.known}
          klasses={klasses}
          picksByLevel={picksByLevel}
          onKnownChange={applyKnownCumulative}
          aggPreparedBefore={aggBefore.prepared}
          aggPreparedAll={aggAll.prepared}
          onPreparedChange={applyPreparedCumulative}
          extraCantrips={raceCantripsExtra}
          extraSpells={raceSpellsExtra}
          applyLevelPatch={(lvl, patch) => updateLevel(lvl, patch)}
        />

        {/* Subclass selection at the specific choose level */}
        {chooseSubclassLevel > 0 && activeLevel === chooseSubclassLevel && (
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Subclasse (nível {chooseSubclassLevel})</div>
          <Select
            placeholder="Selecione a subclasse"
            options={subclassOptions}
            value={picks.subclass_id || classSubclassId || null}
            onChange={(val)=> { updateLevel(activeLevel, { subclass_id: val }); setClassSubclassId(val); }}
            clearable
          />
          </div>
        )}

        {/* Features moved to independent left sidebar */}
      </div>
    </div>
  );
};

export default ClassLevelPlanner;
