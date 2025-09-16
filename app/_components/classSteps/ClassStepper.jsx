"use client";

import { useState, useMemo } from "react";
import Select from "../UI/Select";
import Input from "../UI/Input";
import Button from "../UI/Button";
import ClassLevelPlanner from "./ClassLevelPlanner";
import styles from "../../_styles/character/CharacterForm.module.css";

const ClassStepper = ({
  klasses,
  classRules,
  dicts,
  klassLevels = [],
  klassId, setKlassId,
  level, setLevel,
  classSkillPicks, setClassSkillPicks,
  classInstrumentPicks, setClassInstrumentPicks,
  classFightingStyle, setClassFightingStyle,
  pickedCantrips, setPickedCantrips,
  pickedSpells, setPickedSpells,
  classSubclassId, setClassSubclassId,
  cantripOptions, spellOptions, spellCatalog,
  CLASS_NAME_MAP,
  asiChoice, setAsiChoice,
  classPicksByLevel, setClassPicksByLevel,
  excludeSkillIds = [],
  abilityScores = { str:10, dex:10, con:10, int:10, wis:10, cha:10 },
  raceCantripsExtra = [],
  raceSpellsExtra = [],
  raceLockedSkillIds = [],
  raceSelectedFeatId = null,
  backgroundProfs = [],
  // Navegação/validação
  onProceedToFinalize,
  onCancel,
  onBack,
  showBack = true,
  attributesReady = true,
  canLevelUp = () => true, // Função de validação externa
  getLevelUpErrors = () => [], // Função para obter mensagens de erro
}) => {
  const [subStep, setSubStep] = useState(0);

  console.log('🔍 ClassStepper - canLevelUp type:', typeof canLevelUp);
  console.log('🔍 ClassStepper - getLevelUpErrors type:', typeof getLevelUpErrors);
  console.log('🔍 ClassStepper - canLevelUp result:', canLevelUp());
  console.log('🔍 ClassStepper - getLevelUpErrors result:', getLevelUpErrors());

  const selectedKlass = klasses.find(k => String(k.id) === String(klassId));
  const klassRuleId = selectedKlass?.api_index || (selectedKlass ? CLASS_NAME_MAP[selectedKlass.name] : null);
  const rule = klassRuleId ? classRules[klassRuleId] : null;

  const canLevelUpInfo = useMemo(() => {
    const reasons = [];
    if (!rule || !klassId) return { ok: false, reasons: ['Selecione uma classe'] };
    const curr = Number(level) || 1;
    const per = (classPicksByLevel || {});
    const row = per[curr] || {};

    if (curr >= 1) {
      const needSkills = Number(rule?.skill_proficiencies?.choose || 0);
      if (needSkills > 0) {
        const count = Array.isArray(classSkillPicks) ? classSkillPicks.length : 0;
        if (count < needSkills) reasons.push(`Perícias da classe: faltam ${needSkills - count}`);
      }
      const instNeed = Number(rule?.tool_proficiencies?.instruments?.choose || 0);
      if (instNeed > 0) {
        const count = Array.isArray(classInstrumentPicks) ? classInstrumentPicks.length : 0;
        if (count < instNeed) reasons.push(`Instrumentos: faltam ${instNeed - count}`);
      }
    }

    const reqMap = (rule?.required_choices_at_level || {})[String(curr)] || {};
    Object.entries(reqMap).forEach(([key, conf]) => {
      const need = Number(conf?.choose || 0);
      const topFallback = (key === 'fighting_style') ? (classFightingStyle ? [classFightingStyle] : []) : [];
      const chosen = row?.[key] || topFallback;
      const arr = Array.isArray(chosen) ? chosen : (chosen ? [chosen] : []);
      if (need > 0 && arr.length < need) {
        const label = key === 'fighting_style' ? 'Estilo de Luta' : key;
        reasons.push(`${label}: faltam ${need - arr.length}`);
      }
    });

    const subLvl = Number(rule?.subclass?.choose_level || 0);
    if (subLvl > 0 && curr >= subLvl) {
      const chosen = row?.subclass_id || classSubclassId;
      if (!chosen) reasons.push(`Subclasse: escolha obrigatória no nível ${subLvl}`);
    }

    const lvlRow = (klassLevels || []).find((cl) => Number(cl.level) === curr) || {};
    const prevRow = (klassLevels || []).find((cl) => Number(cl.level) === (curr - 1)) || {};
    const canAt = Number(lvlRow?.spellcasting?.cantrips_known ?? (curr === 1 ? (rule?.spellcasting?.cantrips_known_at_1 || 0) : 0)) || 0;
    const canPrev = Number(prevRow?.spellcasting?.cantrips_known || 0) || 0;
    const canGrant = Math.max(0, canAt - canPrev);
    if (canGrant > 0) {
      const picked = Array.isArray(row?.cantrips) ? row.cantrips.length : 0;
      if (picked < canGrant) reasons.push(`Truques: escolha ${canGrant} (faltam ${canGrant - picked})`);
    }
    const totalKnown = (lvlRow?.spellcasting && lvlRow.spellcasting.spells_known != null) ? Number(lvlRow.spellcasting.spells_known) : null;
    const prevKnown = (prevRow?.spellcasting && prevRow.spellcasting.spells_known != null) ? Number(prevRow.spellcasting.spells_known) : null;
    const knownGrant = (totalKnown != null && prevKnown != null) ? Math.max(0, totalKnown - prevKnown) : 0;
    if (knownGrant > 0) {
      const picked = Array.isArray(row?.spells) ? row.spells.length : 0;
      if (picked < knownGrant) reasons.push(`Magias conhecidas: escolha ${knownGrant} (faltam ${knownGrant - picked})`);
    }

    return { ok: reasons.length === 0, reasons };
  }, [rule, klassId, level, classPicksByLevel, classSkillPicks, classInstrumentPicks, classFightingStyle, classSubclassId, klassLevels]);

  // Navigation is now handled by StepTabs component

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>Configuração de Classe</div>
      <div className={styles.stepperNav} />

      {subStep === 0 && (
        <div className={styles.stepContent}>
          {Array.isArray(backgroundProfs) && backgroundProfs.length > 0 && (
            <div className={styles.small} style={{ marginBottom: 8 }}>
              Proficiências do Background: {backgroundProfs.map((s)=> (s?.name || s)).join(', ')}
            </div>
          )}

          <label className={styles.label}>Classes:</label>
          <Select
            placeholder="Selecione a classe"
            options={klasses}
            value={klassId}
            onChange={(val)=>{
              setKlassId(val);
              setClassSubclassId(null);
              setClassSkillPicks([]);
              setClassInstrumentPicks([]);
              setClassFightingStyle(null);
              setPickedCantrips([]);
              setPickedSpells([]);
              setAsiChoice(null);
              setClassPicksByLevel && setClassPicksByLevel({});
              setSubStep(0);
            }}
          />

          <div className={styles.levelControls}>
            <div className={styles.levelDisplay}>Nível atual: {level}</div>
            <div className={styles.levelButtons}>
              <Button
                type="button"
                variant="secondary"
                disabled={Number(level) <= 1}
                onClick={() => {
                  const curr = Number(level) || 1;
                  if (curr <= 1) return;
                  const next = { ...(classPicksByLevel || {}) };
                  delete next[curr];
                  try {
                    const subLvl = Number(rule?.subclass?.choose_level || 0);
                    if (subLvl > 0 && curr === subLvl) {
                      setClassSubclassId && setClassSubclassId(null);
                    }
                  } catch (_) {}
                  try {
                    setClassSkillPicks && setClassSkillPicks(next[1]?.skills || []);
                    setClassInstrumentPicks && setClassInstrumentPicks(next[1]?.instruments || []);
                  } catch (_) {}
                  try {
                    let fighting = null;
                    Object.keys(next).map(n=>Number(n)).sort((a,b)=>a-b).forEach(lvl => {
                      if (!fighting && next[lvl]?.fighting_style) fighting = next[lvl].fighting_style;
                    });
                    setClassFightingStyle && setClassFightingStyle(fighting || null);
                  } catch (_) {}
                  try {
                    const seenC = new Set();
                    const seenS = new Set();
                    const allC = [];
                    const allS = [];
                    Object.keys(next).forEach(k => {
                      const row = next[k] || {};
                      (row.cantrips || []).forEach(c => { const id = c.id || c; if (!seenC.has(id)) { seenC.add(id); allC.push(c); } });
                      (row.spells || []).forEach(s => { const id = s.id || s; if (!seenS.has(id)) { seenS.add(id); allS.push(s); } });
                      (row.prepared || []).forEach(s => { const id = s.id || s; if (!seenS.has(id)) { seenS.add(id); allS.push(s); } });
                    });
                    setPickedCantrips && setPickedCantrips(allC);
                    setPickedSpells && setPickedSpells(allS);
                  } catch (_) {}
                  setClassPicksByLevel && setClassPicksByLevel(next);
                  setLevel(Math.max(1, curr - 1));
                }}
                title={`Desfazer escolhas do nível ${level} e voltar para ${Math.max(1, Number(level||1)-1)}`}
              >
                Level Down
              </Button>
              <Button
                type="button"
                variant="highlight"
                disabled={!canLevelUpInfo.ok || !canLevelUp() || Number(level) >= 20}
                onClick={() => {
                  console.log('🔍 Level Up button clicked');
                  console.log('🔍 canLevelUp():', canLevelUp());
                  console.log('🔍 getLevelUpErrors():', getLevelUpErrors());
                  console.log('🔍 local canLevelUpInfo:', canLevelUpInfo);
                  console.log('🔍 disabled state:', !canLevelUp() || Number(level) >= 20);
                  setLevel(Math.min(20, Number(level || 1) + 1));
                }}
                title={(() => {
                  const ext = getLevelUpErrors() || [];
                  const loc = canLevelUpInfo.ok ? [] : (canLevelUpInfo.reasons || []);
                  const errs = [...ext, ...loc].filter(Boolean);
                  return errs.length ? errs.join('; ') : 'Subir 1 nível';
                })()}
              >
                Level Up
              </Button>
            </div>
          </div>

          {(!canLevelUp() || !canLevelUpInfo.ok) && (
            <div className={styles.requirementsSection}>
              <div className={styles.requirementsTitle}>Requisitos para Level Up:</div>
              <div className={styles.requirementsList} style={{ color: '#f99' }}>
                {[...(getLevelUpErrors() || []), ...(!canLevelUpInfo.ok ? (canLevelUpInfo.reasons || []) : [])].filter(Boolean).join('; ')}
              </div>
            </div>
          )}
          {!!klassId && !rule && (
            <div className={styles.small}>Carregando detalhes da classe…</div>
          )}
        </div>
      )}

      {!!rule && (
        <ClassLevelPlanner
          rule={rule}
          dicts={dicts}
          klassLevels={klassLevels}
          maxLevel={level}
          cantripOptions={cantripOptions}
          spellOptions={spellOptions}
          spellCatalog={spellCatalog}
          picksByLevel={classPicksByLevel || {}}
          setPicksByLevel={setClassPicksByLevel}
          setClassSkillPicks={setClassSkillPicks}
          setClassInstrumentPicks={setClassInstrumentPicks}
          setClassFightingStyle={setClassFightingStyle}
          setPickedCantrips={setPickedCantrips}
          setPickedSpells={setPickedSpells}
          classSubclassId={classSubclassId}
          setClassSubclassId={setClassSubclassId}
          abilityScores={abilityScores}
          klasses={klasses}
          excludeSkillIds={[...excludeSkillIds, ...raceLockedSkillIds]}
          raceCantripsExtra={raceCantripsExtra}
          raceSpellsExtra={raceSpellsExtra}
          raceSelectedFeatId={raceSelectedFeatId}
        />
      )}

      {/* Navigation is now handled by StepTabs component */}
    </div>
  );
};

export default ClassStepper;
