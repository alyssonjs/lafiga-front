"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "../UI/Dialog";
import Select from "../UI/Select";
import TextArea from "../UI/TextArea";
import Button from "../UI/Button";
import Input from "../UI/Input";
import LanguageSelect from "../common/LanguageSelect";
import { crudFor } from "../../_services/railsApi";
import { apiClient } from "../../_lib/api/client";
import { useAuth } from "../../_context/AuthContext";
import styles from "../../_styles/character/CharacterForm.module.css";
import AttributesSidePanel from "../characterSteps/AttributesSidePanel";
import RaceOptionsSwitch from "../races/RaceOptionsSwitch";
import ClassStepper from "../classSteps/ClassStepper";
import FeaturesSidebar from "../classSteps/FeaturesSidebar";
import StepEquipment from "../characterSteps/StepEquipment";
import StepTabs from "../characterSteps/StepTabs";
import ASISummaryPanel from "../classSteps/ASISummaryPanel";
import StepBackground from "../characterSteps/StepBackground";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../UI/Card";

const PlayerCharacterFormDialog = ({ character, isOpen, onClose, onSave, inline = false }) => {
  const isEdit = Boolean(character);

  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const steps = [
    { id: 1, name: 'Raça' },
    { id: 2, name: 'Antecedente' },
    { id: 3, name: 'Classe' },
    { id: 4, name: 'Alinhamento' },
    { id: 5, name: 'Equipamentos' },
    { id: 6, name: 'Finalizar' },
  ];
  const [step, setStep] = useState(1);
  const [races, setRaces] = useState([]);
  const [subRaces, setSubRaces] = useState([]);
  const [klasses, setKlasses] = useState([]);
  const [subKlasses, setSubKlasses] = useState([]);
  const [raceRules, setRaceRules] = useState({});
  const [wizardCantripOptions, setWizardCantripOptions] = useState([]);
  const [classRules, setClassRules] = useState({});
  const [classDicts, setClassDicts] = useState({ instruments: [], fighting_styles: [], skills_all: [] });

  const CLASS_NAME_MAP = {
    'Bárbaro':'barbarian','Bardo':'bard','Clérigo':'cleric','Druida':'druid','Guerreiro':'fighter','Monge':'monk','Paladino':'paladin','Patrulheiro':'ranger','Ladino':'rogue','Feiticeiro':'sorcerer','Bruxo':'warlock','Mago':'wizard'
  };

  const [raceId, setRaceId] = useState("");
  const [subRaceId, setSubRaceId] = useState("");
  const [klassId, setKlassId] = useState("");
  const [subKlassId, setSubKlassId] = useState("");
  const [level, setLevel] = useState(1);

  const [str, setStr] = useState(10);
  const [dex, setDex] = useState(10);
  const [con, setCon] = useState(10);
  const [intA, setIntA] = useState(10);
  const [wis, setWis] = useState(10);
  const [cha, setCha] = useState(10);
  // Método de atributos (agora focado em rolagem 4d6)
  const [abilityMethod, setAbilityMethod] = useState('roll_4d6'); // 'point_buy' | 'roll_4d6'
  const [rolledScores, setRolledScores] = useState([]); // guarda 6 valores de 4d6 (3 maiores)

  const roll4d6DropLowest = () => {
    const dice = [1,2,3,4].map(() => (Math.floor(Math.random() * 6) + 1));
    const sorted = [...dice].sort((a,b)=>b-a);
    return sorted.slice(0,3).reduce((s,n)=>s+n,0);
  };
  const rollSixScores = () => {
    const vals = Array.from({length:6}, ()=> roll4d6DropLowest());
    setRolledScores(vals);
    setAbilityMethod('roll_4d6');
    // limpa atribuições atuais para evitar conflito de valores iguais ao pool
    setStr(0); setDex(0); setCon(0); setIntA(0); setWis(0); setCha(0);
  };

  // Race/background specific choices (stored in sheet.metadata)
  const [raceChoices, setRaceChoices] = useState([]); // e.g., idiomas, proficiências
  const [backgroundName, setBackgroundName] = useState("");
  const [backgroundKey, setBackgroundKey] = useState("");
  const [backgroundOptions, setBackgroundOptions] = useState([]);
  const [backgroundIndexMap, setBackgroundIndexMap] = useState({});
  const [backgroundDetails, setBackgroundDetails] = useState(null);
  const [alignments, setAlignments] = useState([]);
  const [alignmentMap, setAlignmentMap] = useState({});
  const [alignmentKey, setAlignmentKey] = useState("");
  const [alignmentDetails, setAlignmentDetails] = useState(null);
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
    { id: 'animal-handling', name: 'Trato com Animais' },
    { id: 'insight', name: 'Intuição' },
    { id: 'medicine', name: 'Medicina' },
    { id: 'perception', name: 'Percepção' },
    { id: 'survival', name: 'Sobrevivência' },
    { id: 'deception', name: 'Enganação' },
    { id: 'intimidation', name: 'Intimidação' },
    { id: 'performance', name: 'Atuação' },
    { id: 'persuasion', name: 'Persuasão' },
  ];

  // Spells selection (known/prepared basic support)
  const [cantripOptions, setCantripOptions] = useState([]);
  const [spellOptions, setSpellOptions] = useState([]);
  const [spellCatalog, setSpellCatalog] = useState([]);
  const [pickedCantrips, setPickedCantrips] = useState([]);
  const [pickedSpells, setPickedSpells] = useState([]);
  const [klassLevels, setKlassLevels] = useState([]);
  const [asiChoice, setAsiChoice] = useState(null);
  const [classPicksByLevel, setClassPicksByLevel] = useState({});
  const [equipmentPicks, setEquipmentPicks] = useState([]);

  const handleStepChange = (stepId) => {
    setStep(stepId);
  };

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else if (step === 6) {
      // No step 6, o botão "Criar Personagem" deve submeter o formulário
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Função para verificar se todas as escolhas obrigatórias da classe foram feitas
  const areClassChoicesComplete = () => {
    if (!klassId || !classRules) return false;
    const klass = klasses.find(k => k.id === klassId);
    if (!klass) return false;
    const klassApiIndex = klass.api_index || klass.name.toLowerCase();
    const rule = classRules[klassApiIndex];
    if (!rule) return false;
    // Subclasse obrigatória
    const subclassLevel = rule.subclass?.choose_level;
    if (subclassLevel && Number(level) >= subclassLevel && !classSubclassId) return false;
    // Escolhas obrigatórias por nível (genérico)
    const requiredChoices = rule.required_choices_at_level || {};
    for (let lvl = 1; lvl <= Number(level); lvl++) {
      const levelChoices = requiredChoices[lvl];
      if (!levelChoices) continue;
      const row = (classPicksByLevel?.[lvl]) || {};
      for (const [choiceKey, config] of Object.entries(levelChoices)) {
        if (choiceKey === 'fighting_style') {
          const fs = row.fighting_style || classFightingStyle;
          if (!fs) return false;
          continue;
        }
        const need = Number(config?.choose || 1);
        const val = row?.[choiceKey];
        const arr = Array.isArray(val) ? val : (val ? [val] : []);
        if (arr.length < need) return false;
      }
    }
    return true;
  };

  // Função para obter mensagens de erro sobre escolhas obrigatórias
  const getLevelUpErrors = () => {
    const errors = [];
    
    if (!klassId || !classRules) {
      errors.push('Selecione uma classe');
      return errors;
    }
    
    const klass = klasses.find(k => k.id === klassId);
    if (!klass) {
      errors.push('Classe não encontrada');
      return errors;
    }
    
    const klassApiIndex = klass.api_index || klass.name.toLowerCase();
    const rule = classRules[klassApiIndex];
    
    if (!rule) {
      errors.push('Regras da classe não encontradas');
      return errors;
    }
    
    // Verificar subclasse obrigatória
    const subclassLevel = rule.subclass?.choose_level;
    const currentLevel = Number(level);
    
    if (subclassLevel && currentLevel >= subclassLevel && !classSubclassId) {
      errors.push(`Subclasse obrigatória a partir do nível ${subclassLevel}`);
    }
    
    // Verificar escolhas obrigatórias por nível (genérico)
    const requiredChoices = rule.required_choices_at_level || {};
    for (let lvl = 1; lvl <= currentLevel; lvl++) {
      const levelChoices = requiredChoices[lvl];
      if (!levelChoices) continue;
      console.log(levelChoices, 'levelChoises')
      const row = (classPicksByLevel?.[lvl]) || {};
      for (const [choiceKey, config] of Object.entries(levelChoices)) {
        const need = Number(config?.choose || 1);
        if (choiceKey === 'fighting_style') {
          const fs = row.fighting_style || classFightingStyle;
          if (!fs) errors.push(`Estilo de luta obrigatório no nível ${lvl}`);
          continue;
        }
        const val = row?.[choiceKey];
        const arr = Array.isArray(val) ? val : (val ? [val] : []);
        if (arr.length < need) {
          console.log(arr.length, need, '---------------------') 
          const label = choiceKey.replace('_',' ');
          errors.push(`${label}: faltam ${need - arr.length} no nível ${lvl}`);
        }
      }
    }
    
    console.log('🔍 getLevelUpErrors - final errors:', errors);
    return errors;
  };

  // Função para verificar se o level up pode ser feito
  const canLevelUp = () => {
    const errors = getLevelUpErrors();
    console.log('🔍 canLevelUp - errors:', errors);
    console.log('🔍 canLevelUp - can level up:', errors.length === 0);
    return errors.length === 0;
  };

  const canGoNext = () => {
    switch (step) {
      case 1: return raceId && raceReady;
      case 2: return backgroundKey && backgroundValid;
      case 3: return klassId && areClassChoicesComplete();
      case 4: return alignmentKey;
      case 5: return true; // Equipment step
      case 6: return name.trim();
      default: return false;
    }
  };
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { role } = useAuth();
  const charactersApi = useMemo(
    () => crudFor("characters", role),
    [role]
  );
  const sheetsApi = useMemo(() => crudFor("sheets", role), [role]);
  const sheetKlassesApi = useMemo(() => crudFor("sheet_klasses", role), [role]);
  const sheetItemsApi = useMemo(() => crudFor("sheet_items", role), [role]);
  const publicRacesApi = useMemo(() => crudFor("races", "public"), []);
  const publicSubRacesApi = useMemo(() => crudFor("sub_races", "public"), []);
  const publicKlassesApi = useMemo(() => crudFor("klasses", "public"), []);
  const publicSubKlassesApi = useMemo(() => crudFor("sub_klasses", "public"), []);

  useEffect(() => {
    if (isEdit) {
      setName(character.name);
      setBackground(character.background);
      setGroupId(character.group_id);
      setUserId(character.user_id);
    } else {
      setName("");
      setBackground("");
      setGroupId("");
      setUserId("");
      setRaceId("");
      setSubRaceId("");
      setKlassId("");
      setSubKlassId("");
      setLevel(1);
      setStr(10); setDex(10); setCon(10); setIntA(10); setWis(10); setCha(10);
    }
    setError(null);
  }, [isOpen, character]);

  useEffect(() => {
    (async () => {
      try {
        const [ { races }, { sub_races }, { klasses }, { sub_klasses }, { race_rules }, crIndex, bgIndex ] = await Promise.all([
          publicRacesApi.getAll(),
          publicSubRacesApi.getAll(),
          publicKlassesApi.getAll(),
          publicSubKlassesApi.getAll(),
          apiClient.get('/api/v1/public/race_rules').then(r=>r),
          apiClient.get('/api/v1/public/class_rules').then(r=>r),
          apiClient.get('/api/v1/public/backgrounds').then(r=>r).catch(()=>({ backgrounds: {} })),
        ]);
        setRaces(races);
        setSubRaces(sub_races);
        setKlasses(klasses);
        setSubKlasses(sub_klasses);
        setRaceRules(race_rules || {});
        setClassRules(crIndex.class_rules || {});
        setClassDicts(crIndex.dictionaries || { instruments: [], fighting_styles: [], skills_all: [] });
        try {
          const bgs = bgIndex.backgrounds || {};
          setBackgroundIndexMap(bgs);
          const arr = Object.values(bgs).map((v)=> ({
            id: v.id,
            name: v.name,
            index: v.api_index || v.index || v.id,
            skills: v.skills || [],
            tools: v.tools || [],
            desc: v.desc || v.description || '',
          }));
          setBackgroundOptions(arr);
        } catch (e) {
          setBackgroundOptions([]);
        }
      } catch (err) {
        console.error('Falha ao carregar listas públicas', err);
      }
    })();
  }, []);

  // Carregar cantrips de mago para Alto Elfo (sempre disponíveis)
  useEffect(() => {
    (async () => {
      try {
        if (!klasses?.length) return;
        const wizard = klasses.find(k => k.api_index === 'wizard');
        if (!wizard) return;
        const { spells = [] } = await apiClient.get(`/api/v1/public/spells?klass_id=${wizard.id}`);
        const cantrips = spells.filter(s => (s.level || 0) === 0);
        setWizardCantripOptions(cantrips);
      } catch (e) {
        console.error('Falha ao carregar cantrips de mago', e);
      }
    })();
  }, [klasses]);

  // Load spells for class + class levels when class/level changes
  useEffect(() => {
    (async () => {
      try {
        if (!klassId) return;
        const [{ spells = [] }, { class_levels = [] }] = await Promise.all([
          apiClient.get(`/api/v1/public/spells?klass_id=${klassId}`),
          apiClient.get(`/api/v1/public/klasses/${klassId}/levels`),
        ]);
        setKlassLevels(class_levels || []);
        setSpellCatalog(spells || []);
        const cantrips = (spells || [])
          .filter(s => (s.level || 0) === 0)
          .map(s => ({ id: s.id, name: s.name, level: s.level || 0 }));
        const leveled = (spells || [])
          .filter(s => (s.level || 0) > 0)
          .map(s => ({ id: s.id, name: s.name, level: s.level || 0 }));
        setCantripOptions(cantrips);
        setSpellOptions(leveled);
      } catch (err) {
        console.error('Falha ao carregar spells/levels', err);
      }
    })();
  }, [klassId]);

  // Initialize classPicksByLevel when class or level changes
  useEffect(() => {
    if (!klassId || !level) return;
    
    setClassPicksByLevel(prev => {
      const updated = { ...prev };
      const currentLevel = Number(level) || 1;
      
      // Ensure all levels from 1 to currentLevel have basic structure
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
      
      console.log('🔧 Initialized classPicksByLevel for levels 1 to', currentLevel, ':', updated);
      return updated;
    });
  }, [klassId, level]);

  // Load alignments list (backend then external API)
  useEffect(() => {
    (async () => {
      try {
        let list = [];
        try {
          const resp = await apiClient.get('/api/v1/public/alignments');
          const map = resp.alignments || {};
          list = Object.values(map).map(a => ({ index: a.index || a.id, name: a.name || a.title || a.id, desc: a.desc || a.description || '' }));
        } catch (_) {}
        if (!Array.isArray(list) || list.length === 0) {
          const res = await fetch('https://www.dnd5eapi.co/api/alignments');
          const data = await res.json();
          list = (data.results || []).map(a => ({ index: a.index, name: a.name, url: a.url }));
        }
        setAlignments(list);
        const mapBy = {};
        list.forEach(a => { mapBy[a.index] = a; });
        setAlignmentMap(mapBy);
      } catch (e) {
        console.error('Falha ao carregar alinhamentos', e);
      }
    })();
  }, []);

  // Load alignment details when selected
  useEffect(() => {
    (async () => {
      if (!alignmentKey) { setAlignmentDetails(null); return; }
      const cached = alignmentMap[alignmentKey];
      if (cached?.desc) { setAlignmentDetails(cached); return; }
      try {
        try {
          const res = await apiClient.get(`/api/v1/public/alignments/${alignmentKey}`);
          const a = res.alignment || res;
          if (a && (a.index || a.id)) {
            setAlignmentDetails({ index: a.index || a.id, name: a.name || a.title, desc: a.desc || a.description || '' });
            return;
          }
        } catch (_) {}
        const res = await fetch(`https://www.dnd5eapi.co/api/alignments/${alignmentKey}`);
        const data = await res.json();
        setAlignmentDetails({ index: data.index, name: data.name, desc: data.desc });
      } catch (e) {
        setAlignmentDetails({ index: alignmentKey, name: cached?.name || alignmentKey, desc: '' });
      }
    })();
  }, [alignmentKey]);

  const spellDict = useMemo(() => {
    const dict = {};
    const push = (arr=[]) => arr.forEach(s => { if(!s) return; const desc = Array.isArray(s.desc) ? s.desc.join('\n\n') : (s.desc || ''); dict[s.id] = { name: s.name, desc }; });
    push(spellCatalog);
    push(cantripOptions);
    push(spellOptions);
    push(wizardCantripOptions);
    return dict;
  }, [spellCatalog, cantripOptions, spellOptions, wizardCantripOptions]);

  // Cálculo de bônus de atributos a partir das regras (inclui escolhas de Meio‑Elfo e Humano Variante)
  const abilityKey = { STR:'str', DEX:'dex', CON:'con', INT:'int', WIS:'wis', CHA:'cha' };
  const normalizeAbility = (ab) => {
    if (typeof ab === 'string') return ab;
    if (ab && typeof ab === 'object') {
      if (ab.id) return String(ab.id);
      if (ab.ability) return String(ab.ability);
    }
    return String(ab || '');
  };
  const toAbilityKey = (ab) => {
    const token = normalizeAbility(ab).toUpperCase();
    return abilityKey[token] || token.toLowerCase();
  };
  const addBonus = (map, ab, amt) => {
    const k = toAbilityKey(ab);
    if (!k) return;
    map[k] = (map[k]||0) + amt;
  };
  const computeAbilityBonuses = (rule, subRuleId, picks, raceName, subRaceName) => {
    const b = {};
    if (!rule) return b;
    const sub = subRuleId ? (rule.subraces||{})[subRuleId] : null;
    const collect = (node) => { if(node?.type==='fixed'){ (node.increases||[]).forEach(ai=>addBonus(b, ai.ability, ai.amount)); } };
    // Evitar aplicar o bônus base de Humano (+1 em todos) quando for Variante
    const isHumanVariant = rule.id === 'human' && subRuleId === 'variant';
    if (!isHumanVariant) {
      collect(rule.ability);
    }
    if (sub?.ability) collect(sub.ability);
    // Meio‑Elfo escolhas +1 em 2 habilidades
    if (rule.id === 'half_elf' && Array.isArray(picks?.halfElfAbilityPicks)) {
      picks.halfElfAbilityPicks.forEach(a => addBonus(b, a, 1));
    }
    // Humano Variante (PHB): +1 em dois atributos escolhidos OU conforme talento escolhido
    if (rule.id === 'human' && subRuleId === 'variant') {
      const hv = picks?.variantHumanASI || null;
      try {
        if (hv && hv.mode === 'attributes') {
          const attrs = Array.isArray(hv.attributes) ? hv.attributes : [];
          if (attrs.length === 1) { addBonus(b, attrs[0], 2); }
          else { attrs.slice(0,2).forEach(a => addBonus(b, a, 1)); }
        } else if (hv && hv.mode === 'feat') {
          const featId = hv.featId || hv.featName || null;
          if (featId) {
            const bonuses = getFeatBonuses(featId, hv.choices || {});
            Object.entries(bonuses).forEach(([k, v]) => { if (v) addBonus(b, k, v); });
          }
        }
      } catch (_) {}
    }
    // Compat: seeds PT‑BR sem rule para meio‑orc/gnomo base
    const rn = (raceName||'').toLowerCase();
    const srn = (subRaceName||'').toLowerCase();
    if (!rule || !rule.id) {
      if (rn==='meio-orc'){ addBonus(b,'STR',2); addBonus(b,'CON',1); }
      if (rn==='gnomo'){ addBonus(b,'INT',2); if (srn.includes('rocha')) addBonus(b,'CON',1); if (srn.includes('floresta')) addBonus(b,'DEX',1); }
    }
    return b;
  };

  const selectedRace = races.find(r=>r.id===raceId);
  const selectedSubRace = subRaces.find(sr=>sr.id===subRaceId);
  // Map PT-BR name to rule id keys
  const RULE_NAME_MAP = {
    'Anão':'dwarf','Elfo':'elf','Halfling':'halfling','Humano':'human','Draconato':'dragonborn','Gnomo':'gnome','Meio-Elfo':'half_elf','Meio-Orc':'half_orc','Tiefling':'tiefling'
  };
  const ruleId = RULE_NAME_MAP[selectedRace?.name] || null;
  const rule = ruleId ? raceRules[ruleId] : null;
  const subRuleId = (()=>{
    if(!rule || !selectedSubRace) return null;
    const name = (selectedSubRace.name||'').toLowerCase();
    if(ruleId==='dwarf') return name.includes('montanha')? 'mountain' : name.includes('colina')? 'hill': null;
    if(ruleId==='elf') return name.includes('alto')? 'high' : name.includes('floresta')? 'wood' : name.includes('negro')? 'drow' : null;
    if(ruleId==='gnome') return name.includes('floresta')? 'forest' : name.includes('rocha')? 'rock' : null;
    if(ruleId==='human') return name.includes('variante')? 'variant': null;
    if(ruleId==='halfling') return name.includes('leves')? 'lightfoot' : name.includes('robusto')? 'stout' : null;
    return null;
  })();
  // Get bonuses from feats based on actual choices
  const getFeatBonuses = (featName, choices = {}) => {
    const featMap = {
      'observador': { wis: 1, int: 1 },
      'duravel': { con: 1 },
      'atirador_agucado': { dex: 1 },
      'sentinela': { str: 1, con: 1 },
      'resiliente': choices.ability ? { [String(choices.ability).toLowerCase()]: 1 } : {},
      'atleta': choices.ability ? { [String(choices.ability).toLowerCase()]: 1 } : {},
      'especialista_em_armas': choices.ability ? { [choices.ability]: 1 } : {},
      'magico_iniciante': choices.ability ? { [choices.ability]: 1 } : {},
      'especialista_em_armadura': { str: 1 },
      'especialista_em_escudo': choices.ability ? { [choices.ability]: 1 } : {}
    };
    return featMap[featName] || {};
  };

  // Aggregate ASI bonuses from per-level picks up to current level
  const ASI_MAP = { STR: 'str', DEX: 'dex', CON: 'con', INT: 'int', WIS: 'wis', CHA: 'cha' };
  const asiBonuses = useMemo(() => {
    const acc = { str:0, dex:0, con:0, int:0, wis:0, cha:0 };
    for (let i = 1; i <= Number(level || 1); i++) {
      const p = classPicksByLevel[i];
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
  }, [classPicksByLevel, level]);
  const raceBonuses = computeAbilityBonuses(rule, subRuleId, raceChoices, selectedRace?.name, selectedSubRace?.name);
  const eff = (base, key) => {
    const raw = (Number(base)||0) + (raceBonuses[key]||0) + (asiBonuses[key]||0);
    return raw;
  };

  // Collect cantrips and spells from feats
  const featCantrips = useMemo(() => {
    const cantrips = [];
    for (let i = 1; i <= Number(level || 1); i++) {
      const p = classPicksByLevel[i];
      const asi = p?.asi;
      if (asi && asi.mode === 'feat' && asi.choices?.cantrips) {
        cantrips.push(...asi.choices.cantrips);
      }
    }
    return cantrips;
  }, [classPicksByLevel, level]);

  const featSpells = useMemo(() => {
    const spells = [];
    for (let i = 1; i <= Number(level || 1); i++) {
      const p = classPicksByLevel[i];
      const asi = p?.asi;
      if (asi && asi.mode === 'feat' && asi.choices?.spells) {
        spells.push(...asi.choices.spells);
      }
    }
    return spells;
  }, [classPicksByLevel, level]);

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
  const raceInnateByLevel = useMemo(() => {
    const list = [];
    if (rule) {
      const sub = subRuleId ? (rule.subraces || {})[subRuleId] : null;
      const merged = [ ...(rule.innateSpells || []), ...((sub && sub.innateSpells) || []) ];
      merged.forEach((entry) => {
        if (!entry) return;
        const reqLvl = Number(entry.level || 1);
        if (Number(level || 1) < reqLvl) return;
        (entry.spells || []).forEach((nm) => {
          const found = spellByName.get(String(nm).toLowerCase());
          if (found) list.push({ id: found.id, name: `${found.name} (Raça)`, level: found.level || 0 });
          else list.push({ id: `race:${String(nm).toLowerCase()}`, name: `${nm} (Raça)`, level: 0 });
        });
      });
    }
    // dedup by id
    const seen = new Set();
    return list.filter((s) => { const id = s.id || s.name; if (seen.has(id)) return false; seen.add(id); return true; });
  }, [rule, subRuleId, level, spellByName]);

  // Extras de Raça reutilizáveis (cantrips e magias)
  const raceCantripsExtraList = useMemo(() => {
    const extra = [];
    // Alto Elfo: 1 cantrip de mago escolhido
    const cid = raceChoices?.highElfCantrip || null;
    if (cid) {
      const pools = [ wizardCantripOptions || [], cantripOptions || [], spellCatalog || [] ];
      for (const list of pools) {
        const found = (list || []).find(s => String(s.id) === String(cid));
        if (found) { extra.push({ id: found.id, name: `${found.name} (Raça)`, level: found.level || 0 }); break; }
      }
    }
    // Cantrips inatos da raça
    raceInnateByLevel.filter(s => (s.level || 0) === 0).forEach(s => extra.push(s));
    // dedup
    const seen = new Set();
    return extra.filter(s => { const id = s.id || s.name; if (seen.has(id)) return false; seen.add(id); return true; });
  }, [raceChoices, wizardCantripOptions, cantripOptions, spellCatalog, raceInnateByLevel]);

  const raceSpellsExtraList = useMemo(() => (
    raceInnateByLevel.filter(s => (s.level || 0) > 0)
  ), [raceInnateByLevel]);

  // Feat selecionado pela Raça (Humano Variante) para evitar duplicidade em escolhas de classe
  const raceSelectedFeatId = useMemo(() => {
    try {
      const hv = raceChoices?.variantHumanASI || null;
      if (hv && hv.mode === 'feat') return hv.featId || hv.featName || null;
      return null;
    } catch (_) { return null; }
  }, [raceChoices]);

  // Classe selecionada
  const selectedKlass = klasses.find(k=>String(k.id)===String(klassId));
  const klassRuleId = selectedKlass?.api_index || (selectedKlass ? CLASS_NAME_MAP[selectedKlass.name] : null);
  const klassRule = klassRuleId ? classRules[klassRuleId] : null;
  const canChooseSubclass = klassRule?.subclass?.choose_level && Number(level)>=Number(klassRule.subclass.choose_level);
  const classSkillsAll = (klassRule?.skill_proficiencies?.options === 'any') ? (classDicts.skills_all || []) : (klassRule?.skill_proficiencies?.options || []);

  const [classSkillPicks, setClassSkillPicks] = useState([]);
  const [classInstrumentPicks, setClassInstrumentPicks] = useState([]);
  const [classFightingStyle, setClassFightingStyle] = useState(null);
  const [classSubclassId, setClassSubclassId] = useState(null);

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
    return Array.from(out);
  }, [klassRule]);
  const allowedWeaponCats = useMemo(() => {
    const out = new Set();
    const wp = klassRule?.weapon_proficiencies || [];
    wp.forEach((v)=>{
      const t = String(v||'').toLowerCase();
      if (t.includes('armas simples') || t.includes('simple')) out.add('simple');
      if (t.includes('armas marciais') || t.includes('martial')) out.add('martial');
    });
    return Array.from(out);
  }, [klassRule]);

  const raceReady = (() => {
    if (!ruleId) return false;
    // idiomas obrigatórios (considera base + sub‑raça quando aplicável)
    const subLangCount = (rule?.subraces && subRuleId && rule.subraces[subRuleId]?.languages?.choiceCount) ? rule.subraces[subRuleId].languages.choiceCount : 0;
    const baseLangCount = rule?.languages?.choiceCount || 0;
    const requiredLangCount = baseLangCount + subLangCount;
    const selectedLangBase = Array.isArray(raceChoices?.extraLanguages) ? raceChoices.extraLanguages.length : 0;
    const selectedLangHighElf = (ruleId === 'elf' && subRuleId === 'high' && raceChoices?.highElfExtraLanguage) ? 1 : 0;
    const langOk = (selectedLangBase + selectedLangHighElf) >= requiredLangCount;

    switch (ruleId) {
      case 'dwarf':
        return !!raceChoices?.dwarfTool && langOk;
      case 'elf':
        if (subRuleId === 'high') {
          // Alto Elfo: exigir cantrip e 1 idioma extra
          return !!raceChoices?.highElfCantrip && langOk;
        }
        return langOk;
      case 'human':
        if (subRuleId === 'variant') {
          const hv = raceChoices?.variantHumanASI || null;
          if (!hv || !hv.mode) return false;
          if (hv.mode === 'attributes') {
            const attrs = Array.isArray(hv.attributes) ? hv.attributes : [];
            return attrs.length >= 1 && attrs.length <= 2 && langOk;
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
      case 'half_elf':
        // 2 atributos (+1) que não incluem CHA, e 2 perícias
        const picks = Array.isArray(raceChoices?.halfElfAbilityPicks) ? raceChoices.halfElfAbilityPicks : [];
        const noCha = picks.every(p => (p?.id || p) !== 'CHA');
        return picks.length === 2 && noCha && Array.isArray(raceChoices?.halfElfSkillPicks) && raceChoices.halfElfSkillPicks.length === 2 && langOk;
      case 'dragonborn':
        return !!raceChoices?.draconicAncestry && langOk;
      default:
        return langOk;
    }
  })();

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
    if (Array.isArray(raceChoices?.halfElfSkillPicks)) raceChoices.halfElfSkillPicks.forEach(addByName);
    if (raceChoices?.variantHumanSkill) addByName(raceChoices.variantHumanSkill);
    return Array.from(new Set(ids));
  }, [rule, subRuleId, raceChoices]);

  // Simple 27-point buy helper (8..15)
  const pointCost = (score) => ({8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9}[score] ?? 0);
  const totalPoints = 27;
  const ftToMeters = (ft) => Math.round(ft * 0.3048);

  const RacePreview = ({ rule, subRuleId, picks }) => {
    if (!rule) return null;
    const sub = subRuleId ? (rule.subraces || {})[subRuleId] : null;
    const merged = {
      ability: rule.ability,
      speed: (sub && sub.speed) || rule.speed,
      darkvision: (sub && sub.darkvision) || rule.darkvision,
      languages: rule.languages,
      proficiencies: mergeProf(rule.proficiencies, sub?.proficiencies),
      traits: [...(rule.traits||[]), ...((sub&&sub.traits)||[])],
      innateSpells: [...(rule.innateSpells||[]), ...((sub&&sub.innateSpells)||[])],
    };

    const abilityIncreases = [];
    const collectFixed = (node) => {
      if (node && node.type === 'fixed' && Array.isArray(node.increases)) abilityIncreases.push(...node.increases);
    };
    collectFixed(rule.ability);
    if (sub && sub.ability) collectFixed(sub.ability);

    // languages
    const always = (merged.languages?.always || []);
    const extra = Array.isArray(picks?.extraLanguages) ? picks.extraLanguages.map(x=>x.name||x) : [];
    const highExtra = picks?.highElfExtraLanguage ? [picks.highElfExtraLanguage.name || picks.highElfExtraLanguage] : [];
    const languages = Array.from(new Set([...always, ...extra, ...highExtra]));

    // proficiencies flatten
    const prof = merged.proficiencies || {};
    const listFrom = (p) => Array.isArray(p?.fixed) ? p.fixed : Array.isArray(p?.choices) ? (picks?.pickedTools || []) : [];

    return (
      <div className={styles.racePreview}>
        <div><strong>Velocidade:</strong> {merged.speed || 30} ft ({ftToMeters(merged.speed || 30)} m)</div>
        {merged.darkvision && <div><strong>Visão no Escuro:</strong> {merged.darkvision.range} ft</div>}
        {!!abilityIncreases.length && (
          <div><strong>Incrementos de Atributo:</strong> {abilityIncreases.map(ai=>`${ai.ability}+${ai.amount}`).join(', ')}</div>
        )}
        {!!languages.length && <div><strong>Idiomas:</strong> {languages.join(', ')}</div>}
        <div className={styles.previewColumns}>
          <div>
            <div className={styles.previewTitle}>Profic. Armas</div>
            <div>{(prof.weapons||[]).join(', ') || '-'}</div>
          </div>
          <div>
            <div className={styles.previewTitle}>Profic. Armaduras</div>
            <div>{(prof.armor||[]).join(', ') || '-'}</div>
          </div>
          <div>
            <div className={styles.previewTitle}>Ferramentas</div>
            <div>{Array.isArray(prof.tools?.fixed)? prof.tools.fixed.join(', '): (prof.tools?.choices ? `Escolha ${prof.tools.choiceCount}` : '-')}</div>
          </div>
          <div>
            <div className={styles.previewTitle}>Perícias</div>
            <div>{Array.isArray(prof.skills?.fixed)? prof.skills.fixed.join(', '): (prof.skills?.choiceCount ? `Escolha ${prof.skills.choiceCount}` : '-')}</div>
          </div>
        </div>
        {!!merged.traits?.length && (
          <div><strong>Traços:</strong> {merged.traits.map(t=>t.key).join(', ')}</div>
        )}
        {!!merged.innateSpells?.length && (
          <div><strong>Magias Inatas:</strong> {merged.innateSpells.map(s=>`${s.spells.join(', ')} (nv ${s.level})`).join('; ')}</div>
        )}
      </div>
    );
  };

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
      if (!raceId || !klassId) {
        setError("Selecione raça e classe.");
        return;
      }
      const payload = { name, background: backgroundName || background, group_id: groupId ? +groupId : null };
      
      const response = isEdit 
        ? await charactersApi.update(character.id, payload) 
        : await charactersApi.create(payload);
      const createdChar = response.character || response;

      if (!isEdit) {
        const klass = klasses.find(k => k.id === klassId);
        // aplica bônus raciais nos atributos enviados
        const finalStr = eff(str,'str');
        const finalDex = eff(dex,'dex');
        const finalCon = eff(con,'con');
        const finalInt = eff(intA,'int');
        const finalWis = eff(wis,'wis');
        const finalCha = eff(cha,'cha');

        const conMod = Math.floor((finalCon - 10) / 2);
        const hitDie = klass?.hit_die || 8;
        const initHp = Math.max(1, hitDie + conMod);
        const raceSummary = rule ? {
          speed_ft: (subRuleId && (rule.subraces||{})[subRuleId]?.speed) || rule.speed,
          speed_m: ftToMeters(((subRuleId && (rule.subraces||{})[subRuleId]?.speed) || rule.speed) || 30),
          darkvision: ((subRuleId && (rule.subraces||{})[subRuleId]?.darkvision) || rule.darkvision) || null,
          languages: Array.from(new Set([...(rule.languages?.always||[]), ...((raceChoices?.extraLanguages||[]).map(x=>x.name||x)), (raceChoices?.highElfExtraLanguage?.name || raceChoices?.highElfExtraLanguage)].filter(Boolean))),
          traits: [...(rule.traits||[]), ...(((rule.subraces||{})[subRuleId]?.traits)||[])].map(t=>t.key),
          proficiencies: mergeProf(rule.proficiencies, (rule.subraces||{})[subRuleId]?.proficiencies),
        } : null;

        const classSummary = klassRule ? {
          klass_id: klassRule.id,
          name: klassRule.name,
          hit_die: klassRule.hit_die,
          primary_abilities: klassRule.primary_abilities,
          saving_throws: klassRule.saving_throws,
          armor_proficiencies: klassRule.armor_proficiencies,
          weapon_proficiencies: klassRule.weapon_proficiencies,
          tools: classInstrumentPicks.map(i=>i.name||i),
          skills: classSkillPicks.map(s=>s.name||s),
          fighting_style: classFightingStyle?.name || classFightingStyle || null,
          subclass: classSubclassId,
          spellcasting: klassRule.spellcasting || null,
          // Adicionar nível atual
          current_level: Number(level) || 1
        } : null;

        // Normalize per_level to include fighting_style at its required level if set only at top level
        const perLvl = { ...(classPicksByLevel || {}) };
        try {
          const reqs = (klassRule?.required_choices_at_level || {});
          Object.keys(reqs).forEach((lvl)=>{
            const h = reqs[lvl] || {};
            if (h.fighting_style && (classFightingStyle || (perLvl[lvl]?.fighting_style))) {
              perLvl[lvl] = { ...(perLvl[lvl] || {}), fighting_style: perLvl[lvl]?.fighting_style || classFightingStyle };
            }
          });
        } catch (_) {}

        // Populate per_level with actual user choices for each level
        for (let i = 1; i <= Number(level || 1); i++) {
          if (!perLvl[i]) {
            perLvl[i] = {
              asi: { choices: {} },
              skills: [],
              spells: [],
              cantrips: [],
              prepared: [],
              instruments: [],
              subclass_id: null,
              fighting_style: null
            };
          }
          
          // Add actual user choices for level 1
          if (i === 1) {
            perLvl[i] = {
              ...perLvl[i],
              skills: classSkillPicks || [],
              instruments: classInstrumentPicks || [],
              cantrips: pickedCantrips || [],
              spells: pickedSpells || [],
              subclass_id: classSubclassId || null,
              fighting_style: classFightingStyle || null
            };
          }
          
          // Add ASI choices if they exist for this level
          const levelPicks = classPicksByLevel[i];
          if (levelPicks?.asi) {
            perLvl[i].asi = levelPicks.asi;
          }
        }

        // Adicionar features ganhas por nível
        const featuresByLevel = {};
        for (let i = 1; i <= Number(level || 1); i++) {
          const levelRow = (klassLevels || []).find((cl) => Number(cl.level) === i);
          if (levelRow && levelRow.features) {
            featuresByLevel[i] = Array.isArray(levelRow.features) ? levelRow.features : [];
          }
        }

        // Criar sheet com metadata incluindo escolhas de classe e picks por nível
        const sheetRes = await sheetsApi.create({
          character_id: createdChar.id,
          race_id: raceId,
          sub_race_id: subRaceId || null,
          str: finalStr, dex: finalDex, con: finalCon, int: finalInt, wis: finalWis, cha: finalCha,
          hp_max: initHp,
          hp_current: initHp,
          temp_hp: 0,
          metadata: {
            // Dados essenciais para normalização
            race_choices: raceChoices,
            background: backgroundName || null,
            background_key: backgroundKey || null,
            alignment: alignmentKey ? { index: alignmentKey, name: (alignmentMap[alignmentKey]?.name || alignmentDetails?.name || alignmentKey), desc: alignmentDetails?.desc || null } : null,
            background_proficiencies: backgroundProfs,
            race_bonuses_applied: raceBonuses,
            current_level: Number(level) || 1,
            race_summary: raceSummary,
            class_summary: classSummary,
            features_by_level: featuresByLevel,
            class_choices: {
              // Top-level mirrors used by backend guards and services
              instruments: (classInstrumentPicks || []).map(i => i?.name || i),
              instruments_selected: (classInstrumentPicks || []).map(i => i?.name || i),
              skills: (classSkillPicks || []).map(s => s?.name || s),
              skills_selected: (classSkillPicks || []).map(s => s?.name || s),
              fighting_style: classFightingStyle?.name || classFightingStyle || null,
              subclass_id: classSubclassId || null,
              asi: null,
              // Per-level normalized map consumed by LevelUpService.persist_known_spells!
              per_level: perLvl
            }
          }
        });
        const sheet = sheetRes.sheet || sheetRes;

        // Humano Variante: aplicar talento apenas se modo selecionado for 'feat'
        try {
          if (ruleId === 'human' && subRuleId === 'variant') {
            const hv = raceChoices?.variantHumanASI || null;
            if (hv && hv.mode === 'feat' && (hv.featId || hv.featName)) {
              const toLower = (id) => (id ? String(id).toLowerCase() : null);
              const toNames = (arr) => Array.isArray(arr) ? arr.map(x => (x && typeof x === 'object') ? (x.name || x.id || x) : x) : [];
              const choices = {};
              const raw = hv.choices || {};
              if (raw.ability) choices.ability = toLower(raw.ability);
              if (raw.saving_throws) choices.saving_throws = toLower(raw.saving_throws);
              if (raw.cantrips) choices.cantrips = toNames(raw.cantrips);
              if (raw.spells) choices.spells = toNames(raw.spells);
              if (raw.klass_id) choices.klass_id = raw.klass_id;
              if (raw.cantrip_class) choices.cantrip_class = raw.cantrip_class;
              if (raw.spell_class) choices.spell_class = raw.spell_class;
              await apiClient.post(`/api/v1/player/sheets/${sheet.id}/assign_feat`, {
                feat_id: hv.featId || hv.featName,
                level_gained: 1,
                choices
              });
            }
          }
        } catch (e) {
          console.warn('Humano Variante: falha ao aplicar talento inicial', e);
        }

        // Aplicar background se selecionado
        if (backgroundKey && backgroundData) {
          try {
            await apiClient.post(`/api/v1/player/sheets/${sheet.id}/assign_background`, {
              key: backgroundKey,
              choices: backgroundChoices,
              background_data: backgroundData // Dados estruturados com source identificado
            });
          } catch (e) {
            console.warn('Falha ao aplicar background:', e);
          }
          // Materializar equipamentos do background como itens iniciais (melhor esforço)
          try {
            const bg = backgroundIndexMap?.[backgroundKey];
            const eqList = Array.isArray(bg?.equipment) ? bg.equipment : [];
            for (const name of eqList) {
              if (!name) continue;
              await sheetItemsApi.create({
                sheet_id: sheet.id,
                item_index: null,
                item_name: String(name),
                category: 'background',
                quantity: 1,
                equipped: false,
                slot: null,
                source: 'background',
                props_json: {}
              });
            }
          } catch (e) {
            console.warn('Falha ao materializar itens do background', e);
          }
        }
        for (let i = 1; i <= Number(level || 1); i++) {
          const p = classPicksByLevel[i];
          const asi = p?.asi;
          console.log(`Level ${i}:`, { p, asi });
          
          if (asi && asi.mode === 'feat' && (asi.featId || asi.featName)) {
            try {
              console.log(`Aplicando feat ${asi.featId || asi.featName} no nível ${i}`);
              await apiClient.post(`/api/v1/player/sheets/${sheet.id}/assign_feat`, {
                feat_id: asi.featId || asi.featName,
                level_gained: i,
                choices: asi.choices || {}
              });
              console.log(`Feat ${asi.featId || asi.featName} aplicado com sucesso`);
            } catch (e) {
              console.warn('Falha ao aplicar feat:', e);
            }
          }
        }
        console.log('========================');
        
          // Cria a classe no nível desejado
          const createdSk = await sheetKlassesApi.create({
            sheet_id: sheet.id,
            klass_id: klassId,
            sub_klass_id: (klassRule?.subclass?.choose_level && Number(level) >= klassRule.subclass.choose_level ? classSubclassId || null : null),
            level: Number(level) || 1,
          });

        // Persist known/prepared spells conforme regras do nível
        const sk = (createdSk && createdSk.id) ? createdSk : null;
        if (sk) {
          const knownApi = crudFor('sheet_known_spells', role);
          const prepApi  = crudFor('sheet_prepared_spells', role);
          const lvlRow   = (klassLevels || []).find((cl) => Number(cl.level) === Number(level)) || {};
          const lvlRow1  = (klassLevels || []).find((cl) => Number(cl.level) === 1) || {};
          const preparedCaster = (klassRule?.spellcasting?.preparation === 'prepared');
          const preparedCasterL1 = (lvlRow1?.spellcasting && lvlRow1.spellcasting.spells_known == null);

          // Cantrips são sempre "conhecidas" (não preparadas)
          // Atribui cantrips iniciais até o limite do nível 1 (se houver)
          const canAt1 = Number(lvlRow1?.spellcasting?.cantrips_known ?? (klassRule?.spellcasting?.cantrips_known_at_1 || 0)) || 0;
          if (canAt1 > 0) {
            const pickedL1 = (pickedCantrips || []).slice(0, canAt1);
            for (const sp of pickedL1) {
              try { await knownApi.create({ sheet_klass_id: sk.id, spell_id: sp.id }); } catch (_) {}
            }
          }
          // Cantrips raciais (ex.: Alto Elfo) — também como conhecidas
          for (const sp of (raceCantripsExtraList || [])) {
            try {
              await knownApi.create({ sheet_klass_id: sk.id, spell_id: sp.id });
            } catch (e) { /* provável duplicata; ignorar */ }
          }
          // Magias com nível > 0: conhecidas para classes "known", preparadas para "prepared"
          // Magias nível 1 conhecidas (classes known) ou preparadas (prepared)
          const spellsKnownAt1 = (lvlRow1?.spellcasting && lvlRow1.spellcasting.spells_known != null) ? Number(lvlRow1.spellcasting.spells_known) : null;
          if (spellsKnownAt1 != null && spellsKnownAt1 > 0) {
            const pickedL1 = (pickedSpells || []).filter(s => (s.level || 1) <= 1).slice(0, spellsKnownAt1);
            for (const sp of pickedL1) {
              try { await knownApi.create({ sheet_klass_id: sk.id, spell_id: sp.id }); } catch (_) {}
            }
          } else if (preparedCasterL1) {
            // prepared no nível 1 — opcional, backend permite sem preparar
          }
          // Magias raciais (nível > 0) — preparadas se caster preparado; caso contrário, conhecidas
          for (const sp of (raceSpellsExtraList || [])) {
            try {
              if (preparedCaster) {
                await prepApi.create({ sheet_id: sheet.id, spell_id: sp.id, auto: true });
              } else {
                await knownApi.create({ sheet_klass_id: sk.id, spell_id: sp.id });
              }
            } catch (e) { /* provável duplicata; ignorar */ }
          }
          
          // Processar magias preparadas do classPicksByLevel
          for (let i = 1; i <= Number(level || 1); i++) {
            const levelPicks = classPicksByLevel[i];
            if (levelPicks?.prepared && Array.isArray(levelPicks.prepared)) {
              for (const sp of levelPicks.prepared) {
                try {
                  await prepApi.create({ 
                    sheet_id: sheet.id, 
                    spell_id: sp.id, 
                    auto: false,
                    level_gained: i
                  });
                } catch (e) { 
                  console.warn('Falha ao salvar magia preparada:', sp.name, e);
                }
              }
            }
          }

          // Persistir magias conhecidas (todas as escolhidas até o nível atual)
          try {
            const seenKnown = new Set();
            // incluir as já persistidas acima (cantrips nível 1 e raciais)
            for (let i = 1; i <= Number(level || 1); i++) {
              const row = classPicksByLevel[i] || {};
              const all = [];
              if (Array.isArray(row.cantrips)) all.push(...row.cantrips);
              if (Array.isArray(row.spells)) all.push(...row.spells);
              for (const sp of all) {
                const sid = sp.id;
                if (!sid || seenKnown.has(sid)) continue;
                try { await knownApi.create({ sheet_klass_id: sk.id, spell_id: sid }); } catch (_) {}
                seenKnown.add(sid);
              }
            }
          } catch (e) { console.warn('Falha ao persistir magias conhecidas por nível', e); }
        }

        // SheetKlass já foi criada no nível correto, não precisa de level up

        // Persistir equipamentos escolhidos no passo Equipamentos
        try {
          for (const it of (equipmentPicks || [])) {
            await sheetItemsApi.create({
              sheet_id: sheet.id,
              item_index: it.item_index || it.index || null,
              item_name: it.item_name || it.name,
              category: it.category || null,
              quantity: Number(it.quantity || 1),
              equipped: !!it.equipped,
              slot: it.slot || null,
              source: it.source || 'class',
              props_json: it.props || it.props_json || {}
            });
          }
        } catch (e) {
          console.warn('Falha ao persistir equipamentos iniciais', e);
        }
      }

      setSuccessMessage("Personagem criado com sucesso!");
      onSave(response.character || response);  
      resetForm();
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
          steps={steps}
          currentStep={step}
          onStepChange={handleStepChange}
          onCancel={onClose}
          onBack={handleBack}
          onNext={handleNext}
          canGoBack={step > 1}
          canGoNext={canGoNext()}
          nextLabel={step === 6 ? "Criar Personagem" : "Próximo"}
          showCancel={true}
          showBack={step > 1}
          showNext={step !== 5}
          nextDisabled={!canGoNext()}
        />
        <div className={styles.creationContainer}>
        {step === 3 && (
          <FeaturesSidebar
            rule={klassRule}
            klassLevels={klassLevels}
            picksByLevel={classPicksByLevel}
            maxLevel={level}
            raceCantripsExtra={raceCantripsExtraList}
            raceSpellsExtra={raceSpellsExtraList}
            subKlasses={subKlasses}
            selectedKlassId={selectedKlass?.id}
            spellDict={spellDict}
          />
        )}
        <form onSubmit={handleSubmit} className={`${styles.form} ${styles.mainColumn}`}>
          {error && <div className={styles.error}>{error}</div>}
          {successMessage && <div className={styles.success}>{successMessage}</div>}
          {step === 1 && (
            <>
              <label className={styles.label}>Raça:</label>
              <Select placeholder="Selecione a raça" options={races} value={raceId} onChange={(val)=>{setRaceId(val); setSubRaceId("");}} />
              <label className={styles.label}>Sub‑raça:</label>
              <Select placeholder="Selecione a sub‑raça" options={subRaces.filter(sr=>!raceId || sr.race_id===raceId)} value={subRaceId} onChange={(val)=>setSubRaceId(val)} disabled={!raceId || subRaces.filter(sr=>!raceId || sr.race_id===raceId).length === 0} />
              {/* Opções específicas por raça/sub‑raça */}
              <RaceOptionsSwitch
                ruleId={ruleId}
                subRuleId={subRuleId}
                picks={raceChoices}
                setPicks={setRaceChoices}
                wizardCantripOptions={wizardCantripOptions}
                cantripOptions={cantripOptions}
                skillOptions={PROF_OPTIONS}
                klasses={klasses}
              />

              {rule && rule.languages && rule.languages.choiceCount > 0 && (
                <LanguageSelect
                  title={`Idiomas extras`}
                  options={(rule.languages.choiceList || ['Anão','Élfico','Halfling','Dracônico','Gnômico','Orc','Infernal']).filter(l=>!(rule.languages.always||[]).includes(l))}
                  value={raceChoices?.extraLanguages || []}
                  choose={rule.languages.choiceCount}
                  onChange={(ids)=>setRaceChoices({ ...(raceChoices||{}), extraLanguages: ids })}
                />
              )}

              {rule && (
                <div className={styles.panel} style={{marginTop: 12}}>
                  <div className={styles.panelTitle}>Resumo da Raça</div>
                  <RacePreview rule={rule} subRuleId={subRuleId} picks={raceChoices} />
                </div>
              )}

              {/* Método e pool de atributos */}
              <div className={styles.panel} style={{marginTop: 12}}>
                <div className={styles.panelTitle}>Método de Atributos</div>
                <div className={styles.radioGroup}>
                  <div className={styles.radioOption}>
                    <input
                      type="radio"
                      name="attrMethod"
                      className={styles.radioInput}
                      checked={abilityMethod === 'point_buy'}
                      onChange={()=>{ setAbilityMethod('point_buy'); setRolledScores([]); }}
                    />
                    <span className={styles.radioLabel}>Point Buy</span>
                  </div>
                  <div className={styles.radioOption}>
                    <input
                      type="radio"
                      name="attrMethod"
                      className={styles.radioInput}
                      checked={abilityMethod === 'roll_4d6' && rolledScores.length !== 6}
                      onChange={()=>{ setRolledScores([]); setAbilityMethod('roll_4d6'); }}
                    />
                    <span className={styles.radioLabel}>Rolar 4d6 (descarta 1)</span>
                  </div>
                  <div className={styles.radioOption}>
                    <input
                      type="radio"
                      name="attrMethod"
                      className={styles.radioInput}
                      checked={abilityMethod === 'roll_4d6' && rolledScores.join(',') === '15,14,13,12,10,8'}
                      onChange={()=>{ setAbilityMethod('roll_4d6'); setRolledScores([15,14,13,12,10,8]); }}
                    />
                    <span className={styles.radioLabel}>Standard Array (15,14,13,12,10,8)</span>
                  </div>
                </div>

                {abilityMethod === 'roll_4d6' && (
                  <>
                    <div className={styles.small}>
                      Clique para gerar 6 valores. Você irá distribuí-los no próximo passo.
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
                      <Button type="button" variant="secondary" onClick={rollSixScores}>Rolar 6 valores</Button>
                      {rolledScores.length === 6 && (
                        <div className={styles.small}>Valores: {rolledScores.join(', ')}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

        {step === 3 && (
          <>
            <ClassStepper
              klasses={klasses}
              classRules={classRules}
              dicts={classDicts}
              klassLevels={klassLevels}
              klassId={klassId}
              setKlassId={setKlassId}
              level={level}
              setLevel={(v)=>setLevel(v)}
              classSkillPicks={classSkillPicks}
              setClassSkillPicks={setClassSkillPicks}
              classInstrumentPicks={classInstrumentPicks}
              setClassInstrumentPicks={setClassInstrumentPicks}
              classFightingStyle={classFightingStyle}
              setClassFightingStyle={setClassFightingStyle}
              pickedCantrips={pickedCantrips}
              setPickedCantrips={setPickedCantrips}
              pickedSpells={pickedSpells}
              setPickedSpells={setPickedSpells}
              classSubclassId={classSubclassId}
              setClassSubclassId={setClassSubclassId}
              cantripOptions={cantripOptions}
              spellOptions={spellOptions}
              spellCatalog={spellCatalog}
              CLASS_NAME_MAP={CLASS_NAME_MAP}
              asiChoice={asiChoice}
              setAsiChoice={setAsiChoice}
              classPicksByLevel={classPicksByLevel}
              setClassPicksByLevel={setClassPicksByLevel}
              excludeSkillIds={(backgroundProfs || []).map(s=> (typeof s==='string'? s : (s?.id || s?.name || '')))}
              raceCantripsExtra={raceCantripsExtraList}
              raceSpellsExtra={raceSpellsExtraList}
              raceLockedSkillIds={raceSkillProfIds}
              raceSelectedFeatId={raceSelectedFeatId}
              backgroundProfs={backgroundProfs}
              abilityScores={{
                str: eff(str,'str'),
                dex: eff(dex,'dex'),
                con: eff(con,'con'),
                int: eff(intA,'int'),
                wis: eff(wis,'wis'),
                cha: eff(cha,'cha')
              }}
              onCancel={onClose}
              onBack={() => setStep(2)}
              attributesReady={
                abilityMethod !== 'roll_4d6' || (
                  Array.isArray(rolledScores) && rolledScores.length === 6 &&
                  [str,dex,con,intA,wis,cha].every(v => Number(v) > 0)
                )
              }
              onProceedToFinalize={() => setStep(5)}
              canLevelUp={canLevelUp}
              getLevelUpErrors={getLevelUpErrors}
            />
            {/* ClassStepper controla a UI de classe/subclasse e magias */}
          </>
        )}

          {step === 2 && (
            <StepBackground
              backgroundKey={backgroundKey}
              setBackgroundKey={setBackgroundKey}
              backgroundName={backgroundName}
              setBackgroundName={setBackgroundName}
              backgroundProfs={backgroundProfs}
              setBackgroundProfs={setBackgroundProfs}
              backgroundOptions={backgroundOptions}
              backgroundIndexMap={backgroundIndexMap}
              backgroundChoices={backgroundChoices}
              setBackgroundChoices={setBackgroundChoices}
              onValidationChange={handleBackgroundValidation}
            />
          )}

          {step === 4 && (
            <StepAlignment
              alignmentKey={alignmentKey}
              setAlignmentKey={setAlignmentKey}
              alignmentDetails={alignmentDetails}
              alignmentMap={alignmentMap}
              alignments={alignments}
            />
          )}

          {step === 5 && (
            <StepEquipment
              allowedArmorCats={allowedArmorCats}
              allowedWeaponCats={allowedWeaponCats}
              picks={equipmentPicks}
              setPicks={setEquipmentPicks}
              onBack={() => setStep(4)}
              onNext={() => setStep(6)}
            />
          )}

          {step === 6 && (
            <>
              <DialogDescription>Finalizar e Detalhar</DialogDescription>
              <label className={styles.label}>Nome do Personagem:</label>
              <Input value={name} onChange={(e)=>setName(e.target.value)} required />
              <hr className={styles.divider}/>
              
              <div className={styles.summaryContainer}>
                <DialogDescription>Resumo do Personagem</DialogDescription>
                
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <strong>Raça/Sub‑raça:</strong> {races.find(r=>r.id===raceId)?.name} {subRaceId ? `/ ${subRaces.find(s=>s.id===subRaceId)?.name}`: ''}
                  </div>
                  
                  <div className={styles.summaryItem}>
                    <strong>Classe/Subclasse:</strong> {klasses.find(k=>k.id===klassId)?.name} {classSubclassId ? `/ ${(() => { const ruleKey = CLASS_NAME_MAP[klasses.find(k=>k.id===klassId)?.name] || ''; const opts = (classRules[ruleKey]?.subclass?.options)||{}; const o = Object.values(opts).find(x=>x.id===classSubclassId); return o?.name || ''; })()}`: ''} (Nível {level})
                  </div>
                  
                  <div className={styles.summaryItem}>
                    <strong>Alinhamento:</strong> {alignmentMap[alignmentKey]?.name || alignmentKey}
                  </div>
                  
                  <div className={styles.summaryItem}>
                    <strong>Background:</strong> {backgroundName}
                  </div>
                  
                  <div className={styles.summaryItem}>
                    <strong>Atributos finais:</strong> FOR {eff(str,'str')} DES {eff(dex,'dex')} CON {eff(con,'con')} INT {eff(intA,'int')} SAB {eff(wis,'wis')} CAR {eff(cha,'cha')}
                  </div>
                  
                  <div className={styles.summaryItem}>
                    <strong>Cantrips:</strong> {[...pickedCantrips.map(s=>s.name), ...featCantrips].filter(Boolean).join(', ') || 'Nenhum'}
                    {featCantrips.length > 0 && (
                      <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                        (incluindo {featCantrips.length} de feats)
                      </span>
                    )}
                  </div>
                  
                  <div className={styles.summaryItem}>
                    <strong>Magias:</strong> {[...pickedSpells.map(s=>s.name), ...featSpells].filter(Boolean).join(', ') || 'Nenhuma'}
                    {featSpells.length > 0 && (
                      <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                        (incluindo {featSpells.length} de feats)
                      </span>
                    )}
                  </div>
                </div>
                
                {/* ASI Summary Panel */}
                <div style={{ marginTop: 24 }}>
                  <ASISummaryPanel 
                    classPicksByLevel={classPicksByLevel} 
                    level={level} 
                  />
                </div>
              </div>
            </>
          )}
        </form>
        {step >= 1 && (
        <AttributesSidePanel
          str={str} setStr={setStr}
          dex={dex} setDex={setDex}
          con={con} setCon={setCon}
          intA={intA} setIntA={setIntA}
          wis={wis} setWis={setWis}
          cha={cha} setCha={setCha}
          raceBonuses={raceBonuses}
          asiBonuses={asiBonuses}
          remainingPoints={remainingPoints}
          abilityMethod={abilityMethod}
          level={level}
          classSavingThrows={klassRule?.saving_throws || []}
          classSkillPicks={classSkillPicks}
          backgroundProfs={backgroundProfs}
          raceSkillProfs={raceSkillProfIds}
          rolledScores={rolledScores}
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
          steps={steps}
          currentStep={step}
          onStepChange={handleStepChange}
          onCancel={onClose}
          onBack={handleBack}
          onNext={handleNext}
          canGoBack={step > 1}
          canGoNext={canGoNext()}
          nextLabel={step === 6 ? "Criar Personagem" : "Próximo"}
          showCancel={true}
          showBack={step > 1}
          showNext={step !== 5}
          nextDisabled={!canGoNext()}
        />
        <div className={styles.creationContainer}>
        {step === 3 && (
          <FeaturesSidebar
            rule={klassRule}
            klassLevels={klassLevels}
            picksByLevel={classPicksByLevel}
            maxLevel={level}
            raceCantripsExtra={raceCantripsExtraList}
            raceSpellsExtra={raceSpellsExtraList}
            subKlasses={subKlasses}
            selectedKlassId={selectedKlass?.id}
            spellDict={spellDict}
          />
        )}
        <form onSubmit={handleSubmit} className={`${styles.form} ${styles.mainColumn}`}>
          {error && <div className={styles.error}>{error}</div>}
          {successMessage && <div className={styles.success}>{successMessage}</div>}
          {step === 1 && (
            <>
              <label className={styles.label}>Raça:</label>
              <Select placeholder="Selecione a raça" options={races} value={raceId} onChange={(val)=>{setRaceId(val); setSubRaceId("");}} />
              <label className={styles.label}>Sub‑raça:</label>
              <Select placeholder="Selecione a sub‑raça" options={subRaces.filter(sr=>!raceId || sr.race_id===raceId)} value={subRaceId} onChange={(val)=>setSubRaceId(val)} disabled={!raceId || subRaces.filter(sr=>!raceId || sr.race_id===raceId).length === 0} />
              {/* Opções específicas por raça/sub‑raça */}
              <RaceOptionsSwitch
                ruleId={ruleId}
                subRuleId={subRuleId}
                picks={raceChoices}
                setPicks={setRaceChoices}
                wizardCantripOptions={wizardCantripOptions}
                cantripOptions={cantripOptions}
                skillOptions={PROF_OPTIONS}
              />

              {rule && rule.languages && rule.languages.choiceCount > 0 && (
                <LanguageSelect
                  title={`Idiomas extras`}
                  options={(rule.languages.choiceList || ['Anão','Élfico','Halfling','Dracônico','Gnômico','Orc','Infernal']).filter(l=>!(rule.languages.always||[]).includes(l))}
                  value={raceChoices?.extraLanguages || []}
                  choose={rule.languages.choiceCount}
                  onChange={(ids)=>setRaceChoices({ ...(raceChoices||{}), extraLanguages: ids })}
                />
              )}

              {rule && (
                <div className={styles.panel} style={{marginTop: 12}}>
                  <div className={styles.panelTitle}>Resumo da Raça</div>
                  <RacePreview rule={rule} subRuleId={subRuleId} picks={raceChoices} />
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
                  {rolledScores.length === 6 && (
                    <div className={styles.small}>Valores: {rolledScores.join(', ')}</div>
                  )}
                </div>
              </div>
            </>
          )}

        {step === 3 && (
          <>
            <ClassStepper
              klasses={klasses}
              classRules={classRules}
              dicts={classDicts}
              klassLevels={klassLevels}
              klassId={klassId}
              setKlassId={setKlassId}
              level={level}
              setLevel={(v)=>setLevel(v)}
              classSkillPicks={classSkillPicks}
              setClassSkillPicks={setClassSkillPicks}
              classInstrumentPicks={classInstrumentPicks}
              setClassInstrumentPicks={setClassInstrumentPicks}
              classFightingStyle={classFightingStyle}
              setClassFightingStyle={setClassFightingStyle}
              pickedCantrips={pickedCantrips}
              setPickedCantrips={setPickedCantrips}
              pickedSpells={pickedSpells}
              setPickedSpells={setPickedSpells}
              classSubclassId={classSubclassId}
              setClassSubclassId={setClassSubclassId}
              cantripOptions={cantripOptions}
              spellOptions={spellOptions}
              spellCatalog={spellCatalog}
              CLASS_NAME_MAP={CLASS_NAME_MAP}
              asiChoice={asiChoice}
              setAsiChoice={setAsiChoice}
              classPicksByLevel={classPicksByLevel}
              setClassPicksByLevel={setClassPicksByLevel}
              excludeSkillIds={(backgroundProfs || []).map(s=> (typeof s==='string'? s : (s?.id || s?.name || '')))}
              raceCantripsExtra={raceCantripsExtraList}
              raceSpellsExtra={raceSpellsExtraList}
              raceLockedSkillIds={raceSkillProfIds}
              backgroundProfs={backgroundProfs}
              abilityScores={{
                str: eff(str,'str'),
                dex: eff(dex,'dex'),
                con: eff(con,'con'),
                int: eff(intA,'int'),
                wis: eff(wis,'wis'),
                cha: eff(cha,'cha')
              }}
              onCancel={onClose}
              onBack={() => setStep(2)}
              attributesReady={
                abilityMethod !== 'roll_4d6' || (
                  Array.isArray(rolledScores) && rolledScores.length === 6 &&
                  [str,dex,con,intA,wis,cha].every(v => Number(v) > 0)
                )
              }
              onProceedToFinalize={() => setStep(5)}
              canLevelUp={canLevelUp}
              getLevelUpErrors={getLevelUpErrors}
            />
            {/* ClassStepper controla a UI de classe/subclasse e magias */}
          </>
        )}

          {step === 4 && (
            <>
              <label className={styles.label}>Alinhamento:</label>
              <div className={styles.panel}>
                <div className={styles.panelTitle}>Selecione um alinhamento</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    ['lawful-good','neutral-good','chaotic-good'],
                    ['lawful-neutral','neutral','chaotic-neutral'],
                    ['lawful-evil','neutral-evil','chaotic-evil'],
                  ].flat().map((idx) => {
                    const a = alignmentMap[idx] || alignments.find(x=>x.index===idx);
                    const active = alignmentKey === idx;
                    return (
                      <button key={idx} type="button" onClick={()=>setAlignmentKey(idx)} className={`${styles.stepTab} ${active ? styles.active : ''}`}>
                        {a?.name || idx}
                      </button>
                    );
                  })}
                </div>
                {!!alignmentDetails?.desc && (
                  <div className={styles.small} style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{alignmentDetails.desc}</div>
                )}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <DialogDescription>Equipamentos</DialogDescription>
              <label className={styles.label}>Nome do Personagem:</label>
              <Input value={name} onChange={(e)=>setName(e.target.value)} required />
              <hr className={styles.divider}/>
              <DialogDescription>Resumo</DialogDescription>
              <div>Raça/Sub‑raça: {races.find(r=>r.id===raceId)?.name} {subRaceId ? `/ ${subRaces.find(s=>s.id===subRaceId)?.name}`: ''}</div>
              <div>Classe/Subclasse: {klasses.find(k=>k.id===klassId)?.name} {classSubclassId ? `/ ${(() => { const ruleKey = CLASS_NAME_MAP[klasses.find(k=>k.id===klassId)?.name] || ''; const opts = (classRules[ruleKey]?.subclass?.options)||{}; const o = Object.values(opts).find(x=>x.id===classSubclassId); return o?.name || ''; })()}`: ''} (Nível {level})</div>
              <div>Alinhamento: {alignmentMap[alignmentKey]?.name || alignmentKey}</div>
              <div>Atributos finais: FOR {eff(str,'str')} DES {eff(dex,'dex')} CON {eff(con,'con')} INT {eff(intA,'int')} SAB {eff(wis,'wis')} CAR {eff(cha,'cha')}</div>
              <div>
                <strong>Cantrips:</strong> {[...pickedCantrips.map(s=>s.name), ...featCantrips].filter(Boolean).join(', ') || 'Nenhum'}
                {featCantrips.length > 0 && (
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                    (incluindo {featCantrips.length} de feats)
                  </span>
                )}
              </div>
              <div>
                <strong>Magias:</strong> {[...pickedSpells.map(s=>s.name), ...featSpells].filter(Boolean).join(', ') || 'Nenhuma'}
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
        {step >= 1 && (
        <AttributesSidePanel
          str={str} setStr={setStr}
          dex={dex} setDex={setDex}
          con={con} setCon={setCon}
          intA={intA} setIntA={setIntA}
          wis={wis} setWis={setWis}
          cha={cha} setCha={setCha}
          raceBonuses={raceBonuses}
          asiBonuses={asiBonuses}
          remainingPoints={remainingPoints}
          abilityMethod={abilityMethod}
          level={level}
          classSavingThrows={klassRule?.saving_throws || []}
          classSkillPicks={classSkillPicks}
          backgroundProfs={backgroundProfs}
          raceSkillProfs={raceSkillProfIds}
          rolledScores={rolledScores}
          styles={styles}
        />
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerCharacterFormDialog;
