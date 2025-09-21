"use client";

import { useState, useMemo } from "react";
import Select from "../UI/Select";
import Input from "../UI/Input";
import Button from "../UI/Button";
import ClassLevelPlanner from "./ClassLevelPlanner";
import styles from "../../_styles/character/CharacterForm.module.css";
import { useSubclasses } from "../../_hooks/useSubclasses";

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
  raceFeatManeuvers = [],
  backgroundProfs = [],
  // Navegação/validação
  onProceedToFinalize,
  onLevelUp,
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

  // Load subclasses to compute additional required choices for current level
  const { subclasses: apiSubclasses } = useSubclasses(selectedKlass?.id, klassRuleId);

  // Hit Die helpers
  const hitDieSides = () => {
    try {
      const raw = selectedKlass?.hit_die || 'd8';
      const m = String(raw).match(/(\d+)/);
      return m ? Number(m[1]) : 8;
    } catch (_) { return 8; }
  };
  const conMod = useMemo(() => {
    try { return Math.floor(((Number(abilityScores?.con)||10) - 10) / 2); } catch(_) { return 0; }
  }, [abilityScores]);
  const fixedHpGain = () => {
    const d = hitDieSides();
    return (Math.floor(d/2) + 1);
  };

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
      const toolNeed = Number(rule?.tool_proficiencies?.choose || rule?.tool_proficiencies?.tools?.choose || 0);
      const chooseTools = Math.max(instNeed, toolNeed);
      if (chooseTools > 0) {
        const count = Array.isArray(classInstrumentPicks) ? classInstrumentPicks.length : 0;
        if (count < chooseTools) reasons.push(`Ferramentas/Instrumentos: faltam ${chooseTools - count}`);
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

    // Require HP gain choice for current level (from level 2 onwards)
    if (curr >= 2) {
      const hp = row?.hp_gain;
      if (!(hp && (hp.method === 'fixed' || hp.method === 'roll'))) {
        reasons.push('HP do nível: escolha rolar o dado de vida ou valor fixo');
      }
    }

    // Additional subclass-driven choices (languages/tools/instruments/skills/fighting_style/maneuvers) for this level
    try {
      const chosen = row?.subclass_id || classSubclassId;
      if (chosen) {
        const hit = (apiSubclasses || []).find(s => String(s.id) === String(chosen));
        const map = hit?.additional_choices_by_level || {};
        const add = map[String(curr)] || map[curr] || {};
        // languages
        if (add.languages?.choose > 0) {
          const need = Number(add.languages.choose) || 0;
          const val = row?.languages || [];
          const arr = Array.isArray(val) ? val : (val ? [val] : []);
          if (arr.length < need) reasons.push(`Idiomas: faltam ${need - arr.length}`);
        }
        // skills/tools/instruments
        ['skills','tools','instruments'].forEach((k) => {
          const conf = add[k];
          if (conf?.choose > 0) {
            const need = Number(conf.choose) || 0;
            const val = row?.[k] || [];
            const arr = Array.isArray(val) ? val : (val ? [val] : []);
            if (arr.length < need) reasons.push(`${k}: faltam ${need - arr.length}`);
          }
        });
        // maneuvers (Battle Master)
        if (add.maneuvers?.choose > 0) {
          const need = Number(add.maneuvers.choose) || 0;
          const val = row?.maneuvers || [];
          const arr = Array.isArray(val) ? val : (val ? [val] : []);
          if (arr.length < need) reasons.push(`Manobras: faltam ${need - arr.length}`);
        }
        // fighting_style
        if (add.fighting_style?.choose > 0) {
          const need = Number(add.fighting_style.choose) || 0;
          const chosenFs = row?.fighting_style || classFightingStyle;
          const arr = Array.isArray(chosenFs) ? chosenFs : (chosenFs ? [chosenFs] : []);
          if (arr.length < need) reasons.push(`Estilo de Luta: faltam ${need - arr.length}`);
        }

        // Generic additional keys (e.g., totem_spirit, beast_aspect, totemic_attunement)
        Object.entries(add || {}).forEach(([key, conf]) => {
          if (['languages','skills','tools','instruments','fighting_style','cantrips','spells'].includes(key)) return;
          const choose = Number(conf?.choose || 0);
          if (choose > 0) {
            const val = row?.[key] || [];
            const arr = Array.isArray(val) ? val : (val ? [val] : []);
            if (arr.length < choose) {
              const labelMap = { totem_spirit: 'Totem Espiritual', beast_aspect: 'Aspecto da Besta', totemic_attunement: 'Sintonização Totêmica' };
              const label = labelMap[key] || key;
              reasons.push(`${label}: faltam ${choose - arr.length}`);
            }
          }
        });
      }
    } catch (_) {}

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

    // Pré-requisitos de feats (se ASI do nível for feat)
    try {
      const asi = row?.asi;
      if (asi && asi.mode === 'feat' && (asi.featId || asi.featName)) {
        const fid = asi.featId || asi.featName;
        const lower = (k) => Number(abilityScores?.[k] || 0);
        const hasArmor = (cat) => {
          const set = new Set();
          (rule?.armor_proficiencies || []).forEach((v)=>{
            const t = String(v||'').toLowerCase();
            if (t.includes('leve') || t.includes('light')) set.add('light');
            if (t.includes('média') || t.includes('media') || t.includes('medium')) set.add('medium');
            if (t.includes('pesad') || t.includes('heavy')) set.add('heavy');
            if (t.includes('escudo') || t.includes('shield')) set.add('shields');
          });
          return set.has(cat);
        };
        const hasCasting = Boolean(rule?.spellcasting);
        let err = null;
        if (['adepto_elemental','conjurador_de_batalha','sniper_magico','magico_iniciante'].includes(fid) && !hasCasting) err = 'requer conjuração';
        if (fid === 'observador' && lower('wis') < 13) err = 'SAB 13';
        if (fid === 'duelista_defensivo' && lower('dex') < 13) err = 'DES 13';
        if (fid === 'sorrateiro' && lower('dex') < 13) err = 'DES 13';
        if (fid === 'lider_inspirador' && lower('cha') < 13) err = 'CAR 13';
        if (fid === 'imobilizador' && lower('str') < 13) err = 'FOR 13';
        if (fid === 'conjurador_de_ritual' && (lower('int') < 13 && lower('wis') < 13)) err = 'INT 13 ou SAB 13';
        if (fid === 'maestria_em_armadura_media' && !hasArmor('medium')) err = 'proficiência: armadura média';
        if (fid === 'maestria_em_armadura_pesada' && !hasArmor('heavy')) err = 'proficiência: armadura pesada';
        if (fid === 'protecao_moderada' && !hasArmor('light')) err = 'proficiência: armadura leve';
        if (fid === 'protecao_pesada' && !hasArmor('medium')) err = 'proficiência: armadura média';
        if (err) reasons.push(`Pré-requisito do talento não atendido (${err})`);
      }
    } catch (_) {}

    return { ok: reasons.length === 0, reasons };
  }, [rule, klassId, level, classPicksByLevel, classSkillPicks, classInstrumentPicks, classFightingStyle, classSubclassId, klassLevels, apiSubclasses]);

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
                onClick={async () => {
                  console.log('🔍 Level Up button clicked');
                  console.log('🔍 canLevelUp():', canLevelUp());
                  console.log('🔍 getLevelUpErrors():', getLevelUpErrors());
                  console.log('🔍 local canLevelUpInfo:', canLevelUpInfo);
                  console.log('🔍 disabled state:', !canLevelUp() || Number(level) >= 20);
                  try { if (onLevelUp) await onLevelUp(); } catch (e) { console.warn('Falha ao salvar rascunho de Level Up', e); }
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

          {/* HP gain for current level (from 2+) */}
          {!!klassId && Number(level) >= 2 && (
            <div className={styles.panel} style={{ marginTop: 8 }}>
              <div className={styles.panelTitle}>Pontos de Vida deste nível</div>
              {(() => {
                const d = hitDieSides();
                const avg = fixedHpGain();
                const row = (classPicksByLevel || {})[Number(level)] || {};
                const hp = row.hp_gain || null;
                const setHp = (obj) => {
                  const curr = Number(level) || 1;
                  const next = { ...(classPicksByLevel || {}) };
                  next[curr] = { ...(next[curr] || {}), hp_gain: obj };
                  setClassPicksByLevel && setClassPicksByLevel(next);
                };
                return (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button type="button" variant="secondary" onClick={() => setHp({ method: 'fixed', die: d, value: avg, total: avg + conMod })}>
                      Fixo {avg} {conMod >= 0 ? `+${conMod}` : conMod} = {avg + conMod}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => { const roll = Math.max(1, Math.ceil(Math.random()*d)); setHp({ method: 'roll', die: d, value: roll, total: roll + conMod }); }}>
                      Rolar d{d} + {conMod >= 0 ? `+${conMod}` : conMod}
                    </Button>
                    {hp && (
                      <div className={styles.small}>
                        Escolha atual: {hp.method === 'fixed' ? `Fixo ${hp.value}` : `Rolou ${hp.value}`} {conMod >= 0 ? `+${conMod}` : conMod} = <strong>{hp.total}</strong>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

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
          raceFeatManeuvers={raceFeatManeuvers}
          backgroundProfs={backgroundProfs}
          raceSkillProfs={raceLockedSkillIds}
        />
      )}

      {/* Navigation is now handled by StepTabs component */}
    </div>
  );
};

export default ClassStepper;
