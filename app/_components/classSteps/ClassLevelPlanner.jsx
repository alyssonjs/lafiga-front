"use client";

import { useMemo, useState, useEffect } from "react";
import ClassChoices from "./ClassChoices";
import SubClassChoices from "./SubClassChoices";
import SubclassStepper from "./SubclassStepper";
import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";
import { useSubclasses } from "../../_hooks/useSubclasses";

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
  raceFeatManeuvers = [],
  // New: external proficiencies that count towards expertise eligibility
  backgroundProfs = [],
  raceSkillProfs = [],
}) => {
  const [activeLevel, setActiveLevel] = useState(1);
  // When the character's max level changes, focus the planner on that level
  useEffect(() => {
    const ml = Number(maxLevel) || 1;
    setActiveLevel(ml);
  }, [maxLevel]);
  const chooseSubclassLevel = Number(rule?.subclass?.choose_level || 0);
  const subclassOptions = Object.values(rule?.subclass?.options || {}).map(o=>({ id:o.id, name:o.name, grants:o.grants }));
  // Merge API subclasses (with additional choices) using the hook output
  // Note: SubclassStepper already fetches them; we simply read chosen subclass meta from props/state when needed

  // Derive selected klass (id/api_index) from provided rule + klasses list
  const selectedKlass = useMemo(() => {
    try {
      const rid = String(rule?.id || '').trim();
      if (!rid) return null;
      return klasses.find(k => String(k.api_index || '') === rid) || null;
    } catch (_) {
      return null;
    }
  }, [klasses, rule?.id]);
  const selectedKlassId = selectedKlass?.id || null;
  const selectedKlassApiIndex = selectedKlass?.api_index || (rule?.id || null);

  // Load subclasses from API to derive additional choices by level (no global cache)
  const { subclasses: apiSubclasses } = useSubclasses(selectedKlassId, selectedKlassApiIndex);

  // Mark learn_any_class flag for current level if exposed by API for the chosen subclass
  useEffect(() => {
    try {
      const ml = Number(maxLevel) || 1;
      const chosenSubclassId = (() => {
        // prefer explicit pick at current level, else stored global pick
        const row = picksByLevel?.[ml] || {};
        return row?.subclass_id || classSubclassId || null;
      })();
      if (!chosenSubclassId) return;
      const subMeta = (apiSubclasses || []).find(s => String(s.id) === String(chosenSubclassId));
      const learnMap = subMeta?.learn_any_class_by_level || {};
      const val = learnMap[String(ml)] || learnMap[ml];
      if (val && Number(val) > 0) {
        // store a marker in picksByLevel so BE can accept any-class learning
        setPicksByLevel(prev => {
          const next = { ...prev };
          const row = { ...(next[ml] || {}) };
          if (!row.learn_any_class || row.learn_any_class !== Number(val)) {
            row.learn_any_class = Number(val);
            next[ml] = row;
          }
          return next;
        });
      }
    } catch(_) {}
  }, [apiSubclasses, classSubclassId, picksByLevel, maxLevel, setPicksByLevel]);

  const ensureLevel = (lvl) => {
    const current = picksByLevel[lvl] || {};
    const toArr = (v) => Array.isArray(v) ? v : (v ? [v] : []);
    // Preserve any existing custom keys (e.g., favored_enemy/terrain, invocations, metamagic, etc.)
    const result = {
      ...current,
      skills: toArr(current.skills),
      instruments: toArr(current.instruments),
      fighting_style: (current.fighting_style !== undefined ? current.fighting_style : null),
      cantrips: toArr(current.cantrips),
      spells: toArr(current.spells),
      asi: current.asi || { choices: {} },
      subclass_id: (current.subclass_id !== undefined ? current.subclass_id : null),
      prepared: toArr(current.prepared),
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
        const cantripsArr = Array.isArray(p.cantrips) ? p.cantrips : (p.cantrips ? [p.cantrips] : []);
        const spellsArr = Array.isArray(p.spells) ? p.spells : (p.spells ? [p.spells] : []);
        const preparedArr = Array.isArray(p.prepared) ? p.prepared : (p.prepared ? [p.prepared] : []);
        cantripsArr.forEach(c => { const id = c?.id || c; if (id != null && !allCan.find(x=> (x?.id||x)===id)) allCan.push(c); });
        spellsArr.forEach(s => { const id = s?.id || s; if (id != null && !allSp.find(x=> (x?.id||x)===id)) allSp.push(s); });
        preparedArr.forEach(s => { const id = s?.id || s; if (id != null && !allPrepared.find(x=> (x?.id||x)===id)) allPrepared.push(s); });
      }
      setPickedCantrips(allCan);
      setPickedSpells(Array.from(new Set([...allSp, ...allPrepared])));
      
      return next;
    });
  };

  // Helper: derive additional choices for the active level from chosen subclass metadata
  const additionalChoicesForLevel = useMemo(() => {
    try {
      if (!classSubclassId) return {};
      const hit = (apiSubclasses || []).find(s => String(s.id) === String(classSubclassId));
      const byLevel = hit?.additional_choices_by_level || {};
      const base = byLevel[String(activeLevel)] || byLevel[activeLevel] || {};

      // Merge learn_any_class_by_level into a spells choice, so UI can render SpellPicker
      const learnAny = hit?.learn_any_class_by_level || {};
      const chooseSpells = Number(learnAny[String(activeLevel)] || learnAny[activeLevel] || 0);
      if (chooseSpells > 0) {
        const merged = { ...base };
        const existing = Number(merged?.spells?.choose || 0);
        if (!merged.spells) {
          merged.spells = { choose: chooseSpells };
        } else if (chooseSpells > existing) {
          merged.spells = { ...merged.spells, choose: chooseSpells };
        }
        return merged;
      }
      // Inject Beast Master companion selection (level 3+) ONLY for Ranger → Beast Master
      try {
        const classId = String(rule?.id || '').toLowerCase();
        const subId = String(hit?.id || '').toLowerCase();
        const subName = String(hit?.name || '').toLowerCase();
        const isRanger = classId === 'ranger';
        const looksLikeBeastMaster = (
          subId.includes('beast') || subId.includes('best') ||
          subName.includes('feras') || subName.includes('best') || subName.includes('beast')
        );
        if (isRanger && looksLikeBeastMaster) {
          // Show at level 3, or later levels if still not chosen
          const alreadyPicked = (() => {
            try {
              const keys = Object.keys(picksByLevel || {});
              return keys.some((k) => Number(k) >= 3 && (picksByLevel?.[k]?.beast_companion));
            } catch(_) { return false; }
          })();
          const shouldOffer = (Number(activeLevel) === 3) || (!alreadyPicked && Number(activeLevel) > 3);
          if (shouldOffer) {
            const merged = { ...base };
            if (!merged.beast_companion) {
              merged.beast_companion = {
                choose: 1,
                options: [
                  { id: 'Falcão', name: 'Falcão' },
                  { id: 'Mastim', name: 'Mastim' },
                  { id: 'Pantera', name: 'Pantera' },
                  { id: 'Outro (informar índice)', name: 'Outro (informar índice)' }
                ]
              };
            }
            return merged;
          }
        }
      } catch(_) {}
      return base;
    } catch (_) { return {}; }
  }, [apiSubclasses, classSubclassId, activeLevel, picksByLevel]);

  // Exclude arrays (tudo que já foi escolhido em outros níveis)
  const excludeForLevel = (lvl) => {
    const ex = { cantrips: [], known: [], prepared: [] };
    for (let i = 1; i <= maxLevel; i++) {
      if (i === lvl) continue;
      const p = picksByLevel[i] || {};
      if (Array.isArray(p.cantrips)) ex.cantrips.push(...p.cantrips.map(x=>x.id||x));
      if (Array.isArray(p.spells)) ex.known.push(...p.spells.map(x=>x.id||x));
      // Consider Magical Secrets as "magias conhecidas" para efeito de exclusão
      if (Array.isArray(p.learn_any_class_spells)) ex.known.push(...p.learn_any_class_spells.map(x=>x.id||x));
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


  // Aggregate class skill picks across all levels up to current (for expertise options)
  const aggregatedClassSkills = useMemo(() => {
    const seen = new Set();
    const add = (arr) => {
      (arr || []).forEach((s) => {
        const id = (s && typeof s === 'object') ? (s.id || s.name || String(s)) : s;
        if (id == null) return;
        if (!seen.has(id)) {
          seen.add(id);
          out.push(typeof s === 'object' ? s : { id, name: String(id) });
        }
      });
    };
    const out = [];
    // Class-picked skills across all levels
    for (let i = 1; i <= Math.max(1, Number(maxLevel) || 1); i++) {
      const p = picksByLevel[i] || {};
      const arr = Array.isArray(p.skills) ? p.skills : (p.skills ? [p.skills] : []);
      add(arr);
    }
    // Background skills
    add(Array.isArray(backgroundProfs) ? backgroundProfs : []);
    // Race skills (may be id strings)
    add(Array.isArray(raceSkillProfs) ? raceSkillProfs : []);
    return out;
  }, [picksByLevel, maxLevel, backgroundProfs, raceSkillProfs]);

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

  const applyInvocationsCumulative = (newList, allowedTotal = null) => {
    const totalAllowed = allowedTotal == null ? Infinity : Number(allowedTotal) || Infinity;
    const uniqueByName = (arr) => {
      const seen = new Set();
      const out = [];
      for (const x of arr || []) { const id = (x && typeof x === 'object') ? (x.id || x.name || x) : x; if (!seen.has(id)) { seen.add(id); out.push(id); } }
      return out;
    };
    const selected = uniqueByName((newList || []).slice(0, totalAllowed));
    const selectedSet = new Set(selected);

    // Keep earlier levels' invocations if still selected; remove the rest
    const keptBefore = [];
    for (let i = 1; i < activeLevel; i++) {
      const prev = ensureLevel(i);
      const arr = Array.isArray(prev.invocations) ? prev.invocations : (prev.invocations ? [prev.invocations] : []);
      const kept = arr.filter((nm) => selectedSet.has(nm || (nm?.id || nm?.name)));
      kept.forEach((nm) => keptBefore.push((typeof nm === 'object') ? (nm.id || nm.name || nm) : nm));
      replaceLevelPicks(i, { invocations: kept });
    }
    const keptSet = new Set(keptBefore);
    const toAssign = selected.filter((nm) => !keptSet.has(nm));
    replaceLevelPicks(activeLevel, { invocations: toAssign });
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
          subclassId={picks.subclass_id || classSubclassId}
          classSkillPicks={
            (Array.isArray(picks.skills) ? picks.skills : (picks.skills ? [picks.skills] : []))
              .filter((v)=> !excludeSkillIds.includes(v?.id || v))
          }
          setClassSkillPicks={(val)=> updateLevel(activeLevel, { skills: val })}
          classInstrumentPicks={Array.isArray(picks.instruments) ? picks.instruments : (picks.instruments ? [picks.instruments] : [])}
          setClassInstrumentPicks={(val)=> updateLevel(activeLevel, { instruments: val })}
          classFightingStyle={picks.fighting_style}
          setClassFightingStyle={(val)=> updateLevel(activeLevel, { fighting_style: val })}
          cantripOptions={cantripOptions}
          spellOptions={spellOptions}
          spellCatalog={spellCatalog}
          pickedCantrips={Array.isArray(picks.cantrips) ? picks.cantrips : (picks.cantrips ? [picks.cantrips] : [])}
          setPickedCantrips={(val)=> updateLevel(activeLevel, { cantrips: val })}
          pickedSpells={Array.isArray(picks.spells) ? picks.spells : (picks.spells ? [picks.spells] : [])}
          setPickedSpells={(val)=> updateLevel(activeLevel, { spells: val })}
          abilityScores={abilityScores}
          preparedPicks={Array.isArray(picks.prepared) ? picks.prepared : (picks.prepared ? [picks.prepared] : [])}
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
          // Warlock — Eldritch Invocations cumulative selector
          allowedInvocations={(() => {
            try {
              const map = rule?.feature_rules?.eldritch_invocations?.count_by_level || {};
              const val = map[String(activeLevel)] ?? map[activeLevel];
              return Number(val || 0);
            } catch(_) { return 0; }
          })()}
          prevAllowedInvocations={(() => {
            try {
              const lvl = Math.max(1, Number(activeLevel) - 1);
              const map = rule?.feature_rules?.eldritch_invocations?.count_by_level || {};
              const val = map[String(lvl)] ?? map[lvl];
              return Number(val || 0);
            } catch(_) { return 0; }
          })()}
          aggInvocationsAll={(() => {
            const out = [];
            const seen = new Set();
            for (let i = 1; i <= activeLevel; i++) {
              const p = picksByLevel[i] || {};
              const arr = Array.isArray(p.invocations) ? p.invocations : (p.invocations ? [p.invocations] : []);
              arr.forEach((nm) => {
                const id = (nm && typeof nm === 'object') ? (nm.id || nm.name || nm) : nm;
                if (id == null || seen.has(id)) return;
                seen.add(id);
                out.push((typeof nm === 'object') ? (nm.id || nm.name || nm) : nm);
              });
            }
            return out;
          })()}
          onInvocationsChange={(list, max) => applyInvocationsCumulative(list, max)}
          extraCantrips={raceCantripsExtra}
          extraSpells={raceSpellsExtra}
          applyLevelPatch={(lvl, patch) => updateLevel(lvl, patch)}
        />

        <SubClassChoices
          addChoices={{ ...additionalChoicesForLevel, __race_feat_maneuvers: Array.isArray(raceFeatManeuvers) ? raceFeatManeuvers : [] }}
          level={activeLevel}
          picksByLevel={picksByLevel}
          applyLevelPatch={(lvl, patch) => updateLevel(lvl, patch)}
          // Provide proficient skills for expertise_skills special handling
          proficientSkills={aggregatedClassSkills}
          // Provide spell options for subclass spellcasting choices
          spellOptions={spellOptions}
          cantripOptions={cantripOptions}
        />

        {/* Subclass selection: show from choose level onwards (can still only pick at that level) */}
        {chooseSubclassLevel > 0 && Number(activeLevel) >= Number(chooseSubclassLevel) && (
          <SubclassStepper
            rule={rule}
            level={activeLevel}
            classSubclassId={picks.subclass_id || classSubclassId}
            setClassSubclassId={(val) => { updateLevel(activeLevel, { subclass_id: val }); setClassSubclassId(val); }}
            klassId={selectedKlassId}
            klassApiIndex={selectedKlassApiIndex}
            picksByLevel={picksByLevel}
          />
        )}

        {/* Features moved to independent left sidebar */}
      </div>
    </div>
  );
};

export default ClassLevelPlanner;
