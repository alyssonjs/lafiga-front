"use client";

import { useState, useEffect, useMemo, useCallback, useReducer, useRef } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "../UI/Dialog";
import Select from "../UI/Select";
import Button from "../UI/Button";
import Input from "../UI/Input";
import LanguageSelect from "../common/LanguageSelect";
import { crudFor } from "../../_services/railsApi";
import { apiClient } from "../../_lib/api/client";
import { useAuth } from "../../_context/AuthContext";
import useWizard from "../../_hooks/useWizard";
import useRaceCatalogs from "../../_hooks/useRaceCatalogs";
import useClassCatalogs from "../../_hooks/useClassCatalogs";
import useBackgroundCatalog from "../../_hooks/useBackgroundCatalog";
import useAlignmentOptions from "../../_hooks/useAlignmentOptions";
import useSpellCatalog from "../../_hooks/useSpellCatalog";
import { RULE_NAME_MAP, computeAbilityBonuses as computeAbilityBonusesUtil } from "../../_lib/character/abilities";
import { areClassChoicesComplete as areClassChoicesCompleteUtil, getLevelUpErrors as getLevelUpErrorsUtil } from "../../_lib/character/classValidation";
import styles from "../../_styles/character/CharacterForm.module.css";
import AttributesSidePanel from "../characterSteps/AttributesSidePanel";
import RaceOptionsSwitch from "../races/RaceOptionsSwitch";
import RacePreview from "../races/RacePreview";
import SheetPreviewHeader from "./SheetPreviewHeader";
import AbilityMethodSection from "../characterSteps/AbilityMethodSection";
import ClassFinalSummary from "../characterSteps/ClassFinalSummary";
import ClassStepper from "../classSteps/ClassStepper";
import FeaturesSidebar from "../classSteps/FeaturesSidebar";
import StepEquipment from "../characterSteps/StepEquipment";
import StepTabs from "../characterSteps/StepTabs";
import ASISummaryPanel from "../classSteps/ASISummaryPanel";
import StepBackground from "../characterSteps/StepBackground";
import StepAlignment from "../characterSteps/StepAlignment";
import { Card, CardHeader, CardTitle, CardContent } from "../UI/Card";
import useSubclassEquipGrants from "../../_hooks/useSubclassEquipGrants";
import useRaceSpellExtras from "../../_hooks/useRaceSpellExtras";

const PlayerCharacterFormDialog = ({ character, isOpen, onClose, onSave, inline = false, initialStep = null }) => {
  const isEdit = Boolean(character);

  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [draftData, setDraftData] = useState({});
  const [draftCharId, setDraftCharId] = useState(null);
  const [subclassesForKlass, setSubclassesForKlass] = useState([]);
  const [wizardCantripOptions, setWizardCantripOptions] = useState([]);

  const CLASS_NAME_MAP = {
    'Bárbaro':'barbarian','Bardo':'bard','Clérigo':'cleric','Druida':'druid','Guerreiro':'fighter','Monge':'monk','Paladino':'paladin','Patrulheiro':'ranger','Ladino':'rogue','Feiticeiro':'sorcerer','Bruxo':'warlock','Mago':'wizard',
    'Cozinheiro': 'cozinheiro'
  };

  // Removed local class id/subclass id; use wizardState.klass
  // Removed local level; use wizardState.klass.level

  const [str, setStr] = useState(10);
  const [dex, setDex] = useState(10);
  const [con, setCon] = useState(10);
  const [intA, setIntA] = useState(10);
  const [wis, setWis] = useState(10);
  const [cha, setCha] = useState(10);
  // Método de atributos (agora focado em rolagem 4d6)

  // Catalog state placeholders (filled lazily by hooks later)
  const [races, setRaces] = useState([]);
  const [subRaces, setSubRaces] = useState([]);
  const [raceRules, setRaceRules] = useState({});
  const [raceTraitDefs, setRaceTraitDefs] = useState({});
  const [klasses, setKlasses] = useState([]);
  const [subKlasses, setSubKlasses] = useState([]);
  const [classRules, setClassRules] = useState({});
  const [classDicts, setClassDicts] = useState({});
  const [backgroundOptions, setBackgroundOptions] = useState([]);
  const [backgroundIndexMap, setBackgroundIndexMap] = useState({});

  // Catalog hooks moved below wizard init to use current step

  // Consolidated wizard state via reducer (slices)
  const initialWizardState = useMemo(() => ({
    race: {
      raceId: "",
      subRaceId: "",
      abilityMethod: 'roll_4d6',
      rolledScores: [],
      raceChoices: {},
      attributes: { str, dex, con, int: intA, wis, cha },
    },
    background: {
      backgroundKey: "",
      backgroundName: "",
      backgroundProfs: [],
      backgroundChoices: {},
      backgroundData: null,
    },
    klass: {
      klassId: "",
      classSubclassId: null,
      classSkillPicks: [],
      classInstrumentPicks: [],
      classFightingStyle: null,
      pickedCantrips: [],
      pickedSpells: [],
      asiChoice: null,
      classPicksByLevel: {},
      level: 1,
    },
    equipment: { equipmentPicks: [] },
    meta: {
      name: name || "",
      alignmentKey: "",
    },
  }), []);

  function wizardReducer(state, action) {
    switch (action.type) {
      case 'PATCH_RACE':
        return { ...state, race: { ...state.race, ...(action.payload || {}) } };
      case 'PATCH_BACKGROUND':
        return { ...state, background: { ...state.background, ...(action.payload || {}) } };
      case 'PATCH_KLASS':
        return { ...state, klass: { ...state.klass, ...(action.payload || {}) } };
      case 'PATCH_EQUIPMENT':
        return { ...state, equipment: { ...state.equipment, ...(action.payload || {}) } };
      case 'PATCH_META':
        return { ...state, meta: { ...state.meta, ...(action.payload || {}) } };
      case 'RESET':
        return initialWizardState;
      default:
        return state;
    }
  }

  const [wizardState, dispatchWizard] = useReducer(wizardReducer, initialWizardState);

  // Wrapper setters: update local state (legacy paths) and reducer (single source)
  const setRaceIdW = useCallback((v) => { dispatchWizard({ type: 'PATCH_RACE', payload: { raceId: v } }); }, [dispatchWizard]);
  const setSubRaceIdW = useCallback((v) => { dispatchWizard({ type: 'PATCH_RACE', payload: { subRaceId: v } }); }, [dispatchWizard]);
  const setRaceChoicesW = useCallback((patch) => {
    const next = typeof patch === 'function' ? patch(wizardState.race.raceChoices || {}) : patch;
    dispatchWizard({ type: 'PATCH_RACE', payload: { raceChoices: next } });
  }, [dispatchWizard, wizardState.race.raceChoices]);
  const setAbilityMethodW = useCallback((v) => { dispatchWizard({ type: 'PATCH_RACE', payload: { abilityMethod: v } }); }, [dispatchWizard]);
  const setRolledScoresW = useCallback((arr) => { dispatchWizard({ type: 'PATCH_RACE', payload: { rolledScores: arr } }); }, [dispatchWizard]);
  const setStrW  = useCallback((v)=>{ setStr(v);  dispatchWizard({ type:'PATCH_RACE', payload:{ attributes:{ ...wizardState.race.attributes, str: v } } }); }, [dispatchWizard, wizardState.race.attributes]);
  const setDexW  = useCallback((v)=>{ setDex(v);  dispatchWizard({ type:'PATCH_RACE', payload:{ attributes:{ ...wizardState.race.attributes, dex: v } } }); }, [dispatchWizard, wizardState.race.attributes]);
  const setConW  = useCallback((v)=>{ setCon(v);  dispatchWizard({ type:'PATCH_RACE', payload:{ attributes:{ ...wizardState.race.attributes, con: v } } }); }, [dispatchWizard, wizardState.race.attributes]);
  const setIntW  = useCallback((v)=>{ setIntA(v); dispatchWizard({ type:'PATCH_RACE', payload:{ attributes:{ ...wizardState.race.attributes, int: v } } }); }, [dispatchWizard, wizardState.race.attributes]);
  const setWisW  = useCallback((v)=>{ setWis(v);  dispatchWizard({ type:'PATCH_RACE', payload:{ attributes:{ ...wizardState.race.attributes, wis: v } } }); }, [dispatchWizard, wizardState.race.attributes]);
  const setChaW  = useCallback((v)=>{ setCha(v);  dispatchWizard({ type:'PATCH_RACE', payload:{ attributes:{ ...wizardState.race.attributes, cha: v } } }); }, [dispatchWizard, wizardState.race.attributes]);

  const setBackgroundKeyW = useCallback((v)=>{ setBackgroundKey(v); dispatchWizard({ type:'PATCH_BACKGROUND', payload:{ backgroundKey: v } }); }, [dispatchWizard]);
  const setBackgroundNameW = useCallback((v)=>{ setBackgroundName(v); dispatchWizard({ type:'PATCH_BACKGROUND', payload:{ backgroundName: v } }); }, [dispatchWizard]);
  const setBackgroundProfsW = useCallback((v)=>{ setBackgroundProfs(v); dispatchWizard({ type:'PATCH_BACKGROUND', payload:{ backgroundProfs: v } }); }, [dispatchWizard]);
  const setBackgroundChoicesW = useCallback((v)=>{ setBackgroundChoices(v); dispatchWizard({ type:'PATCH_BACKGROUND', payload:{ backgroundChoices: v } }); }, [dispatchWizard]);
  const setBackgroundDataW = useCallback((v)=>{ setBackgroundData(v); dispatchWizard({ type:'PATCH_BACKGROUND', payload:{ backgroundData: v } }); }, [dispatchWizard]);

  const setKlassIdW = useCallback((v)=>{ dispatchWizard({ type:'PATCH_KLASS', payload:{ klassId: v } }); }, [dispatchWizard]);
  const setClassSubclassIdW = useCallback((v)=>{ dispatchWizard({ type:'PATCH_KLASS', payload:{ classSubclassId: v } }); }, [dispatchWizard]);
  const setClassSkillPicksW = useCallback((v)=>{ dispatchWizard({ type:'PATCH_KLASS', payload:{ classSkillPicks: v } }); }, [dispatchWizard]);
  const setClassInstrumentPicksW = useCallback((v)=>{ dispatchWizard({ type:'PATCH_KLASS', payload:{ classInstrumentPicks: v } }); }, [dispatchWizard]);
  const setClassFightingStyleW = useCallback((v)=>{ dispatchWizard({ type:'PATCH_KLASS', payload:{ classFightingStyle: v } }); }, [dispatchWizard]);
  const setPickedCantripsW = useCallback((v)=>{
    const next = (typeof v === 'function') ? v(wizardState.klass?.pickedCantrips || []) : v;
    dispatchWizard({ type:'PATCH_KLASS', payload:{ pickedCantrips: next } });
  }, [dispatchWizard, wizardState.klass?.pickedCantrips]);
  const setPickedSpellsW = useCallback((v)=>{
    const next = (typeof v === 'function') ? v(wizardState.klass?.pickedSpells || []) : v;
    dispatchWizard({ type:'PATCH_KLASS', payload:{ pickedSpells: next } });
  }, [dispatchWizard, wizardState.klass?.pickedSpells]);
  const setAsiChoiceW = useCallback((v)=>{ dispatchWizard({ type:'PATCH_KLASS', payload:{ asiChoice: v } }); }, [dispatchWizard]);
  const setClassPicksByLevelW = useCallback((patch)=>{
    const curr = wizardState.klass?.classPicksByLevel || {};
    const next = (typeof patch === 'function') ? patch(curr) : patch;
    dispatchWizard({ type:'PATCH_KLASS', payload:{ classPicksByLevel: next } });
  }, [dispatchWizard, wizardState.klass?.classPicksByLevel]);
  const setLevelW = useCallback((v)=>{ dispatchWizard({ type:'PATCH_KLASS', payload:{ level: v } }); }, [dispatchWizard]);

  const setEquipmentPicksW = useCallback((v)=>{ dispatchWizard({ type:'PATCH_EQUIPMENT', payload:{ equipmentPicks: v } }); }, [dispatchWizard]);

  const setAlignmentKeyW = useCallback((v)=>{ setAlignmentKey(v); dispatchWizard({ type:'PATCH_META', payload:{ alignmentKey: v } }); }, [dispatchWizard]);
  const setNameW = useCallback((v)=>{ setName(v); dispatchWizard({ type:'PATCH_META', payload:{ name: v } }); }, [dispatchWizard]);

  const roll4d6DropLowest = () => {
    const dice = [1,2,3,4].map(() => (Math.floor(Math.random() * 6) + 1));
    const sorted = [...dice].sort((a,b)=>b-a);
    return sorted.slice(0,3).reduce((s,n)=>s+n,0);
  };
  const rollSixScores = () => {
    const vals = Array.from({length:6}, ()=> roll4d6DropLowest());
    setRolledScoresW(vals);
    setAbilityMethodW('roll_4d6');
    // limpa atribuições atuais para evitar conflito de valores iguais ao pool
    setStrW(0); setDexW(0); setConW(0); setIntW(0); setWisW(0); setChaW(0);
  };

  // Race/background specific choices (stored in sheet.metadata)
  const [backgroundName, setBackgroundName] = useState("");
  const [backgroundKey, setBackgroundKey] = useState("");
  const [backgroundDetails, setBackgroundDetails] = useState(null);
  const [alignmentKey, setAlignmentKey] = useState("");
  const { alignments, alignmentMap, alignmentDetails } = useAlignmentOptions(alignmentKey);
  const [backgroundProfs, setBackgroundProfs] = useState([]);
  const [backgroundChoices, setBackgroundChoices] = useState({ languages: [], gaming_set: [], instrument: [] });
  const [backgroundValid, setBackgroundValid] = useState(true);
  const [backgroundData, setBackgroundData] = useState(null);

  // Callback para validação do background
  const handleBackgroundValidation = useCallback((isValid, data) => {
    setBackgroundValid(isValid);
    setBackgroundData(data);
  }, []);

  const PROF_OPTIONS = [
    { id: 'athletics', name: 'Atletismo' },
    { id: 'acrobatics', name: 'Acrobacia' },
    { id: 'stealth', name: 'Furtividade' },
    { id: 'arcana', name: 'Arcanismo' },
    { id: 'history', name: 'História' },
    { id: 'investigation', name: 'Investigação' },
    { id: 'nature', name: 'Natureza' },
    { id: 'religion', name: 'Religião' },
    { id: 'animal-handling', name: 'Lidar com Animais' },
    { id: 'insight', name: 'Intuição' },
    { id: 'medicine', name: 'Medicina' },
    { id: 'perception', name: 'Percepção' },
    { id: 'survival', name: 'Sobrevivência' },
    { id: 'deception', name: 'Enganação' },
    { id: 'intimidation', name: 'Intimidação' },
    { id: 'performance', name: 'Atuação' },
    { id: 'persuasion', name: 'Persuasão' },
  ];

  // Effective class values (prefer wizardState; fall back to local)
  const effKlassId = wizardState.klass?.klassId;
  const effLevel = wizardState.klass?.level || 1;
  const effClassSubclassId = wizardState.klass?.classSubclassId;
  const effClassPicksByLevel = wizardState.klass?.classPicksByLevel || {};
  const effClassFightingStyle = wizardState.klass?.classFightingStyle || null;
  const effClassSkillPicks = wizardState.klass?.classSkillPicks || [];
  const effClassInstrumentPicks = wizardState.klass?.classInstrumentPicks || [];

  // Spells selection (known/prepared basic support)
  const { cantripOptions, spellOptions, spellCatalog, klassLevels } = useSpellCatalog(effKlassId, effClassSubclassId, effLevel);
  // Removed local pickedCantrips/pickedSpells/asiChoice; use wizardState.klass
  // Removed local classPicksByLevel; use wizardState.klass.classPicksByLevel
  // equipmentPicks now sourced from wizardState.equipment; local state removed
  // Removed local class picks and fighting style; use wizardState.klass
  // Subclass equip grants via hook
  const { armorCats: subclassArmorCats, weaponCats: subclassWeaponCats } = useSubclassEquipGrants({
    subclassId: effClassSubclassId,
    klassId: effKlassId,
    level: effLevel,
    subKlasses,
  });

  // Fetch subclasses for selected klass from API (always authoritative)
  useEffect(() => {
    (async () => {
      try {
        if (!effKlassId) { setSubclassesForKlass([]); return; }
        const res = await apiClient.get(`/api/v1/public/klasses/${effKlassId}/subclasses`);
        setSubclassesForKlass(res.subclasses || []);
      } catch (e) {
        // keep previous or empty on failure
      }
    })();
  }, [effKlassId]);

  // subclassNameById defined after catalogs are available (moved below)

  const characterCurrentStep = character && character.current_step != null
    ? Number(character.current_step)
    : null;

  const initialWizardStep = useMemo(() => {
    if (initialStep && Number(initialStep) > 0) return Number(initialStep);
    if (characterCurrentStep && Number(characterCurrentStep) > 0) {
      return Number(characterCurrentStep);
    }
    return 1;
  }, [initialStep, characterCurrentStep]);

  // Attributes assigned gating must be declared before step descriptors
  const attributesAssigned = (
    (wizardState.race?.abilityMethod || 'roll_4d6') !== 'roll_4d6' || (
      Array.isArray(wizardState.race?.rolledScores) && (wizardState.race.rolledScores || []).length === 6 &&
      [str, dex, con, intA, wis, cha].every(v => Number(v) > 0)
    )
  );

  // Selected race/subrace and race rules mapping must precede usages below
  const selectedRace = races.find(r=> String(r.id) === String(wizardState.race?.raceId));
  const selectedSubRace = subRaces.find(sr=> String(sr.id) === String(wizardState.race?.subRaceId));
  // Prefer API index from backend; fallback to RULE_NAME_MAP; ensure it exists in raceRules
  let ruleId = (selectedRace?.api_index) || RULE_NAME_MAP[selectedRace?.name] || null;
  if (ruleId && !raceRules?.[ruleId]) {
    const mapped = RULE_NAME_MAP[selectedRace?.name];
    if (mapped && raceRules?.[mapped]) ruleId = mapped;
  }
  const rule = ruleId ? raceRules[ruleId] : null;
  const subRuleId = (()=>{
    if(!rule || !selectedSubRace) return null;
    const name = (selectedSubRace.name||'').toLowerCase();
    if (selectedSubRace.api_index) return selectedSubRace.api_index;
    if(ruleId==='dwarf') return name.includes('montanha')? 'mountain' : name.includes('colina')? 'hill': null;
    if(ruleId==='elf') return name.includes('alto')? 'high' : name.includes('floresta')? 'wood' : name.includes('negro')? 'drow' : null;
    if(ruleId==='tiefling') return name.includes('abiss')? 'abissal' : (name.includes('cton')||name.includes('ctô'))? 'ctonico' : name.includes('infer')? 'infernal' : null;
    if(ruleId==='aarakocra') return name.includes('falc')? 'falconicos' : name.includes('noct')? 'nocturnos' : name.includes('cyps')? 'cypselanos' : null;
    if(ruleId==='gnome') return name.includes('floresta')? 'forest' : name.includes('rocha')? 'rock' : null;
    if(ruleId==='human') return name.includes('variante')? 'variant': null;
    if(ruleId==='halfling') return name.includes('leves')? 'lightfoot' : name.includes('robusto')? 'stout' : null;
    return null;
  })();

  // Build new draft schema using consolidated wizardState
  const buildDraftData = useCallback(() => {
    // Persist ruleId/subRuleId (api_index) para hidratação resiliente
    const raceWithKeys = {
      ...wizardState.race,
      ruleId: (typeof ruleId !== 'undefined' && ruleId) ? ruleId : (wizardState.race?.ruleId || null),
      subRuleId: (typeof subRuleId !== 'undefined' && subRuleId) ? subRuleId : (wizardState.race?.subRuleId || null),
    };
    return {
      race: raceWithKeys,
      background: { ...wizardState.background },
      klass: { ...wizardState.klass },
      equipment: { ...wizardState.equipment },
      meta: { ...wizardState.meta },
    };
  }, [wizardState, ruleId, subRuleId]);

  

  // Função para verificar se todas as escolhas obrigatórias da classe foram feitas
  const areClassChoicesComplete = useCallback(() => {
    if (!effKlassId || !classRules) return false;
    const klass = klasses.find(k => String(k.id) === String(effKlassId));
    if (!klass) return false;
    const klassApiIndex = klass.api_index || klass.name.toLowerCase();
    const rule = classRules[klassApiIndex];
    if (!rule) return false;
    const subclassLevel = rule.subclass?.choose_level;
    if (subclassLevel && Number(effLevel) >= subclassLevel && !effClassSubclassId) return false;
    const requiredChoices = rule.required_choices_at_level || {};
    for (let lvl = 1; lvl <= Number(effLevel); lvl++) {
      const levelChoices = requiredChoices[lvl];
      if (!levelChoices) continue;
      const row = (effClassPicksByLevel?.[lvl]) || {};
      for (const [choiceKey, config] of Object.entries(levelChoices)) {
        if (choiceKey === 'fighting_style') {
          const fs = row.fighting_style || effClassFightingStyle;
          if (!fs) return false;
          continue;
        }
        const need = Number(config?.choose || 1);
        const val = row?.[choiceKey];
        const arr = Array.isArray(val) ? val : (val ? [val] : []);
        if (arr.length < need) return false;
      }
    }
    try {
      if (effClassSubclassId) {
        const sc = (subclassesForKlass || []).find((s) => String(s.id) === String(effClassSubclassId));
        const addReq = (sc && sc.additional_choices_by_level) || {};
        for (let lvl = 1; lvl <= Number(effLevel); lvl++) {
          const cfg = addReq[String(lvl)] || addReq[lvl];
          if (!cfg) continue;
          const row = (effClassPicksByLevel?.[lvl]) || {};
          for (const [choiceKey, conf] of Object.entries(cfg)) {
            const need = Number(conf?.choose || 1);
            const v = row?.[choiceKey];
            const arr = Array.isArray(v) ? v : (v ? [v] : []);
            if (arr.length < need) return false;
          }
        }
      }
    } catch (_) {}
    return true;
  }, [
    effKlassId,
    classRules,
    klasses,
    effLevel,
    effClassSubclassId,
    effClassPicksByLevel,
    effClassFightingStyle,
    subclassesForKlass,
  ]);

  // Erros de level-up (via util)
  const getLevelUpErrors = useCallback(() => (
    getLevelUpErrorsUtil({
      klassId: effKlassId,
      classRules,
      klasses,
      level: effLevel,
      classSubclassId: effClassSubclassId,
      classPicksByLevel: effClassPicksByLevel,
      classFightingStyle: effClassFightingStyle,
      subclassesForKlass,
    })
  ), [effKlassId, classRules, klasses, effLevel, effClassSubclassId, effClassPicksByLevel, effClassFightingStyle, subclassesForKlass]);

  // Função para verificar se o level up pode ser feito
  const canLevelUp = useCallback(() => {
    const errors = getLevelUpErrors();
    // debug: canLevelUp errors suppressed in production
    return errors.length === 0;
  }, [getLevelUpErrors]);

  // Selected race/subrace and race rules mapping declared above

  // Fallback de hidratação: se vier ruleId/subRuleId no draft mas não houver ids do DB
  useEffect(() => {
    try {
      const r = wizardState.race || {};
      if (!r.raceId && r.ruleId && Array.isArray(races) && races.length > 0) {
        const hit = races.find((rc) => String((rc.api_index || RULE_NAME_MAP[rc.name] || '')).toLowerCase() === String(r.ruleId).toLowerCase());
        if (hit && hit.id) setRaceIdW(hit.id);
      }
    } catch (_) {}
  }, [wizardState.race?.raceId, wizardState.race?.ruleId, races]);

  useEffect(() => {
    try {
      const r = wizardState.race || {};
      if (r.raceId && !r.subRaceId && r.subRuleId && Array.isArray(subRaces) && subRaces.length > 0) {
        const list = subRaces.filter((sr) => String(sr.race_id) === String(r.raceId));
        const hit = list.find((sr) => String((sr.api_index || (sr.name || '')).toLowerCase()).includes(String(r.subRuleId).toLowerCase()));
        if (hit && hit.id) setSubRaceIdW(hit.id);
      }
    } catch (_) {}
  }, [wizardState.race?.raceId, wizardState.race?.subRuleId, wizardState.race?.subRaceId, subRaces]);

  const raceReady = (() => {
    if (!ruleId) return false;
    const subLangCount = (rule?.subraces && subRuleId && rule.subraces[subRuleId]?.languages?.choiceCount) ? rule.subraces[subRuleId].languages.choiceCount : 0;
    const baseLangCount = rule?.languages?.choiceCount || 0;
    const requiredLangCount = baseLangCount + subLangCount;
    const rc = wizardState.race?.raceChoices || {};
    const selectedLangBase = Array.isArray(rc?.extraLanguages) ? rc.extraLanguages.length : 0;
    const selectedLangHighElf = (ruleId === 'elf' && subRuleId === 'high' && rc?.highElfExtraLanguage) ? 1 : 0;
    const langOk = (selectedLangBase + selectedLangHighElf) >= requiredLangCount;
    switch (ruleId) {
      case 'dwarf':
        return !!rc?.dwarfTool && langOk;
      case 'elf':
        if (subRuleId === 'high') return !!rc?.highElfCantrip && langOk;
        return langOk;
      case 'human':
        if (subRuleId === 'variant') {
          const hv = rc?.variantHumanASI || null;
          if (!hv || !hv.mode) return false;
          if (hv.mode === 'attributes') {
            const attrs = Array.isArray(hv.attributes) ? hv.attributes : [];
            const uniq = Array.from(new Set(attrs));
            return uniq.length === 2 && langOk;
          }
          if (hv.mode === 'feat') {
            const ch = hv.choices || {};
            const featId = hv.featId || hv.featName || null;
            if (!featId) return false;
            if (String(featId) === 'resiliente') return (!!ch.ability && !!ch.saving_throws) && langOk;
            if (String(featId) === 'atleta') return (!!ch.ability) && langOk;
            if (String(featId) === 'magico_iniciante') {
              const canOk = Array.isArray(ch.cantrips) && ch.cantrips.length === 2;
              const spOk = Array.isArray(ch.spells) && ch.spells.length === 1;
              const clazzOk = !!ch.klass_id || !!ch.cantrip_class || !!ch.spell_class;
              return (!!ch.ability && clazzOk && canOk && spOk) && langOk;
            }
            return langOk;
          }
          return false;
        }
        return langOk;
      case 'half_elf': {
        const picks = Array.isArray(rc?.halfElfAbilityPicks) ? rc.halfElfAbilityPicks : [];
        const noCha = picks.every(p => (p?.id || p) !== 'CHA');
        return picks.length === 2 && noCha && Array.isArray(rc?.halfElfSkillPicks) && rc.halfElfSkillPicks.length === 2 && langOk;
      }
      case 'dragonborn':
        return !!rc?.draconicAncestry && langOk;
      default:
        return langOk;
    }
  })();

  const stepDescriptors = useMemo(
    () => [
      {
        id: 1,
        name: "Raça",
        canProceed: Boolean(wizardState.race?.raceId) && Boolean(raceReady) && attributesAssigned,
        snapshot: () => buildDraftData(),
      },
      {
        id: 2,
        name: "Antecedente",
        canProceed: Boolean(backgroundKey) && Boolean(backgroundValid),
        snapshot: () => buildDraftData(),
      },
      {
        id: 3,
        name: "Classe",
        canProceed: Boolean(effKlassId) && areClassChoicesComplete(),
        snapshot: () => buildDraftData(),
      },
      {
        id: 4,
        name: "Alinhamento",
        canProceed: Boolean(alignmentKey),
        snapshot: () => buildDraftData(),
      },
      {
        id: 5,
        name: "Equipamentos",
        canProceed: true,
        snapshot: () => buildDraftData(),
      },
      {
        id: 6,
        name: "Finalizar",
        canProceed: Boolean(name.trim()),
        snapshot: () => buildDraftData(),
      },
    ],
    [
      wizardState.race?.raceId,
      raceReady,
      attributesAssigned,
      backgroundKey,
      backgroundValid,
      effKlassId,
      areClassChoicesComplete,
      alignmentKey,
      name,
      buildDraftData,
    ]
  );

  const wizard = useWizard(stepDescriptors, initialWizardStep);
  const {
    steps: wizardSteps,
    currentStepId: wizardCurrentStepId,
    currentStepIndex: wizardCurrentStepIndex,
    isFirstStep: wizardIsFirstStep,
    isLastStep: wizardIsLastStep,
    goToStep: goToWizardStep,
    nextStep: advanceWizardStep,
    previousStep: retreatWizardStep,
    nextStepMeta,
  } = wizard;

  // Lazy-load catalogs per wizard step (now that wizardCurrentStepId exists)
  // Steps: 1=Raça, 2=Background, 3=Classe
  const raceCat = useRaceCatalogs(true); // race data is lightweight and used early
  const bgCat   = useBackgroundCatalog(wizardCurrentStepId >= 2);
  const classCat= useClassCatalogs(wizardCurrentStepId >= 3);

  // Values synced into local state below

  // Bridge hook results into local state so early consumers see defined vars
  useEffect(() => {
    try {
      setRaces(raceCat.races || []);
      setSubRaces(raceCat.subRaces || []);
      setRaceRules(raceCat.raceRules || {});
      setRaceTraitDefs(raceCat.raceTraitDefs || {});
    } catch(_) {}
  }, [raceCat.races, raceCat.subRaces, raceCat.raceRules, raceCat.raceTraitDefs]);

  useEffect(() => {
    try {
      setKlasses(classCat.klasses || []);
      setSubKlasses(classCat.subKlasses || []);
      setClassRules(classCat.classRules || {});
      setClassDicts(classCat.classDicts || {});
    } catch(_) {}
  }, [classCat.klasses, classCat.subKlasses, classCat.classRules, classCat.classDicts]);

  useEffect(() => {
    try {
      setBackgroundOptions(bgCat.backgroundOptions || []);
      setBackgroundIndexMap(bgCat.backgroundIndexMap || {});
    } catch(_) {}
  }, [bgCat.backgroundOptions, bgCat.backgroundIndexMap]);

  // Utility: subclass name by id (after catalogs available)
  const subclassNameById = useCallback((id) => {
    if (!id) return '';
    try {
      const hit = (subclassesForKlass || []).find(s => String(s.id) === String(id));
      if (hit && hit.name) return hit.name;
    } catch(_) {}
    try {
      const klass = klasses.find(k => String(k.id) === String(effKlassId));
      const ruleKey = (klass?.api_index) || CLASS_NAME_MAP[klass?.name] || '';
      const opts = (classRules[ruleKey]?.subclass?.options) || {};
      const o = Object.values(opts).find(x => String(x.id) === String(id));
      return o?.name || '';
    } catch(_) { return ''; }
  }, [subclassesForKlass, klasses, effKlassId, classRules]);

  const handleStepChange = useCallback(
    (stepId) => {
      goToWizardStep(stepId);
    },
    [goToWizardStep]
  );

  const stepDescriptorMap = useMemo(() => {
    const map = new Map();
    stepDescriptors.forEach((step) => map.set(step.id, step));
    return map;
  }, [stepDescriptors]);

  const currentStepConfig = stepDescriptorMap.get(wizardCurrentStepId) || stepDescriptors[0];

  const mergeDraftData = (base, delta) => {
    const d = { ...(base || {}) };
    Object.entries(delta || {}).forEach(([k, v]) => { d[k] = v; });
    return d;
  };

  // APIs needed by draft/save flows (ensure defined before callbacks that depend on them)
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const draftSaveTimerRef = useRef(null);
  const generalDraftTimerRef = useRef(null);
  const lastDraftSignatureRef = useRef(null);
  const { role } = useAuth();
  const charactersApi = useMemo(
    () => crudFor("characters", role),
    [role]
  );
  const sheetsApi = useMemo(() => crudFor("sheets", role), [role]);
  const sheetKlassesApi = useMemo(() => crudFor("sheet_klasses", role), [role]);
  const sheetItemsApi = useMemo(() => crudFor("sheet_items", role), [role]);

  // General auto-save for draft_data whenever wizard state changes (rolled scores, per-level picks, etc.)
  useEffect(() => {
    const data = buildDraftData();
    const signature = JSON.stringify({ step: wizardCurrentStepId, data });
    if (lastDraftSignatureRef.current === signature) return;
    if (generalDraftTimerRef.current) {
      clearTimeout(generalDraftTimerRef.current);
      generalDraftTimerRef.current = null;
    }
    generalDraftTimerRef.current = setTimeout(async () => {
      try {
        const payload = { status: 'draft', current_step: wizardCurrentStepId, draft_data: data };
        if (groupId) payload.group_id = Number(groupId);
        if (draftCharId) {
          await charactersApi.update(draftCharId, payload);
        } else {
          const res = await charactersApi.create(payload);
          const chr = res.character || res;
          if (chr && chr.id) setDraftCharId(chr.id);
        }
        lastDraftSignatureRef.current = signature;
      } catch (_) {
        // ignore auto-save errors
      }
    }, 700);
    return () => {
      if (generalDraftTimerRef.current) clearTimeout(generalDraftTimerRef.current);
      generalDraftTimerRef.current = null;
    };
  }, [buildDraftData, wizardCurrentStepId, draftCharId, charactersApi]);

  const saveDraft = useCallback(
    async (nextStepId, snapshotOverrideId = null) => {
      try {
        const newDraft = buildDraftData();
        const payload = {
          status: 'draft',
          current_step: nextStepId,
          draft_data: newDraft,
        };
        if (groupId) payload.group_id = Number(groupId);
        // Persist basic identity fields early when available
        if (name && String(name).trim().length > 0) {
          payload.name = String(name).trim();
        }
        const bgName = (backgroundName || background || '').trim();
        if (bgName.length > 0) {
          payload.background = bgName;
        }
        if (draftCharId) {
          await charactersApi.update(draftCharId, payload);
          setDraftData(newDraft);
        } else {
          const res = await charactersApi.create(payload);
          const chr = res.character || res;
          setDraftCharId(chr.id);
          setDraftData(newDraft);
        }
      } catch (e) {
        console.warn('Falha ao salvar rascunho:', e);
      }
    },
    [
      wizardCurrentStepId,
      buildDraftData,
      draftData,
      draftCharId,
      charactersApi,
    ]
  );

  // Auto-save identity fields on step 6 when user types name/background
  useEffect(() => {
    if (wizardCurrentStepId !== 6) return;
    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
      draftSaveTimerRef.current = null;
    }
    draftSaveTimerRef.current = setTimeout(async () => {
      try {
        const bgName = (backgroundName || background || '').trim();
        if ((name && name.trim().length > 0) || bgName.length > 0) {
          // Persist as draft at current step so the name is not lost
          const payload = {
            status: 'draft',
            current_step: 6,
            draft_data: buildDraftData(),
          };
          if (groupId) payload.group_id = Number(groupId);
          if (name && name.trim().length > 0) payload.name = name.trim();
          if (bgName.length > 0) payload.background = bgName;
          if (draftCharId) {
            await charactersApi.update(draftCharId, payload);
          } else {
            const res = await charactersApi.create(payload);
            const chr = res.character || res;
            if (chr && chr.id) setDraftCharId(chr.id);
          }
        }
      } catch (_) {}
    }, 600);
    return () => {
      if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
      draftSaveTimerRef.current = null;
    };
  }, [wizardCurrentStepId, name, backgroundName, background, draftCharId, charactersApi, buildDraftData]);

  // Salvar rascunho específico do nível atual (classe), sem avançar a etapa do wizard
  const saveLevelDraft = useCallback(async () => {
    await saveDraft(wizardCurrentStepId, 3);
  }, [saveDraft, wizardCurrentStepId]);

  const currentStepCanProceed = Boolean(currentStepConfig?.canProceed);

  const handleNext = useCallback(async () => {
    if (!currentStepCanProceed) return;
    if (wizardIsLastStep) {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
      return;
    }
    const nextMeta = nextStepMeta;
    const nextStepId = nextMeta?.id ?? wizardCurrentStepId;
    await saveDraft(nextStepId);
    if (nextMeta) {
      advanceWizardStep();
    }
  }, [
    currentStepCanProceed,
    wizardIsLastStep,
    nextStepMeta,
    wizardCurrentStepId,
    saveDraft,
    advanceWizardStep,
  ]);

  const handleBack = useCallback(() => {
    if (!wizardIsFirstStep) {
      retreatWizardStep();
    }
  }, [wizardIsFirstStep, retreatWizardStep]);

  useEffect(() => {
    setError(null);
    if (isEdit) {
      setDraftCharId(character?.id || null);
      setName(character?.name || "");
      setBackground(character?.background || "");
      setGroupId(character?.group_id || "");
      setUserId(character?.user_id || "");
      const status = String(character?.status || '');
      if (status === 'draft' && character?.draft_data) {
        try {
          const d = character.draft_data || {};
          setDraftData(d);
          // New schema support
          if (d.race || d.background || d.klass || d.equipment || d.meta) {
            const r = d.race || {};
            setRaceIdW(r.raceId || "");
            setSubRaceIdW(r.subRaceId || "");
            setAbilityMethodW(r.abilityMethod || 'roll_4d6');
            setRolledScoresW(Array.isArray(r.rolledScores) ? r.rolledScores : []);
            if (r.attributes) {
              setStr(r.attributes.str ?? 10);
              setDex(r.attributes.dex ?? 10);
              setCon(r.attributes.con ?? 10);
              setIntA(r.attributes.int ?? 10);
              setWis(r.attributes.wis ?? 10);
              setCha(r.attributes.cha ?? 10);
            }
            if (r.raceChoices) setRaceChoicesW(r.raceChoices);
            dispatchWizard({ type:'PATCH_RACE', payload: r });

            const bg = d.background || {};
            setBackgroundKey(bg.backgroundKey || "");
            setBackgroundName(bg.backgroundName || "");
            setBackgroundProfs(bg.backgroundProfs || []);
            setBackgroundChoices(bg.backgroundChoices || {});
            setBackgroundData(bg.backgroundData || null);
            dispatchWizard({ type:'PATCH_BACKGROUND', payload: bg });

            const k = d.klass || {};
            setKlassIdW(k.klassId || "");
            setLevelW(Number(k.level || 1));
            setClassSubclassIdW(k.classSubclassId || null);
            setClassSkillPicksW(k.classSkillPicks || []);
            setClassInstrumentPicksW(k.classInstrumentPicks || []);
            setClassFightingStyleW(k.classFightingStyle || null);
            setPickedCantripsW(k.pickedCantrips || []);
            setPickedSpellsW(k.pickedSpells || []);
            setClassPicksByLevelW(k.classPicksByLevel || {});
            dispatchWizard({ type:'PATCH_KLASS', payload: k });

            const eq = d.equipment || {};
            dispatchWizard({ type:'PATCH_EQUIPMENT', payload: { equipmentPicks: eq.equipmentPicks || [] } });
            dispatchWizard({ type:'PATCH_EQUIPMENT', payload: eq });

            const m = d.meta || {};
            if (m.alignmentKey) setAlignmentKey(m.alignmentKey);
            if (m.name) setName(m.name);
            dispatchWizard({ type:'PATCH_META', payload: m });
          }
          // Legacy schema fallback
          else if (d.step1) {
            setRaceIdW(d.step1.raceId || "");
            setSubRaceIdW(d.step1.subRaceId || "");
            setAbilityMethodW(d.step1.abilityMethod || 'roll_4d6');
            setRolledScoresW(Array.isArray(d.step1.rolledScores) ? d.step1.rolledScores : []);
            if (d.step1.attributes) {
              setStr(d.step1.attributes.str ?? 10);
              setDex(d.step1.attributes.dex ?? 10);
              setCon(d.step1.attributes.con ?? 10);
              setIntA(d.step1.attributes.int ?? 10);
              setWis(d.step1.attributes.wis ?? 10);
              setCha(d.step1.attributes.cha ?? 10);
            }
            if (d.step1.raceChoices) setRaceChoicesW(d.step1.raceChoices);
          }
          if (d.step2) {
            setBackgroundKey(d.step2.backgroundKey || "");
            setBackgroundName(d.step2.backgroundName || "");
            setBackgroundProfs(d.step2.backgroundProfs || []);
            setBackgroundChoices(d.step2.backgroundChoices || {});
            setBackgroundData(d.step2.backgroundData || null);
          }
          if (d.step3) {
            setKlassIdW(d.step3.klassId || "");
            setLevelW(Number(d.step3.level || 1));
            setClassSubclassIdW(d.step3.classSubclassId || null);
            setClassSkillPicksW(d.step3.classSkillPicks || []);
            setClassInstrumentPicksW(d.step3.classInstrumentPicks || []);
            setClassFightingStyleW(d.step3.classFightingStyle || null);
            setPickedCantripsW(d.step3.pickedCantrips || []);
            setPickedSpellsW(d.step3.pickedSpells || []);
            setClassPicksByLevelW(d.step3.classPicksByLevel || {});
          }
          if (d.step4) {
            setAlignmentKey(d.step4.alignmentKey || "");
          }
          if (d.step5) {
            dispatchWizard({ type:'PATCH_EQUIPMENT', payload: { equipmentPicks: d.step5.equipmentPicks || [] } });
          }
        } catch (_) {}
      } else {
        try {
          const sh = character.sheet || null;
          if (sh) {
            setRaceIdW(sh.race_id || "");
            setSubRaceIdW(sh.sub_race_id || "");
            setStr(sh.str || 10); setDex(sh.dex || 10); setCon(sh.con || 10); setIntA(sh.int || 10); setWis(sh.wis || 10); setCha(sh.cha || 10);
            const meta = sh.metadata || {};
            if (meta.background_key) setBackgroundKey(meta.background_key);
            if (meta.background) setBackgroundName(meta.background);
            if (meta.background_proficiencies) setBackgroundProfs(meta.background_proficiencies);
            if (meta.alignment?.index) setAlignmentKey(meta.alignment.index);
            if (meta.class_choices?.per_level) setClassPicksByLevelW(meta.class_choices.per_level);
            if (meta.class_summary?.current_level) setLevelW(Number(meta.class_summary.current_level));
            const mk = character.main_class || {};
            if (mk.id) setKlassIdW(mk.id);
            if (mk.subclass?.id) setClassSubclassIdW(mk.subclass.id);
          }
        } catch (_) {}
      }
    } else {
      setDraftCharId(null);
      setName("");
      setBackground("");
      setGroupId("");
      setUserId("");
      setRaceIdW("");
      setSubRaceIdW("");
      setKlassIdW("");
      setLevelW(1);
      setStr(10); setDex(10); setCon(10); setIntA(10); setWis(10); setCha(10);
      setDraftData({});
    }
  }, [isOpen, character, initialStep]);

  // Carregar cantrips de mago para Alto Elfo (sempre disponíveis)
  useEffect(() => {
    (async () => {
      try {
        if (!klasses?.length) return;
        const wizardKlass = klasses.find(k => k.api_index === 'wizard');
        if (!wizardKlass) return;
        const { spells = [] } = await apiClient.get(`/api/v1/public/spells?klass_id=${wizardKlass.id}`);
        const cantrips = spells.filter(s => (s.level || 0) === 0);
        setWizardCantripOptions(cantrips);
      } catch (e) {
        console.error('Falha ao carregar cantrips de mago', e);
      }
    })();
  }, [klasses]);

  // Spells and class levels are provided by useSpellCatalog(klassId, classSubclassId, level)

  // Initialize classPicksByLevel when class or level changes
  useEffect(() => {
    if (!effKlassId || !effLevel) return;

    const source = (wizardState.klass?.classPicksByLevel || {});
    const updated = { ...source };
    const currentLevel = Number(effLevel) || 1;
    for (let i = 1; i <= currentLevel; i++) {
      if (!updated[i]) {
        updated[i] = {
          skills: [],
          instruments: [],
          fighting_style: null,
          cantrips: [],
          spells: [],
          asi: { choices: {} },
          subclass_id: null,
          prepared: []
        };
      }
    }
      // debug: Initialized classPicksByLevel suppressed in production
    setClassPicksByLevelW(updated);
  }, [effKlassId, effLevel]);

  // Alignment data is provided by useAlignmentOptions(alignmentKey)

  const spellDict = useMemo(() => {
    const dict = {};
    const push = (arr=[]) => arr.forEach(s => { if(!s) return; const desc = Array.isArray(s.desc) ? s.desc.join('\n\n') : (s.desc || ''); dict[s.id] = { name: s.name, desc }; });
    push(spellCatalog);
    push(cantripOptions);
    push(spellOptions);
    push(wizardCantripOptions);
    return dict;
  }, [spellCatalog, cantripOptions, spellOptions, wizardCantripOptions]);

  // Cálculo de bônus de atributos a partir das regras (import util)
  const computeAbilityBonuses = computeAbilityBonusesUtil;

  
  // Get bonuses from feats based on actual choices
  const getFeatBonuses = (featName, choices = {}) => {
    const featMap = {
      'observador': { wis: 1, int: 1 },
      'duravel': { con: 1 },
      'resistente': { con: 1 },
      'sentinela': { str: 1, con: 1 },
      'resiliente': choices.ability ? { [String(choices.ability).toLowerCase()]: 1 } : {},
      'atleta': choices.ability ? { [String(choices.ability).toLowerCase()]: 1 } : {},
      'especialista_em_briga': choices.ability ? { [String(choices.ability).toLowerCase()]: 1 } : {},
      'especialista_em_armas': choices.ability ? { [choices.ability]: 1 } : {},
      'magico_iniciante': choices.ability ? { [choices.ability]: 1 } : {},
      'especialista_em_armadura': { str: 1 },
      'especialista_em_escudo': choices.ability ? { [choices.ability]: 1 } : {},
      // Novos ids normalizados conforme backend
      'protecao_leve': { str: 1 },
      'protecao_moderada': { str: 1 },
      'protecao_pesada': { str: 1 },
      'maestria_em_armadura_pesada': { str: 1 },
      'ator': { cha: 1 },
      'poliglota': { int: 1 }
    };
    return featMap[featName] || {};
  };

  // Regras especiais de feats relevantes para o preview (HP/Proficiências)
  const getFeatRuleEffects = (featId, choices = {}) => {
    const out = { hpPerLevel: 0, armorCats: [], weaponCats: [], speedFtBonus: 0 };
    switch (String(featId)) {
      case 'robusto':
        // +2 PV por nível (retroativo)
        out.hpPerLevel = 2;
        break;
      case 'mobilidade':
        // +10 ft de deslocamento (PHB Mobile)
        out.speedFtBonus = 10;
        break;
      case 'protecao_leve':
        out.armorCats.push('light');
        break;
      case 'protecao_moderada':
        out.armorCats.push('medium');
        out.armorCats.push('shields');
        break;
      case 'protecao_pesada':
        out.armorCats.push('heavy');
        break;
      case 'especialista_em_armas': {
        const picked = Array.isArray(choices?.weapons) ? choices.weapons : [];
        if (picked.some((x)=> String(x?.id||x).includes('arma_marcial'))) out.weaponCats.push('martial');
        if (picked.some((x)=> String(x?.id||x).includes('arma_simples'))) out.weaponCats.push('simple');
        break;
      }
      default:
        break;
    }
    return out;
  };

  // Agregar regras de todos os feats escolhidos até o nível atual
  const aggregatedFeatRules = useMemo(() => {
    const agg = { hpPerLevel: 0, armorCats: new Set(), weaponCats: new Set(), speedFtBonus: 0 };
    try {
      for (let i = 1; i <= Number(effLevel || 1); i++) {
        const row = (effClassPicksByLevel || {})[i] || {};
        const asi = row?.asi;
        if (asi && asi.mode === 'feat' && (asi.featId || asi.featName)) {
          const fid = asi.featId || asi.featName;
          const eff = getFeatRuleEffects(fid, asi.choices || {});
          agg.hpPerLevel += Number(eff.hpPerLevel || 0);
          agg.speedFtBonus += Number(eff.speedFtBonus || 0);
          (eff.armorCats || []).forEach((c)=> agg.armorCats.add(String(c)));
          (eff.weaponCats || []).forEach((c)=> agg.weaponCats.add(String(c)));
        }
      }
    } catch (_) {}
    return agg;
  }, [effClassPicksByLevel, effLevel]);

  // Aggregate ASI bonuses from per-level picks up to current level
  const ASI_MAP = { STR: 'str', DEX: 'dex', CON: 'con', INT: 'int', WIS: 'wis', CHA: 'cha' };
  const asiBonuses = useMemo(() => {
    const acc = { str:0, dex:0, con:0, int:0, wis:0, cha:0 };
    for (let i = 1; i <= Number(effLevel || 1); i++) {
      const p = (effClassPicksByLevel || {})[i];
      const asi = p?.asi;
      if (!asi) continue;
      if (asi.mode === 'attributes' && Array.isArray(asi.attributes)) {
        if (asi.attributes.length === 1) {
          const key = ASI_MAP[String(asi.attributes[0]).toUpperCase()] || String(asi.attributes[0]).toLowerCase();
          if (acc[key] != null) acc[key] += 2;
        } else {
          asi.attributes.slice(0,2).forEach((ab) => {
            const key = ASI_MAP[String(ab).toUpperCase()] || String(ab).toLowerCase();
            if (acc[key] != null) acc[key] += 1;
          });
        }
      } else if (asi.mode === 'feat' && (asi.featId || asi.featName)) {
        // Apply feat bonuses based on choices
        const featBonuses = getFeatBonuses(asi.featId || asi.featName, asi.choices || {});
        Object.entries(featBonuses).forEach(([key, bonus]) => {
          if (acc[key] != null) acc[key] += bonus;
        });
      }
    }
    return acc;
  }, [effClassPicksByLevel, effLevel]);
  const raceBonuses = computeAbilityBonuses(rule, subRuleId, (wizardState.race?.raceChoices || {}), selectedRace?.name, selectedSubRace?.name);
  const eff = (base, key) => {
    const raw = (Number(base)||0) + (raceBonuses[key]||0) + (asiBonuses[key]||0);
    return raw;
  };

  // Preview helpers (to approximate GenericClassPage header)
  const abilityMod = (score) => Math.floor(((Number(score)||10) - 10) / 2);

  // Collect cantrips and spells from feats
  const featCantrips = useMemo(() => {
    const cantrips = [];
    for (let i = 1; i <= Number(effLevel || 1); i++) {
      const p = (effClassPicksByLevel || {})[i];
      const asi = p?.asi;
      if (asi && asi.mode === 'feat' && asi.choices?.cantrips) {
        cantrips.push(...asi.choices.cantrips);
      }
    }
    return cantrips;
  }, [effClassPicksByLevel, effLevel]);

  const featSpells = useMemo(() => {
    const spells = [];
    for (let i = 1; i <= Number(effLevel || 1); i++) {
      const p = (effClassPicksByLevel || {})[i];
      const asi = p?.asi;
      if (asi && asi.mode === 'feat' && asi.choices?.spells) {
        spells.push(...asi.choices.spells);
      }
    }
    return spells;
  }, [effClassPicksByLevel, effLevel]);

  // Build maps to lookup spells by name across loaded catalogs
  const spellByName = useMemo(() => {
    const map = new Map();
    const push = (arr=[]) => arr.forEach((s) => { if(!s) return; const key = String(s.name || s.id || '').toLowerCase(); if (key) map.set(key, { id: s.id, name: s.name, level: s.level || 0 }); });
    push(wizardCantripOptions);
    push(cantripOptions);
    push(spellOptions);
    push(spellCatalog);
    return map;
  }, [wizardCantripOptions, cantripOptions, spellOptions, spellCatalog]);

  // Race innate spells (including subrace), filtered by current level
  const { raceInnateByLevel, raceCantripsExtraList, raceSpellsExtraList } = useRaceSpellExtras({
    rule,
    subRuleId,
    level: effLevel,
    spellByName,
    picks: wizardState.race?.raceChoices,
    wizardCantripOptions,
    cantripOptions,
    spellCatalog,
  });

  // Feat selecionado pela Raça (Humano Variante) para evitar duplicidade em escolhas de classe
  const raceSelectedFeatId = useMemo(() => {
    try {
      const hv = (wizardState.race?.raceChoices || {})?.variantHumanASI || null;
      if (hv && hv.mode === 'feat') return hv.featId || hv.featName || null;
      return null;
    } catch (_) { return null; }
  }, [wizardState.race]);

  // Manobras escolhidas no talento da Raça (Humano Variante → Adepto Marcial)
  const raceFeatManeuvers = useMemo(() => {
    try {
      const hv = (wizardState.race?.raceChoices || {})?.variantHumanASI || null;
      if (!hv || hv.mode !== 'feat') return [];
      const ch = hv.choices || {};
      const arr = ch.maneuvers || ch.manobras || [];
      return Array.isArray(arr) ? arr : [];
    } catch(_) { return []; }
  }, [wizardState.race]);

  // Classe selecionada
  const selectedKlass = klasses.find(k=>String(k.id)===String(effKlassId));
  const klassRuleId = selectedKlass?.api_index || (selectedKlass ? CLASS_NAME_MAP[selectedKlass.name] : null);
  const klassRule = klassRuleId ? classRules[klassRuleId] : null;
  const canChooseSubclass = klassRule?.subclass?.choose_level && Number(effLevel)>=Number(klassRule.subclass.choose_level);
  const classSkillsAll = (klassRule?.skill_proficiencies?.options === 'any') ? (classDicts.skills_all || []) : (klassRule?.skill_proficiencies?.options || []);

  // Preview (now that selectedKlass exists)
  const hpPreview = useMemo(() => {
    try {
      if (!selectedKlass || !effLevel) return null;
      const hdStr = selectedKlass.hit_die || 'd8';
      const hd = Number(String(hdStr).replace(/[^0-9]/g, '')) || 8;
      const conMod = abilityMod(eff(con, 'con'));
      const avg = Math.floor(hd / 2) + 1; // valor fixo padrão 5e
      let total = hd + conMod; // nível 1: máximo do dado + CON
      // Aplicar bônus de PV por nível vindos de feats (ex.: Robusto)
      const hpPerLevel = Number(aggregatedFeatRules?.hpPerLevel || 0);
      const upto = Number(effLevel) || 1;
      for (let i = 2; i <= upto; i++) {
        const row = (effClassPicksByLevel || {})[i] || {};
        const hp = row?.hp_gain;
        if (hp && typeof hp.total === 'number') {
          total += Number(hp.total) || 0;
        } else {
          // Fallback: usar média + CON para níveis sem escolha (edições antigas)
          total += (avg + conMod);
        }
        if (hpPerLevel) total += hpPerLevel;
      }
      return Math.max(1, total);
    } catch (_) { return null; }
  }, [selectedKlass, effLevel, con, raceBonuses, asiBonuses, effClassPicksByLevel, aggregatedFeatRules]);
  const acPreview = useMemo(() => {
    try {
      if (!selectedKlass) return null;
      const dexM = abilityMod(eff(dex,'dex'));
      const wisM = abilityMod(eff(wis,'wis'));
      const conM = abilityMod(eff(con,'con'));
      let acUnarmored = 10 + dexM;
      const kid = String(selectedKlass.api_index || '').toLowerCase();
      if (kid === 'barbarian' || String(selectedKlass.name||'').toLowerCase().includes('bárbaro')) {
        acUnarmored = 10 + dexM + conM;
      } else if (kid === 'monk' || String(selectedKlass.name||'').toLowerCase().includes('monge')) {
        acUnarmored = 10 + dexM + wisM;
      }
      // Consider equipped armor/shield from equipment picks
      const picks = wizardState.equipment?.equipmentPicks || [];
      const armor = picks.find(p => p.category === 'armor' && p.equipped);
      const shield = picks.find(p => p.category === 'shield' && p.equipped);
      if (armor && armor.props && armor.props.base != null) {
        const base = Number(armor.props.base);
        const allowDex = !!armor.props.dex_bonus;
        const maxDex = (armor.props.max_bonus != null) ? Number(armor.props.max_bonus) : null;
        const dexAdd = allowDex ? (maxDex != null ? Math.min(dexM, maxDex) : dexM) : 0;
        let ac = base + dexAdd;
        if (shield && shield.props?.ac_bonus) ac += Number(shield.props.ac_bonus);
        return ac;
      }
      return acUnarmored;
    } catch(_) { return null; }
  }, [selectedKlass, dex, con, wis, raceBonuses, asiBonuses, wizardState.equipment?.equipmentPicks]);

  // SheetPreviewHeader moved to its own component

  // Hook replaces previous effect fetching subclass grants

  // Allowed equipment categories derived from class proficiencies
  const allowedArmorCats = useMemo(() => {
    const out = new Set();
    const ap = klassRule?.armor_proficiencies || [];
    ap.forEach((v)=>{
      const t = String(v||'').toLowerCase();
      if (t.includes('leve') || t.includes('light')) out.add('light');
      if (t.includes('média') || t.includes('media') || t.includes('medium')) out.add('medium');
      if (t.includes('pesad') || t.includes('heavy')) out.add('heavy');
      if (t.includes('escudo') || t.includes('shield')) out.add('shields');
    });
    // Merge subclass grants (generic)
    (subclassArmorCats || []).forEach((c) => out.add(c));
    // Merge feat-derived armor/shield proficiencies
    try { (aggregatedFeatRules?.armorCats || new Set()).forEach((c)=> out.add(c)); } catch(_) {}
    // Subclass grants (Clérigo Domínios) — melhor-esforço na criação
    try {
      const isCleric = String(klassRule?.id || '').toLowerCase() === 'cleric';
      if (isCleric && effClassSubclassId && canChooseSubclass) {
        const scName = String(subclassNameById(effClassSubclassId) || '').toLowerCase();
        if (scName.includes('guerra') || scName.includes('war') || scName.includes('tempest')) {
          out.add('heavy');
        }
        if (scName.includes('vida') || scName.includes('life')) {
          out.add('heavy');
        }
      }
    } catch(_) {}
    return Array.from(out);
  }, [klassRule, effClassSubclassId, canChooseSubclass, subclassArmorCats, aggregatedFeatRules]);
  const allowedWeaponCats = useMemo(() => {
    const out = new Set();
    const wp = klassRule?.weapon_proficiencies || [];
    wp.forEach((v)=>{
      const t = String(v||'').toLowerCase();
      if (t.includes('armas simples') || t.includes('simple')) out.add('simple');
      if (t.includes('armas marciais') || t.includes('martial')) out.add('martial');
    });
    // Merge subclass grants (generic)
    (subclassWeaponCats || []).forEach((c) => out.add(c));
    // Merge feat-derived weapon proficiencies
    try { (aggregatedFeatRules?.weaponCats || new Set()).forEach((c)=> out.add(c)); } catch(_) {}
    // Subclass grants (Clérigo Domínios: Guerra/Tempestade → marciais)
    try {
      const isCleric = String(klassRule?.id || '').toLowerCase() === 'cleric';
      if (isCleric && effClassSubclassId && canChooseSubclass) {
        const scName = String(subclassNameById(effClassSubclassId) || '').toLowerCase();
        if (scName.includes('guerra') || scName.includes('war') || scName.includes('tempest')) {
          out.add('martial');
        }
      }
    } catch(_) {}
    return Array.from(out);
  }, [klassRule, effClassSubclassId, canChooseSubclass, subclassWeaponCats, aggregatedFeatRules]);

  const allowShortsword = useMemo(() => {
    try {
      const list = (klassRule?.weapon_proficiencies || []).map((v)=> String(v||'').toLowerCase());
      return list.some((s) => s.includes('espada curta') || s.includes('shortsword'));
    } catch(_) { return false; }
  }, [klassRule]);

  

  // Racial skill proficiencies (fixed + chosen via race options)
  const raceSkillProfIds = useMemo(() => {
    const ids = [];
    const addByName = (val) => {
      if (!val) return;
      const token = typeof val === 'string' ? val : (val.name || val.id || '');
      const opt = PROF_OPTIONS.find(o => o.name === token || o.id === token);
      if (opt) ids.push(opt.id);
    };
    if (rule) {
      const fixedBase = rule?.proficiencies?.skills?.fixed || [];
      fixedBase.forEach(addByName);
      const sub = subRuleId ? (rule.subraces || {})[subRuleId] : null;
      const fixedSub = sub?.proficiencies?.skills?.fixed || [];
      fixedSub.forEach(addByName);
    }
    const rc2 = wizardState.race?.raceChoices || {};
    if (Array.isArray(rc2?.halfElfSkillPicks)) rc2.halfElfSkillPicks.forEach(addByName);
    if (rc2?.variantHumanSkill) addByName(rc2.variantHumanSkill);
    return Array.from(new Set(ids));
  }, [rule, subRuleId, wizardState.race]);

  // Simple 27-point buy helper (8..15)
  const pointCost = (score) => ({8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9}[score] ?? 0);
  const totalPoints = 27;
  const ftToMeters = (ft) => Math.round(ft * 0.3048);

  // RacePreview moved to its own component

  function mergeProf(a,b){
    if(!a && !b) return {};
    const uniq = (arr=[]) => Array.from(new Set(arr.map((x)=> (x && x.name) ? x.name : x)));
    const toArr = (v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      if (typeof v === 'object') {
        if (Array.isArray(v.fixed)) return v.fixed;
        if (Array.isArray(v.choices)) return v.choices;
      }
      return [v];
    };
    const out = { };
    if(a?.weapons || b?.weapons) out.weapons = uniq([ ...toArr(a?.weapons), ...toArr(b?.weapons) ]);
    if(a?.armor || b?.armor) out.armor = uniq([ ...toArr(a?.armor), ...toArr(b?.armor) ]);
    if(a?.tools || b?.tools) out.tools = uniq([ ...toArr(a?.tools), ...toArr(b?.tools) ]);
    if(a?.instruments || b?.instruments) out.instruments = uniq([ ...toArr(a?.instruments), ...toArr(b?.instruments) ]);
    if(a?.skills || b?.skills) out.skills = uniq([ ...toArr(a?.skills), ...toArr(b?.skills) ]);
    return out;
  }
  const spentPoints = [str,dex,con,intA,wis,cha].reduce((sum,s)=>sum+pointCost(Math.max(8,Math.min(15,Number(s)||8))),0);
  const remainingPoints = totalPoints - spentPoints;

  


  const resetForm = () => {
    setName("");
    setBackground("");
    setGroupId("");
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (!wizardState.race?.raceId || !effKlassId) {
        setError("Selecione raça e classe.");
        return;
      }
      // New transactional flow: send single payload to backend provision endpoint
      const provisionPayload = {
        character: {
          id: (draftCharId || (isEdit ? character.id : null)),
          name,
          background: backgroundName || background,
          group_id: groupId ? +groupId : null,
          status: 'active'
        },
        wizard: buildDraftData(),
      };
      try {
        const rolePath = (role === 'admin' ? 'admin' : 'player');
        const provisionRes = await apiClient.post(`/api/v1/${rolePath}/characters/provision`, provisionPayload);
        const created = provisionRes.character || provisionRes;
        setSuccessMessage("Personagem criado com sucesso!");
        try {
          const id = created?.id || created?.character_id;
          const updatedChar = id ? await charactersApi.getOne(id) : created;
          onSave(updatedChar.character || updatedChar);
        } catch (e) {
          onSave(created);
        }
        resetForm();
        return; // stop legacy flow below
      } catch (err) {
        const apiErrs = err?.response?.data?.errors;
        if (Array.isArray(apiErrs) && apiErrs.length) {
          setError(apiErrs.join(', '));
        } else {
          setError(err.message || 'Erro ao criar personagem');
        }
        // Best-effort: persist name/background into draft to avoid losing identity on failure
        try {
          const bgName = (backgroundName || background || '').trim();
          if (draftCharId && (name?.trim() || bgName)) {
            await charactersApi.update(draftCharId, {
              status: 'draft',
              name: (name || '').trim() || undefined,
              background: bgName || undefined,
              current_step: wizardCurrentStepId,
              draft_data: buildDraftData(),
            });
          }
        } catch (_) {}
        return; // stop legacy flow on error
      }

    } catch (err) {
      setError(err.message);
    }
  };
  if (inline) {
    return (
      <Card disableHover className={styles.centeredForm} style={{ maxWidth: 1200, margin: '0 auto' }}>
        <CardHeader>
          <CardTitle>Criar Personagem</CardTitle>
        </CardHeader>
        <CardContent>
        <StepTabs
          steps={wizardSteps}
          currentStep={wizardCurrentStepIndex}
          onStepChange={handleStepChange}
          onCancel={onClose}
          onBack={handleBack}
          onNext={handleNext}
          canGoBack={!wizardIsFirstStep}
          canGoNext={currentStepCanProceed}
          nextLabel={wizardIsLastStep ? "Criar Personagem" : "Próximo"}
          showCancel={true}
          showBack={!wizardIsFirstStep}
          showNext={wizardCurrentStepId !== 5}
          nextDisabled={!currentStepCanProceed}
        />
        {((wizardState.race?.raceId) || effKlassId) && (
          <SheetPreviewHeader
            name={name}
            ac={acPreview}
            hp={hpPreview}
            initiative={abilityMod(eff(dex,'dex'))}
            level={effLevel}
            className={selectedKlass?.name}
            subclassName={effClassSubclassId ? (subclassNameById(effClassSubclassId) || '') : ''}
            speedFt={(() => {
              try {
                const sub = subRuleId ? (rule?.subraces || {})[subRuleId] : null;
                const sp = (sub && sub.speed) || rule?.speed;
                const n = Number(sp);
                const base = Number.isFinite(n) ? n : null;
                const bonus = Number(aggregatedFeatRules?.speedFtBonus || 0);
                const monkBonus = (() => {
                  try {
                    const kid = String(selectedKlass?.api_index || '').toLowerCase();
                    const nameL = String(selectedKlass?.name || '').toLowerCase();
                    if (kid !== 'monk' && !nameL.includes('monge')) return 0;
                    const L = Number(effLevel || 1);
                    if (L >= 18) return 30;
                    if (L >= 14) return 25;
                    if (L >= 10) return 20;
                    if (L >= 6) return 15;
                    if (L >= 2) return 10;
                    return 0;
                  } catch(_) { return 0; }
                })();
                const totalBonus = bonus + monkBonus;
                return base != null ? (base + totalBonus) : (totalBonus || null);
              } catch(_) { return null; }
            })()}
            proficiencies={(() => {
              try {
                const armor = (() => {
                  const out = new Set();
                  // From class/subclass/feats categories (only if a classe foi escolhida)
                  if (effKlassId) {
                    (allowedArmorCats || []).forEach((c)=>{
                      const t = String(c);
                      if (t === 'light') out.add('Armaduras Leves');
                      else if (t === 'medium') out.add('Armaduras Médias');
                      else if (t === 'heavy') out.add('Armaduras Pesadas');
                      else if (t === 'shields') out.add('Escudos');
                      else out.add(t);
                    });
                  }
                  // From race/subrace proficiencies
                  const toArr = (v) => {
                    if (!v) return [];
                    if (Array.isArray(v)) return v;
                    if (typeof v === 'object') {
                      if (Array.isArray(v.fixed)) return v.fixed;
                      if (Array.isArray(v.choices)) return v.choices;
                    }
                    return [v];
                  };
                  const sub = subRuleId ? (rule?.subraces || {})[subRuleId] : null;
                  const raceArmorArr = [
                    ...toArr(rule?.proficiencies?.armor),
                    ...toArr(sub?.proficiencies?.armor)
                  ].map((x)=> (x && x.name) ? x.name : String(x));
                  raceArmorArr.forEach((raw)=>{
                    const t = String(raw || '').toLowerCase();
                    if (!t) return;
                    if (t.includes('leve') || t === 'light') out.add('Armaduras Leves');
                    else if (t.includes('méd') || t.includes('medi') || t === 'medium') out.add('Armaduras Médias');
                    else if (t.includes('pesad') || t === 'heavy') out.add('Armaduras Pesadas');
                    else if (t.includes('escudo') || t === 'shields' || t === 'shield') out.add('Escudos');
                    else out.add(raw);
                  });
                  return Array.from(out);
                })();
                const weapons = (() => {
                  const out = new Set();
                  if (effKlassId) {
                    (allowedWeaponCats || []).forEach((c)=>{
                      const t = String(c);
                      if (t === 'simple') out.add('Armas Simples');
                      else if (t === 'martial') out.add('Armas Marciais');
                      else out.add(t);
                    });
                  }
                  const toArr = (v) => {
                    if (!v) return [];
                    if (Array.isArray(v)) return v;
                    if (typeof v === 'object') {
                      if (Array.isArray(v.fixed)) return v.fixed;
                      if (Array.isArray(v.choices)) return v.choices;
                    }
                    return [v];
                  };
                  const sub = subRuleId ? (rule?.subraces || {})[subRuleId] : null;
                  const raceWp = [
                    ...toArr(rule?.proficiencies?.weapons),
                    ...toArr(sub?.proficiencies?.weapons)
                  ].map((x)=> (x && x.name) ? x.name : String(x));
                  raceWp.forEach((w)=> out.add(w));
                  return Array.from(out);
                })();
                const tools = (() => {
                  const out = new Set();
                  const raceTools = (rule?.proficiencies?.tools?.fixed || []).map(String);
                  raceTools.forEach((t)=> out.add(t));
                  const rc = wizardState.race?.raceChoices || {};
                  if (rc.dwarfTool) out.add(String(rc.dwarfTool));
                  (Array.isArray(backgroundChoices?.gaming_set) ? backgroundChoices.gaming_set : []).forEach((t)=> out.add(String(t?.name||t)));
                  (Array.isArray(backgroundChoices?.instrument) ? backgroundChoices.instrument : []).forEach((t)=> out.add(String(t?.name||t)));
                  // Background tools estático
                  try {
                    const bg = (backgroundOptions || []).find(b => String(b.id) === String(backgroundKey));
                    const bgTools = (bg?.tools || []).flatMap((tool) => {
                      if (typeof tool === 'string') return [tool];
                      if (tool && typeof tool === 'object') {
                        const key = Object.keys(tool)[0];
                        const data = tool[key] || {};
                        const pick = (wizardState?.background?.backgroundChoices||{})?.[backgroundKey]?.tools?.[key];
                        if (pick) return [pick];
                        if (Array.isArray(data.fixed)) return data.fixed;
                        return [];
                      }
                      return [];
                    });
                    bgTools.forEach((t)=> out.add(String(t)));
                  } catch(_) {}
                  return Array.from(out);
                })();
                const languages = (() => {
                  const out = new Set();
                  try {
                    const bg = (backgroundOptions || []).find(b => String(b.id) === String(backgroundKey));
                    const langBlock = bg?.languages || null;
                    const picks = (wizardState?.background?.backgroundChoices||{})?.[backgroundKey]?.languages || [];
                    picks.forEach((l)=> out.add(String(l)));
                    if (Array.isArray(langBlock?.fixed)) langBlock.fixed.forEach((l)=> out.add(String(l)));
                    // Idiomas da raça
                    const always = (rule?.languages?.always || []);
                    always.forEach((l)=> out.add(String(l)));
                    const rc = wizardState.race?.raceChoices || {};
                    const extra = Array.isArray(rc?.extraLanguages) ? rc.extraLanguages.map((x)=> x?.name || x) : [];
                    extra.forEach((l)=> out.add(String(l)));
                    if (ruleId === 'elf' && subRuleId === 'high' && rc?.highElfExtraLanguage) {
                      out.add(String(rc.highElfExtraLanguage?.name || rc.highElfExtraLanguage));
                    }
                  } catch(_) {}
                  return Array.from(out);
                })();
                return { armor, weapons, tools, languages };
              } catch(_) { return { armor:[], weapons:[], tools:[], languages:[] }; }
            })()}
            raceLabel={`${selectedRace?.name || ''}${wizardState.race?.subRaceId ? ` / ${selectedSubRace?.name || ''}` : ''}`}
            backgroundLabel={backgroundName || background || ''}
          />
        )}
        <div className={styles.creationContainer}>
        {wizardCurrentStepId === 3 && (
          <FeaturesSidebar
            rule={klassRule}
            klassLevels={klassLevels}
            picksByLevel={wizardState.klass?.classPicksByLevel || {}}
            maxLevel={effLevel}
            raceCantripsExtra={raceCantripsExtraList}
            raceSpellsExtra={raceSpellsExtraList}
            subKlasses={subKlasses}
            selectedKlassId={selectedKlass?.id}
            spellDict={spellDict}
            classSubclassId={effClassSubclassId}
          />
        )}
        <form onSubmit={handleSubmit} className={`${styles.form} ${styles.mainColumn}`}>
          {error && <div className={styles.error}>{error}</div>}
          {successMessage && <div className={styles.success}>{successMessage}</div>}
          {wizardCurrentStepId === 1 && (
            <>
              <label className={styles.label}>Raça:</label>
              <Select placeholder="Selecione a raça" options={races} value={wizardState.race?.raceId || ""} onChange={(val)=>{setRaceIdW(val); setSubRaceIdW(""); setRaceChoicesW({});}} />
              <label className={styles.label}>Sub‑raça:</label>
              <Select placeholder="Selecione a sub‑raça" options={subRaces.filter(sr=>!(wizardState.race?.raceId) || String(sr.race_id)===String(wizardState.race?.raceId))} value={wizardState.race?.subRaceId || ""} onChange={(val)=>setSubRaceIdW(val)} disabled={!(wizardState.race?.raceId) || subRaces.filter(sr=>!(wizardState.race?.raceId) || String(sr.race_id)===String(wizardState.race?.raceId)).length === 0} />
              {/* Opções específicas por raça/sub‑raça */}
              <RaceOptionsSwitch
                ruleId={ruleId}
                subRuleId={subRuleId}
                picks={wizardState.race?.raceChoices || {}}
                setPicks={setRaceChoicesW}
                wizardCantripOptions={wizardCantripOptions}
                cantripOptions={cantripOptions}
                skillOptions={PROF_OPTIONS}
                klasses={klasses}
              />

              {rule && rule.languages && rule.languages.choiceCount > 0 && (
                <LanguageSelect
                  title={`Idiomas extras`}
                  options={(rule.languages.choiceList || ['Anão','Élfico','Halfling','Dracônico','Gnômico','Orc','Infernal']).filter(l=>!(rule.languages.always||[]).includes(l))}
                  value={wizardState.race?.raceChoices?.extraLanguages || []}
                  choose={rule.languages.choiceCount}
                  onChange={(ids)=>setRaceChoicesW({ ...(wizardState.race?.raceChoices || {}), extraLanguages: ids })}
                />
              )}

              {rule && (
                <div className={styles.panel} style={{marginTop: 12}}>
                  <div className={styles.panelTitle}>Resumo da Raça</div>
                  <RacePreview rule={rule} subRuleId={subRuleId} picks={wizardState.race?.raceChoices || {}} traitDefinitions={raceTraitDefs} />
                </div>
              )}

              {/* Método e pool de atributos */}
              <AbilityMethodSection
                abilityMethod={wizardState.race?.abilityMethod}
                rolledScores={wizardState.race?.rolledScores || []}
                onPickPointBuy={()=>{ setAbilityMethodW('point_buy'); setRolledScoresW([]); }}
                onPickRoll4d6={()=>{ setRolledScoresW([]); setAbilityMethodW('roll_4d6'); }}
                onPickStandardArray={()=>{ setAbilityMethodW('roll_4d6'); setRolledScoresW([15,14,13,12,10,8]); }}
                onRollSix={rollSixScores}
              />
            </>
          )}

        {wizardCurrentStepId === 3 && (
          <>
            <ClassStepper
              klasses={klasses}
              classRules={classRules}
              dicts={classDicts}
              klassLevels={klassLevels}
              klassId={effKlassId}
              setKlassId={setKlassIdW}
              level={effLevel}
              setLevel={(v)=>setLevelW(v)}
              classSkillPicks={effClassSkillPicks}
              setClassSkillPicks={setClassSkillPicksW}
              classInstrumentPicks={effClassInstrumentPicks}
              setClassInstrumentPicks={setClassInstrumentPicksW}
              classFightingStyle={effClassFightingStyle}
              setClassFightingStyle={setClassFightingStyleW}
              pickedCantrips={wizardState.klass?.pickedCantrips || []}
              setPickedCantrips={setPickedCantripsW}
              pickedSpells={wizardState.klass?.pickedSpells || []}
              setPickedSpells={setPickedSpellsW}
              classSubclassId={effClassSubclassId}
              setClassSubclassId={setClassSubclassIdW}
              cantripOptions={cantripOptions}
              spellOptions={spellOptions}
              spellCatalog={spellCatalog}
              CLASS_NAME_MAP={CLASS_NAME_MAP}
              asiChoice={wizardState.klass?.asiChoice}
              setAsiChoice={setAsiChoiceW}
              classPicksByLevel={effClassPicksByLevel}
              setClassPicksByLevel={setClassPicksByLevelW}
              excludeSkillIds={(backgroundProfs || []).map(s=> (typeof s==='string'? s : (s?.id || s?.name || '')))}
              raceCantripsExtra={raceCantripsExtraList}
              raceSpellsExtra={raceSpellsExtraList}
              raceLockedSkillIds={raceSkillProfIds}
              raceSelectedFeatId={raceSelectedFeatId}
              raceFeatManeuvers={raceFeatManeuvers}
              backgroundProfs={backgroundProfs}
              onLevelUp={async () => { await saveLevelDraft(); }}
              abilityScores={{
                str: eff(str,'str'),
                dex: eff(dex,'dex'),
                con: eff(con,'con'),
                int: eff(intA,'int'),
                wis: eff(wis,'wis'),
                cha: eff(cha,'cha')
              }}
              onCancel={onClose}
              onBack={() => goToWizardStep(2)}
              attributesReady={
                (wizardState.race?.abilityMethod !== 'roll_4d6') || (
                  Array.isArray(wizardState.race?.rolledScores) && (wizardState.race?.rolledScores).length === 6 &&
                  [str,dex,con,intA,wis,cha].every(v => Number(v) > 0)
                )
              }
              onProceedToFinalize={() => goToWizardStep(5)}
              canLevelUp={canLevelUp}
              getLevelUpErrors={getLevelUpErrors}
            />
            {/* ClassStepper controla a UI de classe/subclasse e magias */}
          </>
        )}

          {wizardCurrentStepId === 2 && (
            <StepBackground
              backgroundKey={backgroundKey}
              setBackgroundKey={setBackgroundKeyW}
              backgroundName={backgroundName}
              setBackgroundName={setBackgroundNameW}
              backgroundProfs={backgroundProfs}
              setBackgroundProfs={setBackgroundProfsW}
              backgroundOptions={backgroundOptions || []}
              backgroundIndexMap={backgroundIndexMap || {}}
              backgroundChoices={backgroundChoices}
              setBackgroundChoices={setBackgroundChoicesW}
              onValidationChange={handleBackgroundValidation}
            />
          )}

          {wizardCurrentStepId === 4 && (
            <StepAlignment
              alignmentKey={wizardState.meta?.alignmentKey}
              setAlignmentKey={setAlignmentKeyW}
              alignmentDetails={alignmentDetails}
              alignmentMap={alignmentMap}
              alignments={alignments}
            />
          )}

          {wizardCurrentStepId === 5 && (
            <StepEquipment
              allowedArmorCats={allowedArmorCats}
              allowedWeaponCats={allowedWeaponCats}
              allowShortsword={allowShortsword}
              picks={wizardState.equipment?.equipmentPicks || []}
              setPicks={setEquipmentPicksW}
              onBack={() => goToWizardStep(4)}
              onNext={async () => {
                await saveDraft(6);
                goToWizardStep(6);
              }}
            />
          )}

          {wizardCurrentStepId === 6 && (
            <>
              <DialogDescription>Finalizar e Detalhar</DialogDescription>
              <label className={styles.label}>Nome do Personagem:</label>
              <Input
                value={name}
                onChange={(e)=>setNameW(e.target.value)}
                onBlur={() => saveDraft(6)}
                required
              />
              <hr className={styles.divider}/>
              <ClassFinalSummary
                raceLabel={`${(races.find(r=>String(r.id)===String(wizardState.race?.raceId))?.name) || ''}${wizardState.race?.subRaceId ? ` / ${subRaces.find(s=>String(s.id)===String(wizardState.race.subRaceId))?.name || ''}` : ''}`}
                classLabel={`${(klasses.find(k=>String(k.id)===String(wizardState.klass?.klassId))?.name) || ''}${wizardState.klass?.classSubclassId ? ` / ${subclassNameById(wizardState.klass.classSubclassId) || ''}`: ''} (Nível ${effLevel})`}
                alignmentLabel={alignmentMap[wizardState.meta?.alignmentKey]?.name || wizardState.meta?.alignmentKey}
                backgroundName={backgroundName}
                hp={hpPreview}
                attributesText={`FOR ${eff(str,'str')} DES ${eff(dex,'dex')} CON ${eff(con,'con')} INT ${eff(intA,'int')} SAB ${eff(wis,'wis')} CAR ${eff(cha,'cha')}`}
                cantripNames={[...(wizardState.klass?.pickedCantrips || []).map(s=>s.name), ...featCantrips].filter(Boolean)}
                spellNames={[...(wizardState.klass?.pickedSpells || []).map(s=>s.name), ...featSpells].filter(Boolean)}
                featCantripsCount={featCantrips.length}
                featSpellsCount={featSpells.length}
              />

              {/* ASI Summary Panel */}
                <div style={{ marginTop: 24 }}>
                  <ASISummaryPanel 
                    classPicksByLevel={effClassPicksByLevel} 
                    level={effLevel} 
                  />
                </div>
            </>
          )}
        </form>
        {wizardCurrentStepId >= 1 && (
        <AttributesSidePanel
          str={str} setStr={setStrW}
          dex={dex} setDex={setDexW}
          con={con} setCon={setConW}
          intA={intA} setIntA={setIntW}
          wis={wis} setWis={setWisW}
          cha={cha} setCha={setChaW}
          raceBonuses={raceBonuses}
          asiBonuses={asiBonuses}
          remainingPoints={remainingPoints}
          abilityMethod={wizardState.race?.abilityMethod}
          level={effLevel}
          classSavingThrows={klassRule?.saving_throws || []}
          classSkillPicks={effClassSkillPicks}
          backgroundProfs={backgroundProfs}
          raceSkillProfs={raceSkillProfIds}
          expertiseSkills={(() => {
            try {
              const out = [];
              const seen = new Set();
              for (let i = 1; i <= Number(effLevel || 1); i++) {
                const row = (effClassPicksByLevel || {})[i] || {};
                const exp = row.expertise_skills || row.expertise;
                const arr = Array.isArray(exp) ? exp : (exp ? [exp] : []);
                arr.forEach((x) => {
                  const id = (x && typeof x === 'object') ? (x.id || x.name || x) : x;
                  const key = String(id);
                  if (!seen.has(key)) { seen.add(key); out.push(x); }
                });
              }
              return out;
            } catch(_) { return []; }
          })()}
          halfProfOnUntrained={(() => {
            try {
              return String(klassRule?.id || '').toLowerCase() === 'bard' && Number(effLevel) >= 2;
            } catch(_) { return false; }
          })()}
          rolledScores={wizardState.race?.rolledScores}
          styles={styles}
        />
        )}
        </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="xl" inline={inline} showClose={!inline}>
      <DialogHeader>
        <DialogTitle>Criar Personagem</DialogTitle>
      </DialogHeader>
      <DialogContent>
      <StepTabs
        steps={wizardSteps}
        currentStep={wizardCurrentStepIndex}
        onStepChange={handleStepChange}
        onCancel={onClose}
        onBack={handleBack}
        onNext={handleNext}
        canGoBack={!wizardIsFirstStep}
        canGoNext={currentStepCanProceed}
        nextLabel={wizardIsLastStep ? "Criar Personagem" : "Próximo"}
        showCancel={true}
        showBack={!wizardIsFirstStep}
        showNext={wizardCurrentStepId !== 5}
        nextDisabled={!currentStepCanProceed}
      />
        {(wizardState.race?.raceId || effKlassId) && (
          <SheetPreviewHeader
            name={name}
            ac={acPreview}
            hp={hpPreview}
            initiative={abilityMod(eff(dex,'dex'))}
            level={effLevel}
            className={selectedKlass?.name}
            subclassName={effClassSubclassId ? (subclassNameById(effClassSubclassId) || '') : ''}
            speedFt={(() => {
              try {
                const sub = subRuleId ? (rule?.subraces || {})[subRuleId] : null;
                const sp = (sub && sub.speed) || rule?.speed;
                const n = Number(sp);
                const base = Number.isFinite(n) ? n : null;
                const bonus = Number(aggregatedFeatRules?.speedFtBonus || 0);
                const monkBonus = (() => {
                  try {
                    const kid = String(selectedKlass?.api_index || '').toLowerCase();
                    const nameL = String(selectedKlass?.name || '').toLowerCase();
                    if (kid !== 'monk' && !nameL.includes('monge')) return 0;
                    const L = Number(effLevel || 1);
                    if (L >= 18) return 30;
                    if (L >= 14) return 25;
                    if (L >= 10) return 20;
                    if (L >= 6) return 15;
                    if (L >= 2) return 10;
                    return 0;
                  } catch(_) { return 0; }
                })();
                const totalBonus = bonus + monkBonus;
                return base != null ? (base + totalBonus) : (totalBonus || null);
              } catch(_) { return null; }
            })()}
            proficiencies={(() => {
              try {
                const armor = (() => {
                  const out = new Set();
                  if (effKlassId) {
                    (allowedArmorCats || []).forEach((c)=>{
                      const t = String(c);
                      if (t === 'light') out.add('Armaduras Leves');
                      else if (t === 'medium') out.add('Armaduras Médias');
                      else if (t === 'heavy') out.add('Armaduras Pesadas');
                      else if (t === 'shields') out.add('Escudos');
                      else out.add(t);
                    });
                  }
                  const toArr = (v) => {
                    if (!v) return [];
                    if (Array.isArray(v)) return v;
                    if (typeof v === 'object') {
                      if (Array.isArray(v.fixed)) return v.fixed;
                      if (Array.isArray(v.choices)) return v.choices;
                    }
                    return [v];
                  };
                  const sub = subRuleId ? (rule?.subraces || {})[subRuleId] : null;
                  const raceArmorArr = [
                    ...toArr(rule?.proficiencies?.armor),
                    ...toArr(sub?.proficiencies?.armor)
                  ].map((x)=> (x && x.name) ? x.name : String(x));
                  raceArmorArr.forEach((raw)=>{
                    const t = String(raw || '').toLowerCase();
                    if (!t) return;
                    if (t.includes('leve') || t === 'light') out.add('Armaduras Leves');
                    else if (t.includes('méd') || t.includes('medi') || t === 'medium') out.add('Armaduras Médias');
                    else if (t.includes('pesad') || t === 'heavy') out.add('Armaduras Pesadas');
                    else if (t.includes('escudo') || t === 'shields' || t === 'shield') out.add('Escudos');
                    else out.add(raw);
                  });
                  return Array.from(out);
                })();
                const weapons = (() => {
                  const out = new Set();
                  if (effKlassId) {
                    (allowedWeaponCats || []).forEach((c)=>{
                      const t = String(c);
                      if (t === 'simple') out.add('Armas Simples');
                      else if (t === 'martial') out.add('Armas Marciais');
                      else out.add(t);
                    });
                  }
                  const toArr = (v) => {
                    if (!v) return [];
                    if (Array.isArray(v)) return v;
                    if (typeof v === 'object') {
                      if (Array.isArray(v.fixed)) return v.fixed;
                      if (Array.isArray(v.choices)) return v.choices;
                    }
                    return [v];
                  };
                  const sub = subRuleId ? (rule?.subraces || {})[subRuleId] : null;
                  const raceWp = [
                    ...toArr(rule?.proficiencies?.weapons),
                    ...toArr(sub?.proficiencies?.weapons)
                  ].map((x)=> (x && x.name) ? x.name : String(x));
                  raceWp.forEach((w)=> out.add(w));
                  return Array.from(out);
                })();
                const tools = (() => {
                  const out = new Set();
                  const raceTools = (rule?.proficiencies?.tools?.fixed || []).map(String);
                  raceTools.forEach((t)=> out.add(t));
                  const rc = wizardState.race?.raceChoices || {};
                  if (rc.dwarfTool) out.add(String(rc.dwarfTool));
                  (Array.isArray(backgroundChoices?.gaming_set) ? backgroundChoices.gaming_set : []).forEach((t)=> out.add(String(t?.name||t)));
                  (Array.isArray(backgroundChoices?.instrument) ? backgroundChoices.instrument : []).forEach((t)=> out.add(String(t?.name||t)));
                  try {
                    const bg = (backgroundOptions || []).find(b => String(b.id) === String(backgroundKey));
                    const bgTools = (bg?.tools || []).flatMap((tool) => {
                      if (typeof tool === 'string') return [tool];
                      if (tool && typeof tool === 'object') {
                        const key = Object.keys(tool)[0];
                        const data = tool[key] || {};
                        const pick = (wizardState?.background?.backgroundChoices||{})?.[backgroundKey]?.tools?.[key];
                        if (pick) return [pick];
                        if (Array.isArray(data.fixed)) return data.fixed;
                        return [];
                      }
                      return [];
                    });
                    bgTools.forEach((t)=> out.add(String(t)));
                  } catch(_) {}
                  return Array.from(out);
                })();
                const languages = (() => {
                  const out = new Set();
                  try {
                    const bg = (backgroundOptions || []).find(b => String(b.id) === String(backgroundKey));
                    const langBlock = bg?.languages || null;
                    const picks = (wizardState?.background?.backgroundChoices||{})?.[backgroundKey]?.languages || [];
                    picks.forEach((l)=> out.add(String(l)));
                    if (Array.isArray(langBlock?.fixed)) langBlock.fixed.forEach((l)=> out.add(String(l)));
                    // Idiomas da raça
                    const always = (rule?.languages?.always || []);
                    always.forEach((l)=> out.add(String(l)));
                    const rc = wizardState.race?.raceChoices || {};
                    const extra = Array.isArray(rc?.extraLanguages) ? rc.extraLanguages.map((x)=> x?.name || x) : [];
                    extra.forEach((l)=> out.add(String(l)));
                    if (ruleId === 'elf' && subRuleId === 'high' && rc?.highElfExtraLanguage) {
                      out.add(String(rc.highElfExtraLanguage?.name || rc.highElfExtraLanguage));
                    }
                  } catch(_) {}
                  return Array.from(out);
                })();
                return { armor, weapons, tools, languages };
              } catch(_) { return { armor:[], weapons:[], tools:[], languages:[] }; }
            })()}
            raceLabel={`${selectedRace?.name || ''}${wizardState.race?.subRaceId ? ` / ${selectedSubRace?.name || ''}` : ''}`}
            backgroundLabel={backgroundName || background || ''}
          />
        )}
        <div className={styles.creationContainer}>
          {wizardCurrentStepId === 3 && (
            <FeaturesSidebar
            rule={klassRule}
            klassLevels={klassLevels}
            picksByLevel={effClassPicksByLevel}
            maxLevel={effLevel}
            raceCantripsExtra={raceCantripsExtraList}
            raceSpellsExtra={raceSpellsExtraList}
            subKlasses={subKlasses}
            selectedKlassId={selectedKlass?.id}
            spellDict={spellDict}
            classSubclassId={effClassSubclassId}
          />
        )}
        <form onSubmit={handleSubmit} className={`${styles.form} ${styles.mainColumn}`}>
          {error && <div className={styles.error}>{error}</div>}
          {successMessage && <div className={styles.success}>{successMessage}</div>}
          {wizardCurrentStepId === 1 && (
            <>
              <label className={styles.label}>Raça:</label>
              <Select placeholder="Selecione a raça" options={races} value={wizardState.race?.raceId || ""} onChange={(val)=>{setRaceIdW(val); setSubRaceIdW(""); setRaceChoicesW({});}} />
              <label className={styles.label}>Sub‑raça:</label>
              <Select placeholder="Selecione a sub‑raça" options={subRaces.filter(sr=>!(wizardState.race?.raceId) || String(sr.race_id)===String(wizardState.race?.raceId))} value={wizardState.race?.subRaceId || ""} onChange={(val)=>setSubRaceIdW(val)} disabled={!(wizardState.race?.raceId) || subRaces.filter(sr=>!(wizardState.race?.raceId) || String(sr.race_id)===String(wizardState.race?.raceId)).length === 0} />
              {/* Opções específicas por raça/sub‑raça */}
              <RaceOptionsSwitch
                ruleId={ruleId}
                subRuleId={subRuleId}
                picks={wizardState.race?.raceChoices || {}}
                setPicks={setRaceChoicesW}
                wizardCantripOptions={wizardCantripOptions}
                cantripOptions={cantripOptions}
                skillOptions={PROF_OPTIONS}
              />

              {rule && rule.languages && rule.languages.choiceCount > 0 && (
                <LanguageSelect
                  title={`Idiomas extras`}
                  options={(rule.languages.choiceList || ['Anão','Élfico','Halfling','Dracônico','Gnômico','Orc','Infernal']).filter(l=>!(rule.languages.always||[]).includes(l))}
                  value={wizardState.race?.raceChoices?.extraLanguages || []}
                  choose={rule.languages.choiceCount}
                  onChange={(ids)=>setRaceChoicesW({ ...(wizardState.race?.raceChoices || {}), extraLanguages: ids })}
                />
              )}

              {rule && (
                <div className={styles.panel} style={{marginTop: 12}}>
                  <div className={styles.panelTitle}>Resumo da Raça</div>
                  <RacePreview rule={rule} subRuleId={subRuleId} picks={wizardState.race?.raceChoices || {}} traitDefinitions={raceTraitDefs} />
                </div>
              )}

              {/* Rolagem de atributos no passo 1 */}
              <div className={styles.panel} style={{marginTop: 12}}>
                <div className={styles.panelTitle}>Rolagem de Atributos (4d6, soma os 3 maiores)</div>
                <div className={styles.small}>
                  Clique para gerar 6 valores. Você irá distribuí-los no próximo passo.
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
                  <Button type="button" variant="secondary" onClick={rollSixScores}>Rolar 6 valores</Button>
                  {Array.isArray(wizardState.race?.rolledScores) && wizardState.race.rolledScores.length === 6 && (
                    <div className={styles.small}>Valores: {wizardState.race.rolledScores.join(', ')}</div>
                  )}
                </div>
              </div>
            </>
          )}

        

          {/* Step 4 handled by StepAlignment component above */}

          {wizardCurrentStepId === 5 && (
            <>
              <DialogDescription>Equipamentos</DialogDescription>
              <label className={styles.label}>Nome do Personagem:</label>
              <Input
                value={name}
                onChange={(e)=>setNameW(e.target.value)}
                onBlur={() => saveDraft(6)}
                required
              />
              <hr className={styles.divider}/>
              <DialogDescription>Resumo</DialogDescription>
              <div>Raça/Sub‑raça: {races.find(r=>String(r.id)===String(wizardState.race?.raceId))?.name} {wizardState.race?.subRaceId ? `/ ${subRaces.find(s=>String(s.id)===String(wizardState.race.subRaceId))?.name}`: ''}</div>
              <div>Classe/Subclasse: {klasses.find(k=>String(k.id)===String(wizardState.klass?.klassId))?.name} {wizardState.klass?.classSubclassId ? `/ ${subclassNameById(wizardState.klass.classSubclassId)}`: ''} (Nível {effLevel})</div>
              <div>Alinhamento: {alignmentMap[wizardState.meta?.alignmentKey]?.name || wizardState.meta?.alignmentKey}</div>
              <div>Atributos finais: FOR {eff(str,'str')} DES {eff(dex,'dex')} CON {eff(con,'con')} INT {eff(intA,'int')} SAB {eff(wis,'wis')} CAR {eff(cha,'cha')}</div>
              <div>
                <strong>Cantrips:</strong> {[...(wizardState.klass?.pickedCantrips || []).map(s=>s.name), ...featCantrips].filter(Boolean).join(', ') || 'Nenhum'}
                {featCantrips.length > 0 && (
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                    (incluindo {featCantrips.length} de feats)
                  </span>
                )}
              </div>
              <div>
                <strong>Magias:</strong> {[...(wizardState.klass?.pickedSpells || []).map(s=>s.name), ...featSpells].filter(Boolean).join(', ') || 'Nenhuma'}
                {featSpells.length > 0 && (
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                    (incluindo {featSpells.length} de feats)
                  </span>
                )}
              </div>
              <div>Background: {backgroundName}</div>
            </>
          )}
        </form>
        {wizardCurrentStepId >= 1 && (
        <AttributesSidePanel
          str={str} setStr={setStrW}
          dex={dex} setDex={setDexW}
          con={con} setCon={setConW}
          intA={intA} setIntA={setIntW}
          wis={wis} setWis={setWisW}
          cha={cha} setCha={setChaW}
          raceBonuses={raceBonuses}
          asiBonuses={asiBonuses}
          remainingPoints={remainingPoints}
          abilityMethod={wizardState.race?.abilityMethod}
          level={effLevel}
          classSavingThrows={klassRule?.saving_throws || []}
          classSkillPicks={effClassSkillPicks}
          backgroundProfs={backgroundProfs}
          raceSkillProfs={raceSkillProfIds}
          rolledScores={wizardState.race?.rolledScores}
          styles={styles}
        />
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerCharacterFormDialog;
