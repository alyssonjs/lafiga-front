"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../_context/AuthContext";
import { crudFor } from "../../_services/railsApi";
import { apiClient } from "../../_lib/api/client";

import { Card, CardHeader, CardTitle, CardContent } from "../UI/Card";
import AttributesSidePanel from "../characterSteps/AttributesSidePanel";
import SpellsKnownPanel from "../SpellsKnownPanel";
import SpellSlotsPanel from "../SpellSlotsPanel";
import CharacterHeader from "./CharacterHeader";
import TraitsProfsPanel from "./TraitsProfsPanel";
import VitalStatsPanel from "./VitalStatsPanel";
import ConjurationPanel from "./ConjurationPanel";
import FighterPanel from "./FighterPanel";
import BarbarianPanel from "./BarbarianPanel";
import FighterCombatExtras from "./FighterCombatExtras";
import BattleMasterPanel from "./BattleMasterPanel";
import WarlockInvocationsPanel from "./WarlockInvocationsPanel";
import WarlockArcanumPanel from "./WarlockArcanumPanel";
import DruidWildShapesPanel from "./DruidWildShapesPanel";
import SorcererMetamagicPanel from "./SorcererMetamagicPanel";
import SneakAttackPanel from "./SneakAttackPanel";
import CombatExtrasPanel from "./CombatExtrasPanel";
import FeaturesList from "./FeaturesList";
import WeaponsPanel from "./WeaponsPanel";
import ChatWidget from "../chat/ChatWidget";
import FeatsPanel from "../characterSteps/FeatsPanel";
import styles from "../../_styles/character/CharacterForm.module.css";
import MonkDisciplinesPanel from "./MonkDisciplinesPanel";
import MonkShadowArtsPanel from "./MonkShadowArtsPanel";
import MonkOpenHandPanel from "./MonkOpenHandPanel";
import PaladinOathPanel from "./PaladinOathPanel";
import RangerCompanionPanel from "./RangerCompanionPanel";

// Responsive helper: detect mobile viewport
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setIsMobile(window.innerWidth <= breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

// Simple Accordion wrapper to reuse panels on mobile
function AccordionSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          background: 'var(--primary, #1f2937)',
          color: '#fff',
          padding: '10px 12px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>{title}</span>
        <span style={{ opacity: 0.9 }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div style={{ background: 'var(--medium)', padding: 12 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function subclassLabelFor(name = '') {
  const n = String(name || '').toLowerCase();
  if (n.includes('bardo') || n.includes('bard')) return 'Colégio';
  if (n.includes('bruxo') || n.includes('warlock')) return 'Patrono';
  if (n.includes('clérigo') || n.includes('cleric')) return 'Domínio';
  if (n.includes('druida') || n.includes('druid')) return 'Círculo';
  if (n.includes('guerreiro') || n.includes('fighter')) return 'Arquétipo';
  if (n.includes('ladino') || n.includes('rogue')) return 'Arquétipo';
  if (n.includes('mago') || n.includes('wizard')) return 'Escola';
  if (n.includes('monge') || n.includes('monk')) return 'Tradição';
  if (n.includes('paladino') || n.includes('paladin')) return 'Juramento';
  if (n.includes('patrulheiro') || n.includes('ranger')) return 'Conclave';
  if (n.includes('bárbaro') || n.includes('barbarian') || n.includes('barbaro')) return 'Caminho';
  return 'Subclasse';
}

export default function GenericClassPage() {
  const isMobile = useIsMobile();
  const search = useSearchParams();
  const cid = search?.get('cid');
  const { role } = useAuth();
  const charactersApi = useMemo(() => crudFor("characters", role || 'player'), [role]);
  const sheetItemsApi = useMemo(() => crudFor("sheet_items", role || 'player'), [role]);
  const cfApi = useMemo(() => crudFor("characters_features", role || 'player'), [role]);

  const [error, setError] = useState(null);
  const [ident, setIdent] = useState({ nome: '—', raca: '—', antecedente: '—', tendencia: '—', xp: '0' });
  const [primarios, setPrimarios] = useState({ ca: '—', iniciativa: '—', desloc: '—', vida: { atual: '—', max: '—' } });
  const [atributos, setAtributos] = useState([
    { a: "FOR", s: '—', m: 0 },
    { a: "DES", s: '—', m: 0 },
    { a: "CON", s: '—', m: 0 },
    { a: "INT", s: '—', m: 0 },
    { a: "SAB", s: '—', m: 0 },
    { a: "CAR", s: '—', m: 0 },
  ]);
  const [cantrips, setCantrips] = useState([]);
  const [magias, setMagias] = useState([]);
  const [classe, setClasse] = useState({ id: null, name: 'Classe', hit_die: 'd8' });
  const [nivel, setNivel] = useState(1);
  const [features, setFeatures] = useState([]);
  const [tracosRaciais, setTracosRaciais] = useState([]);
  const [slotCounts, setSlotCounts] = useState(Array(9).fill(0));
  const [knownByLevel, setKnownByLevel] = useState({});
  const [spellDict, setSpellDict] = useState({});
  const [preparedByLevel, setPreparedByLevel] = useState({});
  const [autoPreparedIds, setAutoPreparedIds] = useState([]);
  const [circleSpellIds, setCircleSpellIds] = useState([]);
  // Merge helper: ensure Druid Land terrain circle spells appear as always-prepared even if BE summary omitted them
  const mergeTerrainAlwaysPrepared = async (s, pbIn) => {
    try {
      const main = (s.klasses || []).reduce((a,b)=> (a && a.level > b.level) ? a : b, null);
      if (!main) return { pb: pbIn, auto: autoPreparedIds };
      const cname = String(main.name || '').toLowerCase();
      if (!(cname.includes('druida') || cname.includes('druid'))) return { pb: pbIn, auto: autoPreparedIds };
      const subName = String(main.subclass?.name || '').toLowerCase();
      const isLand = subName.includes('terra') || subName.includes('land');
      if (!isLand) return { pb: pbIn, auto: autoPreparedIds };
      // Determine chosen terrain from metadata
      const per = (metaState?.class_choices?.per_level) || {};
      let pickedTerrain = null;
      try {
        const keys = Object.keys(per).map(n=>Number(n)).sort((a,b)=>a-b);
        for (const lv of keys) {
          const row = per[String(lv)] || per[lv] || {};
          const t = row.terrain || row.terreno || null;
          if (t) { pickedTerrain = (typeof t === 'object') ? (t.id || t.name || String(t)) : String(t); }
        }
      } catch(_) {}
      if (!pickedTerrain) return { pb: pbIn, auto: autoPreparedIds };
      // Fetch subclass list to obtain mapping by terrain
      const klassId = main.id;
      if (!klassId) return { pb: pbIn, auto: autoPreparedIds };
      const subRes = await apiClient.get(`/api/v1/public/klasses/${klassId}/subclasses`);
      const subs = subRes?.subclasses || [];
      const hit = subs.find(sc => String(sc?.name || '').toLowerCase() === subName);
      const byTerrain = hit?.always_prepared_by_terrain || {};
      if (!byTerrain || Object.keys(byTerrain).length === 0) return { pb: pbIn, auto: autoPreparedIds };
      const map = byTerrain[pickedTerrain] || byTerrain[String(pickedTerrain).toLowerCase()] || null;
      if (!map) return { pb: pbIn, auto: autoPreparedIds };
      // Compose additions up to current level
      const targetLvl = Number(main.level || 1);
      const pb = { ...(pbIn || {}) };
      const addIds = new Set();
      const dict = spellDict || {};
      const ensure = (lvl, entry) => {
        const key = String(lvl);
        pb[key] ||= [];
        const exists = pb[key].some(sp => {
          const a = (typeof sp === 'object') ? sp.name : sp;
          return a === entry.name;
        });
        if (!exists) pb[key].push({ id: entry.id || null, name: entry.name, always_prepared: true, circle: true });
        else {
          // Marcar existente como circle=true se já estiver presente
          pb[key] = pb[key].map(sp => {
            const nm = (typeof sp === 'object') ? sp.name : sp;
            if (nm === entry.name && typeof sp === 'object') return { ...sp, circle: true, always_prepared: (sp.always_prepared ?? true) };
            return sp;
          });
        }
      };
      const levels = Object.keys(map).map(n=>Number(n)).sort((a,b)=>a-b);
      for (const lvl of levels) {
        if (lvl > targetLvl) continue;
        const arr = map[String(lvl)] || [];
        for (const nm of (arr || [])) {
          let id = dict?.[nm]?.id || null;
          if (id == null) {
            try {
              const res = await apiClient.get('/api/v1/public/spells', { params: { name: nm } });
              const hits = Array.isArray(res.spells) ? res.spells : [];
              const hit = hits.find(sp => String(sp?.name || '').toLowerCase() === String(nm).toLowerCase());
              if (hit && hit.id != null) { id = Number(hit.id); }
            } catch(_) {}
          }
          if (id != null) addIds.add(Number(id));
          ensure(lvl, { id, name: nm });
        }
      }
      // Como é Druida, marcar todas always_prepared como circle (cobertura genérica)
      try {
        Object.keys(pb || {}).forEach((lvl) => {
          pb[lvl] = (pb[lvl] || []).map((sp) => (sp && typeof sp === 'object' && sp.always_prepared) ? { ...sp, circle: (sp.circle || true) } : sp);
        });
      } catch(_) {}
      return { pb, auto: Array.from(new Set([...(autoPreparedIds || []), ...Array.from(addIds)])), circle: Array.from(addIds) };
    } catch(_) {
      return { pb: pbIn, auto: autoPreparedIds, circle: [] };
    }
  };

  // Deriva always-prepared a partir do summary já carregado (sem depender do reloadSummary)
  useEffect(() => {
    try {
      const cat = summary?.spells?.catalog_by_id || {};
      const byName = {};
      Object.values(cat).forEach(sp => { if (sp?.name) byName[sp.name] = sp; });
      const pb = summary?.spells?.prepared_by_level || {};
      const ids = [];
      Object.values(pb).forEach(arr => {
        (arr || []).forEach(sp => {
          if (sp && sp.always_prepared) {
            if (sp.id != null) ids.push(Number(sp.id));
            else if (sp.name && byName[sp.name]?.id != null) ids.push(Number(byName[sp.name].id));
          }
        });
      });
      if (ids.length) setAutoPreparedIds(Array.from(new Set(ids)));
    } catch(_) {}
  }, [knownByLevel]);

  // Garante um refresh apenas na montagem (evita loops)
  useEffect(() => { try { reloadSummary(); } catch(_) {} }, []);
  const [metaState, setMetaState] = useState({});
  const [summary, setSummary] = useState({});
  const invocationSpellIds = useMemo(() => {
    try {
      // Map known invocations that grant spells → spell names
      const invToSpells = {
        'Armor of Shadows': ['Mage Armor'],
        'Mask of Many Faces': ['Disguise Self'],
        'Misty Visions': ['Silent Image'],
        'Beast Speech': ['Speak with Animals'],
        'Eldritch Sight': ['Detect Magic'],
        'Otherworldly Leap': ['Jump'],
        'Whispers of the Grave': ['Speak with Dead'],
        'Visions of Distant Realms': ['Arcane Eye'],
        'Mire the Mind': ['Slow'],
        'Sculptor of Flesh': ['Polymorph'],
        'Dreadful Word': ['Confusion'],
        'Sign of Ill Omen': ['Bestow Curse'],
        'Minions of Chaos': ['Conjure Elemental'],
        'Ascendant Step': ['Levitate'],
        'Bewitching Whispers': ['Compulsion'],
        'Thief of Five Fates': ['Bane'],
        'Master of Myriad Forms': ['Alter Self'],
        'Fiendish Vigor': ['False Life']
      };
      const per = metaState?.class_choices?.per_level || {};
      const names = [];
      Object.values(per).forEach((row) => {
        const arr = Array.isArray(row?.invocations) ? row.invocations : [];
        arr.forEach((x) => { const nm = (x && typeof x === 'object') ? (x.name || x.id || String(x)) : String(x); if (nm) names.push(nm); });
      });
      const wantSpells = new Set();
      names.forEach((inv) => { const list = invToSpells[inv]; if (Array.isArray(list)) list.forEach((s)=> wantSpells.add(s)); });
      const ids = [];
      wantSpells.forEach((nm) => { const sp = spellDict?.[nm]; if (sp?.id != null) ids.push(Number(sp.id)); });
      return Array.from(new Set(ids));
    } catch(_) { return []; }
  }, [metaState, spellDict]);
  const [subclassName, setSubclassName] = useState('—');
  // Tooltip source data
  const [baseScores, setBaseScores] = useState(null);
  const [abilitySources, setAbilitySources] = useState(null);
  const [featSkillProfs, setFeatSkillProfs] = useState([]);
  const [expertiseSkills, setExpertiseSkills] = useState([]);
  const fetchKeyRef = useRef(null);
  const hasKnown = useMemo(() => {
    try {
      const vals = Object.values(knownByLevel || {});
      return vals.some((arr) => (arr && arr.length > 0));
    } catch (_) { return false; }
  }, [knownByLevel]);
  const hasSlots = useMemo(() => (slotCounts || []).some((n) => Number(n) > 0), [slotCounts]);
  // Map spell name -> feat name(s) that granted it (for tooltips)
  const featSourcesBySpellName = useMemo(() => {
    const map = {};
    try {
      (summary?.feats || []).forEach((f) => {
        const fname = f?.name || 'Talento';
        const ch = f?.choices || {};
        const arr = []
          .concat(Array.isArray(ch?.cantrips) ? ch.cantrips : (Array.isArray(f?.cantrips) ? f.cantrips : []))
          .concat(Array.isArray(ch?.spells) ? ch.spells : (Array.isArray(f?.spells) ? f.spells : []));
        arr.forEach((x) => {
          const nm = (x && typeof x === 'object') ? (x.name || x.id) : x;
          if (!nm) return;
          const key = String(nm);
          if (map[key]) {
            // Avoid duplicates if multiple feats could grant same spell
            if (!String(map[key]).split(', ').includes(fname)) map[key] = `${map[key]}, ${fname}`;
          } else {
            map[key] = fname;
          }
        });
      });
    } catch(_) {}
    return map;
  }, [summary]);
  // Set com nomes de magias concedidas por talentos (para tag/tooltip)
  const featKnownNames = useMemo(() => {
    try {
      const set = new Set();
      (summary?.feats || []).forEach((f) => {
        const ch = f?.choices || {};
        const arr = []
          .concat(Array.isArray(ch?.cantrips) ? ch.cantrips : (Array.isArray(f?.cantrips) ? f.cantrips : []))
          .concat(Array.isArray(ch?.spells) ? ch.spells : (Array.isArray(f?.spells) ? f.spells : []));
        arr.forEach((x) => { const nm = (x && typeof x === 'object') ? (x.name || x.id) : x; if (nm) set.add(String(nm)); });
      });
      return set;
    } catch(_) { return new Set(); }
  }, [summary]);

  useEffect(() => {
    (async () => {
      try {
        if (!cid) { setError('Abra a partir de Meus Personagens.'); return; }
        const key = String(cid);
        if (fetchKeyRef.current === key) return;
        fetchKeyRef.current = key;

        // Fetch sheet directly via character_id to avoid loading all sheets
        const charRes = await charactersApi.getOne(cid);
        const sheet = charRes?.character?.sheet;
        if (!sheet) { setError('Ficha não encontrada.'); return; }
        const sumRes = await apiClient.get(`/api/v1/player/sheets/${sheet.id}/summary`);
        const s = sumRes.summary || {};
        setSummary(s);
        // Use classic sheet metadata and fields (original behavior)
        setMetaState({ ...(sheet.metadata || {}), temp_hp: Number(sheet.temp_hp || 0) });
        setIdent({
          nome: s.sheet?.name || sheet.character_name || '—',
          raca: [s.sheet?.race?.name, s.sheet?.race?.sub_race?.name].filter(Boolean).join(' / ') || '—',
          antecedente: (sheet.metadata?.background) || '-', tendencia: '-', xp: '0'
        });
        const sc = s.abilities?.scores || {}; const md = s.abilities?.mods || {};
        setAtributos([
          { a: 'FOR', s: sc.str, m: md.str },
          { a: 'DES', s: sc.dex, m: md.dex },
          { a: 'CON', s: sc.con, m: md.con },
          { a: 'INT', s: sc.int, m: md.int },
          { a: 'SAB', s: sc.wis, m: md.wis },
          { a: 'CAR', s: sc.cha, m: md.cha },
        ]);
        const desloc = s.movement?.speed_m || s.movement?.speed_ft || '—';
        setPrimarios({ ca: '—', iniciativa: '—', desloc, vida: { atual: sheet.hp_current, max: sheet.hp_max } });
        const main = (s.klasses || []).reduce((a,b)=> (a && a.level > b.level) ? a : b, null);
        if (main) {
          setClasse({ id: main.id, name: main.name || 'Classe', hit_die: main.hit_die || 'd8' });
          setNivel(main.level || 1);
          setSubclassName(main.subclass?.name || '—');
        }
        setSlotCounts((s.conjuration?.slots || Array(9).fill(0)).map(n=>Number(n)||0));
        setTracosRaciais((s.traits || []).map(t=>t.name));

        // Build tooltip data (ability and skill sources)
        try {
          const meta = sheet.metadata || {};
          // Base (sheet columns) before race/ASI
          setBaseScores({
            str: Number(sheet.str || 0), dex: Number(sheet.dex || 0), con: Number(sheet.con || 0),
            int: Number(sheet.int || 0), wis: Number(sheet.wis || 0), cha: Number(sheet.cha || 0)
          });
          const race = meta.race_bonuses_applied || {};
          // ASIs aggregated per ability
          const asiMap = { str:0, dex:0, con:0, int:0, wis:0, cha:0 };
          try {
            const per = meta?.class_choices?.per_level || {};
            Object.values(per).forEach((row) => {
              const a = row?.asi;
              if (a && a.mode === 'attributes') {
                const list = Array.isArray(a.attributes) ? a.attributes : [];
                const map = { STR:'str', DES:'dex', DEX:'dex', CON:'con', INT:'int', WIS:'wis', SAB:'wis', CHA:'cha', CAR:'cha' };
                if (list.length === 1) {
                  const key = String(list[0]?.id || list[0]).toUpperCase();
                  const k = map[key]; if (k) asiMap[k] = (asiMap[k] || 0) + 2;
                } else {
                  list.slice(0,2).forEach((att) => { const key = String(att?.id || att).toUpperCase(); const k = map[key]; if (k) asiMap[k] = (asiMap[k] || 0) + 1; });
                }
              }
            });
          } catch(_) {}
          // Feat ability bonuses and skill profs
          const abSources = { str: [], dex: [], con: [], int: [], wis: [], cha: [] };
          const featSkills = [];
          try {
            const featsMeta = Array.isArray(meta.feats) ? meta.feats : [];
            featsMeta.forEach((f) => {
              const fname = f?.name || 'Talento';
              const ab = f?.ability_bonuses || {};
              Object.entries(ab).forEach(([key, val]) => {
                const k = String(key || '').toLowerCase();
                const map = { str: 'str', dex: 'dex', con: 'con', int: 'int', wis: 'wis', cha: 'cha', for: 'str', des: 'dex', sab: 'wis', car: 'cha' };
                const norm = map[k];
                const v = Number(val) || 0;
                if (norm && v) abSources[norm].push({ label: `Talento ${fname}`, val: `+${v}` });
              });
              const pb = f?.proficiency_bonuses || {};
              (pb.skills || []).forEach((sname) => { if (sname) featSkills.push(sname); });
            });
          } catch(_) {}
          setFeatSkillProfs(featSkills);
          const comp = (key) => {
            const list = [];
            const base = Number(sheet[key] || 0);
            const r = Number(race[key] || 0);
            const a = Number(asiMap[key] || 0);
            list.push({ label: 'Dado/Base', val: base });
            if (r) list.push({ label: 'Raça', val: `+${r}` });
            if (a) list.push({ label: 'Incrementos/ASIs', val: `+${a}` });
            (abSources[key] || []).forEach((it) => list.push(it));
            return list;
          };
          setAbilitySources({ str: comp('str'), dex: comp('dex'), con: comp('con'), int: comp('int'), wis: comp('wis'), cha: comp('cha') });
          // Expertise skills from class choices
          const exps = [];
          try {
            const per = meta?.class_choices?.per_level || {};
            Object.values(per).forEach((row) => {
              const exp = row?.expertise_skills || row?.expertise;
              if (!exp) return;
              const arr = Array.isArray(exp) ? exp : [exp];
              arr.forEach((x) => { if (x) exps.push(x); });
            });
          } catch(_) {}
          setExpertiseSkills(exps);
        } catch(_) {}
        // Pool de seleção:
        // - Prepared (Clérigo/Druida/Paladino): lista completa da classe (available_by_level)
        // - Prepared (Mago): apenas grimório (known_by_level)
        // - Known casters: known_by_level
        const isPreparedMode = (s.conjuration?.mode === 'prepared');
        const isWizard = String(s.conjuration?.list_api || '').toLowerCase() === 'wizard';
        const pool = isPreparedMode ? (isWizard ? (s.spells?.known_by_level || {}) : (s.spells?.available_by_level || {})) : (s.spells?.known_by_level || {});
        setKnownByLevel(Object.fromEntries(Object.entries(pool).map(([lvl, arr]) => [lvl, (arr||[]).map(o => (typeof o === 'object' ? o.name : o))])));
        // Counts based only on known_by_level (não usar available_by_level para contagem)
        const knownOnly = s.spells?.known_by_level || {};
        const lvl0 = (knownOnly['0'] || []).length;
        const others = Object.entries(knownOnly).filter(([k]) => k !== '0').reduce((acc, [_, arr]) => acc + (arr||[]).length, 0);
        setCantrips(Array.from({length: lvl0}).map(()=>''));
        setMagias(Array.from({length: others}).map(()=>''));
        const catalog = s.spells?.catalog_by_id || {}; const byName = {};
        Object.values(catalog).forEach(sp => { if (sp?.name) byName[sp.name] = sp; });
        setSpellDict(byName);
        // Prepared spells diretamente do summary
        try {
          const rawPb = s.spells?.prepared_by_level || {};
          let pb = rawPb;
          let autoIds = [];
          Object.values(pb || {}).forEach(arr => (arr||[]).forEach(sp => { if (sp?.always_prepared && sp?.id != null) autoIds.push(Number(sp.id)); }));
          // Fallback merge for Druid Land terrain spells
          const merged = await mergeTerrainAlwaysPrepared(s, pb);
          pb = merged.pb;
          autoIds = Array.from(new Set([...(autoIds || []), ...((merged.auto)||[])]));
          setPreparedByLevel(pb);
          setAutoPreparedIds(autoIds);
          setCircleSpellIds(merged.circle || []);
        } catch(_) { setPreparedByLevel({}); setAutoPreparedIds([]); setCircleSpellIds([]); }
        const collected = (s.features || []).map(f => ({ id: f.id, lvl: f.level, name: f.name, desc: f.desc, show: (f.show !== false), pref_id: f.pref_id }));
        setFeatures(collected);
      } catch (e) {
        console.error(e); setError('Falha ao carregar a ficha.');
      }
    })();
  }, [cid]);

  // Cleric/Druid know the entire class list; show all spells grouped by level
  useEffect(() => {
    (async () => {
      try {
        if (!classe?.id || !classe?.name) return;
        // Se o summary já trouxe a lista disponível por nível, use-a e evite chamada extra
        if (summary?.conjuration?.mode === 'prepared') {
          const isWizard = String(summary?.conjuration?.list_api || '').toLowerCase() === 'wizard';
          const avail = isWizard ? (summary.spells.known_by_level || {}) : (summary.spells.available_by_level || {});
          setKnownByLevel(Object.fromEntries(Object.entries(avail).map(([lvl, arr]) => [lvl, (arr||[]).map(o => (typeof o === 'object' ? o.name : o))])));
          const catalog = summary?.spells?.catalog_by_id || {};
          const byName = {};
          Object.values(catalog).forEach(sp => { if (sp?.name) byName[sp.name] = sp; });
          setSpellDict(prev => ({ ...byName, ...prev }));
          return;
        }
        const cname = String(classe.name || '').toLowerCase();
        const isCleric = cname.includes('clérigo') || cname.includes('cleric') || cname.includes('clerigo');
        const isDruid = cname.includes('druida') || cname.includes('druid');
        if (!isCleric && !isDruid) return;

        const res = await apiClient.get('/api/v1/public/spells', { params: { klass_id: classe.id } });
        const spells = Array.isArray(res.spells) ? res.spells : [];
        const byLvl = {};
        const dict = { ...spellDict };
        spells.forEach(sp => {
          const lvl = Number(sp.level || 0);
          byLvl[lvl] ||= [];
          byLvl[lvl].push(sp.name);
          // enrich dictionary for modal usage
          dict[sp.name] = { id: sp.id, name: sp.name, level: sp.level, desc: sp.desc, higher_level: sp.higher_level };
        });
        setKnownByLevel(byLvl);
        setSpellDict(dict);
      } catch (_) { /* ignore */ }
    })();
  }, [classe?.id, classe?.name]);

  const subLabel = subclassLabelFor(classe?.name);

  const reloadSummary = async () => {
    try {
      const sid = summary?.sheet?.id;
      if (!sid) return;
      // Materialize auto-prepared spells (class/subclass) before reading the summary
      try {
        await apiClient.get('/api/v1/player/sheet_prepared_spells', { params: { sheet_id: sid } });
      } catch (_) { /* best-effort; ignore */ }
      const sumRes = await apiClient.get(`/api/v1/player/sheets/${sid}/summary`);
      const s = sumRes.summary || {};
      setSummary(s);
      // Update attributes and class header data
      const sc = s.abilities?.scores || {}; const md = s.abilities?.mods || {};
      setAtributos([
        { a: 'FOR', s: sc.str, m: md.str },
        { a: 'DES', s: sc.dex, m: md.dex },
        { a: 'CON', s: sc.con, m: md.con },
        { a: 'INT', s: sc.int, m: md.int },
        { a: 'SAB', s: sc.wis, m: md.wis },
        { a: 'CAR', s: sc.cha, m: md.cha },
      ]);
      const main = (s.klasses || []).reduce((a,b)=> (a && a.level > b.level) ? a : b, null);
      if (main) {
        setClasse({ id: main.id, name: main.name || 'Classe', hit_die: main.hit_die || 'd8' });
        setNivel(main.level || 1);
        setSubclassName(main.subclass?.name || '—');
      }
      setSlotCounts((s.conjuration?.slots || Array(9).fill(0)).map(n=>Number(n)||0));

      // Atualiza catálogos e prepared diretamente do summary
      const catalog = s.spells?.catalog_by_id || {};
      const byName = {};
      Object.values(catalog).forEach(sp => { if (sp?.name) byName[sp.name] = sp; });
      setSpellDict((prev) => ({ ...byName, ...prev }));
      const rawPb = s.spells?.prepared_by_level || {};
      const normalized = {};
      Object.entries(rawPb).forEach(([lvl, arr]) => {
        const dedup = [];
        const seen = new Set();
        (arr || []).forEach(sp => {
          const key = sp?.id || sp?.name;
          if (key && !seen.has(key)) { seen.add(key); dedup.push(sp); }
        });
        normalized[lvl] = dedup.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
      });
      // Merge fallback for Druid Land
      try {
        const merged = await mergeTerrainAlwaysPrepared(s, normalized);
        setPreparedByLevel(merged.pb);
        const autoIds = [];
        Object.values(merged.pb || {}).forEach(arr => (arr||[]).forEach(sp => { if (sp?.always_prepared && sp?.id != null) autoIds.push(Number(sp.id)); }));
        setAutoPreparedIds(Array.from(new Set([ ...autoIds, ...((merged.auto) || []) ])));
        setCircleSpellIds(merged.circle || []);
      } catch(_) {
        setPreparedByLevel(normalized);
        const autoIds = [];
        Object.values(normalized || {}).forEach(arr => (arr||[]).forEach(sp => { if (sp?.always_prepared && sp?.id != null) autoIds.push(Number(sp.id)); }));
        setAutoPreparedIds(Array.from(new Set(autoIds)));
        setCircleSpellIds([]);
      }
      // Atualiza available/known por nível para o painel
      const isPreparedMode = (s.conjuration?.mode === 'prepared');
      const isWizard = String(s.conjuration?.list_api || '').toLowerCase() === 'wizard';
      const pool = isPreparedMode ? (isWizard ? (s.spells?.known_by_level || {}) : (s.spells?.available_by_level || {})) : (s.spells?.known_by_level || {});
      setKnownByLevel(Object.fromEntries(Object.entries(pool).map(([lvl, arr]) => [lvl, (arr||[]).map(o => (typeof o === 'object' ? o.name : o))])));
    } catch (e) { /* noop */ }
  };
  
  return (
    <div style={{ background: 'var(--medium)', padding: 16 }}>
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>
        <CharacterHeader ident={ident} classe={classe} nivel={nivel} subclassName={subclassName} subclassLabel={subLabel} />

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '32% 34% 32%', gap: 12, marginTop: 12 }}>
          {/* Coluna Esquerda */}
          <div>
            {isMobile ? (
              <AccordionSection title="Atributos" defaultOpen>
                <div className={styles.featureScroll}>
                  {(() => {
                    const meta = metaState || {};
                    const raceBonuses = meta.race_bonuses_applied || {};
                    const asi = {};
                    const per = meta?.class_choices?.per_level || {};
                    Object.values(per).forEach((row) => {
                      const a = row?.asi;
                      if (a && a.mode === 'attributes') {
                        const list = Array.isArray(a.attributes) ? a.attributes : [];
                        const map = { STR: 'str', DES: 'dex', DEX: 'dex', CON: 'con', INT: 'int', WIS: 'wis', SAB: 'wis', CHA: 'cha', CAR: 'cha' };
                        if (list.length === 1) {
                          const key = String(list[0]?.id || list[0]).toUpperCase();
                          const k = map[key];
                          if (k) asi[k] = (asi[k] || 0) + 2;
                        } else {
                          list.slice(0,2).forEach((att) => {
                            const key = String(att?.id || att).toUpperCase();
                            const k = map[key];
                            if (k) asi[k] = (asi[k] || 0) + 1;
                          });
                        }
                      }
                    });
                    // Include ability bonuses granted by feats stored in metadata
                    try {
                      const featsMeta = Array.isArray(meta.feats) ? meta.feats : [];
                      featsMeta.forEach((f) => {
                        const ab = f?.ability_bonuses || {};
                        Object.entries(ab).forEach(([key, val]) => {
                          const k = String(key || '').toLowerCase();
                          const map = { str: 'str', dex: 'dex', con: 'con', int: 'int', wis: 'wis', cha: 'cha', for: 'str', des: 'dex', sab: 'wis', car: 'cha' };
                          const norm = map[k];
                          if (norm) asi[norm] = (asi[norm] || 0) + (Number(val) || 0);
                        });
                      });
                    } catch(_) {}
                    const saving = meta?.class_summary?.saving_throws || [];
                    const classSkillTop = meta?.class_choices?.skills || [];
                    const classSkillPer = [];
                    Object.values(per).forEach((row)=> (row?.skills||[]).forEach((s)=> classSkillPer.push(s)));
                    const classSkills = [...classSkillTop, ...classSkillPer];
                    const raceSkills = meta?.race_summary?.proficiencies?.skills?.fixed || [];
                    const bkgProfs = meta?.background_proficiencies || [];
                    return (
                      <AttributesSidePanel
                        readOnly
                        embedded
                        abilityMethod={'roll_4d6'}
                        level={nivel}
                        str={baseScores?.str ?? (atributos.find(x=>x.a==='FOR')?.s || 10)} setStr={()=>{}}
                        dex={baseScores?.dex ?? (atributos.find(x=>x.a==='DES')?.s || 10)} setDex={()=>{}}
                        con={baseScores?.con ?? (atributos.find(x=>x.a==='CON')?.s || 10)} setCon={()=>{}}
                        intA={baseScores?.int ?? (atributos.find(x=>x.a==='INT')?.s || 10)} setIntA={()=>{}}
                        wis={baseScores?.wis ?? (atributos.find(x=>x.a==='SAB')?.s || 10)} setWis={()=>{}}
                        cha={baseScores?.cha ?? (atributos.find(x=>x.a==='CAR')?.s || 10)} setCha={()=>{}}
                        raceBonuses={raceBonuses}
                        asiBonuses={asi}
                        baseScores={baseScores}
                        abilitySources={abilitySources}
                        classSavingThrows={saving}
                        classSkillPicks={classSkills}
                        backgroundProfs={bkgProfs}
                        raceSkillProfs={raceSkills}
                        featSkillProfs={featSkillProfs}
                        expertiseSkills={expertiseSkills}
                        halfProfOnUntrained={!!(summary?.proficiency_overrides?.half_proficiency_on_non_proficient_checks)}
                        rolledScores={[]}
                        styles={styles}
                      />
                    );
                  })()}
                </div>
              </AccordionSection>
            ) : (
              <Card disableHover bgVar="medium-hover">
                <CardHeader>Atributos</CardHeader>
                <CardContent>
                  <div className={styles.featureScroll}>
                    {(() => {
                      const meta = metaState || {};
                      const raceBonuses = meta.race_bonuses_applied || {};
                      const asi = {};
                      const per = meta?.class_choices?.per_level || {};
                      Object.values(per).forEach((row) => {
                        const a = row?.asi;
                        if (a && a.mode === 'attributes') {
                          const list = Array.isArray(a.attributes) ? a.attributes : [];
                          const map = { STR: 'str', DES: 'dex', DEX: 'dex', CON: 'con', INT: 'int', WIS: 'wis', SAB: 'wis', CHA: 'cha', CAR: 'cha' };
                          if (list.length === 1) {
                            const key = String(list[0]?.id || list[0]).toUpperCase();
                            const k = map[key];
                            if (k) asi[k] = (asi[k] || 0) + 2;
                          } else {
                            list.slice(0,2).forEach((att) => {
                              const key = String(att?.id || att).toUpperCase();
                              const k = map[key];
                              if (k) asi[k] = (asi[k] || 0) + 1;
                            });
                          }
                        }
                      });
                      // Include ability bonuses granted by feats stored in metadata
                      try {
                        const featsMeta = Array.isArray(meta.feats) ? meta.feats : [];
                        featsMeta.forEach((f) => {
                          const ab = f?.ability_bonuses || {};
                          Object.entries(ab).forEach(([key, val]) => {
                            const k = String(key || '').toLowerCase();
                            const map = { str: 'str', dex: 'dex', con: 'con', int: 'int', wis: 'wis', cha: 'cha', for: 'str', des: 'dex', sab: 'wis', car: 'cha' };
                            const norm = map[k];
                            if (norm) asi[norm] = (asi[norm] || 0) + (Number(val) || 0);
                          });
                        });
                      } catch(_) {}
                      const saving = meta?.class_summary?.saving_throws || [];
                      const classSkillTop = meta?.class_choices?.skills || [];
                      const classSkillPer = [];
                      Object.values(per).forEach((row)=> (row?.skills||[]).forEach((s)=> classSkillPer.push(s)));
                      const classSkills = [...classSkillTop, ...classSkillPer];
                      const raceSkills = meta?.race_summary?.proficiencies?.skills?.fixed || [];
                      const bkgProfs = meta?.background_proficiencies || [];
                      return (
                        <AttributesSidePanel
                          readOnly
                          embedded
                          abilityMethod={'roll_4d6'}
                          level={nivel}
                          str={baseScores?.str ?? (atributos.find(x=>x.a==='FOR')?.s || 10)} setStr={()=>{}}
                          dex={baseScores?.dex ?? (atributos.find(x=>x.a==='DES')?.s || 10)} setDex={()=>{}}
                          con={baseScores?.con ?? (atributos.find(x=>x.a==='CON')?.s || 10)} setCon={()=>{}}
                          intA={baseScores?.int ?? (atributos.find(x=>x.a==='INT')?.s || 10)} setIntA={()=>{}}
                          wis={baseScores?.wis ?? (atributos.find(x=>x.a==='SAB')?.s || 10)} setWis={()=>{}}
                          cha={baseScores?.cha ?? (atributos.find(x=>x.a==='CAR')?.s || 10)} setCha={()=>{}}
                          raceBonuses={raceBonuses}
                          asiBonuses={asi}
                          baseScores={baseScores}
                          abilitySources={abilitySources}
                          classSavingThrows={saving}
                          classSkillPicks={classSkills}
                          backgroundProfs={bkgProfs}
                          raceSkillProfs={raceSkills}
                          featSkillProfs={featSkillProfs}
                          expertiseSkills={expertiseSkills}
                          halfProfOnUntrained={!!(summary?.proficiency_overrides?.half_proficiency_on_non_proficient_checks)}
                          rolledScores={[]}
                          styles={styles}
                        />
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {isMobile ? (
              <AccordionSection title="Traços & Proficiências">
                <TraitsProfsPanel tracosRaciais={tracosRaciais} meta={metaState} />
              </AccordionSection>
            ) : (
              <TraitsProfsPanel tracosRaciais={tracosRaciais} meta={metaState} />
            )}
          </div>

          <div>
            {isMobile ? (
              <AccordionSection title="Estatísticas Vitais" defaultOpen>
                <VitalStatsPanel atributos={atributos} desloc={primarios.desloc} vida={primarios.vida} tempHp={metaState?.temp_hp} hitDie={classe.hit_die} summary={summary} />
              </AccordionSection>
            ) : (
              <VitalStatsPanel atributos={atributos} desloc={primarios.desloc} vida={primarios.vida} tempHp={metaState?.temp_hp} hitDie={classe.hit_die} summary={summary} />
            )}

            {(() => {
              const cname = String(classe?.name || '').toLowerCase();
              if (cname.includes('guerreiro') || cname.includes('fighter')) {
                const sub = String(subclassName || '').toLowerCase();
                const isEK = sub.includes('cavaleiro') || sub.includes('eldritch');
                const isBM = sub.includes('batalha') || sub.includes('battle');
                return (
                  <>
                    <FighterPanel nivel={nivel} />
                    {isEK && (
                      isMobile ? (
                        <AccordionSection title="Conjuração" defaultOpen>
                          <ConjurationPanel
                            nivel={nivel}
                            atributos={atributos}
                            cantripsCount={(cantrips||[]).length}
                            spellsCount={(magias||[]).length}
                            meta={metaState}
                            summary={summary}
                          />
                        </AccordionSection>
                      ) : (
                        <ConjurationPanel
                          nivel={nivel}
                          atributos={atributos}
                          cantripsCount={(cantrips||[]).length}
                          spellsCount={(magias||[]).length}
                          meta={metaState}
                          summary={summary}
                        />
                      )
                    )}
                    {isBM && (
                      isMobile ? (
                        <AccordionSection title="Superioridade em Combate">
                          <BattleMasterPanel nivel={nivel} meta={metaState} summary={summary} />
                        </AccordionSection>
                      ) : (
                        <BattleMasterPanel nivel={nivel} meta={metaState} summary={summary} />
                      )
                    )}
                    <FighterCombatExtras meta={metaState} summary={summary} />
                  </>
                );
              }
              if (cname.includes('bárbaro') || cname.includes('barbarian') || cname.includes('barbaro')) {
                return (
                  <>
                    {isMobile ? (
                      <>
                        <AccordionSection title="Combate" defaultOpen>
                          <BarbarianPanel nivel={nivel} />
                        </AccordionSection>
                      </>
                    ) : (
                      <>
                        <BarbarianPanel nivel={nivel} />
                      </>
                    )}
                  </>
                );
              }
              if (cname.includes('bruxo') || cname.includes('warlock')) {
                return (
                  <>
                    {isMobile ? (
                      <>
                        <AccordionSection title="Conjuração" defaultOpen>
                          <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} summary={summary} />
                        </AccordionSection>
                        <AccordionSection title="Arcanos Místicos">
                          <WarlockArcanumPanel nivel={nivel} meta={metaState} />
                        </AccordionSection>
                        <AccordionSection title="Invocações">
                          <WarlockInvocationsPanel nivel={nivel} meta={metaState} />
                        </AccordionSection>
                      </>
                    ) : (
                      <>
                        <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} summary={summary} />
                        <WarlockArcanumPanel nivel={nivel} meta={metaState} />
                        <WarlockInvocationsPanel nivel={nivel} meta={metaState} />
                      </>
                    )}
                  </>
                );
              }
              if (cname.includes('monge') || cname.includes('monk')) {
                const sub = String(subclassName || '').toLowerCase();
                const isFourEl = (sub.includes('quatro') || sub.includes('four') || sub.includes('element'));
                const isShadow = (sub.includes('sombra') || sub.includes('shadow'));
                const isOpenHand = (sub.includes('mão') || sub.includes('mao') || sub.includes('open'));
                return (
                  <>
                    {isMobile ? (
                      <>
                        <AccordionSection title="Recursos de Ki" defaultOpen>
                          <ConjurationPanel
                            nivel={nivel}
                            atributos={atributos}
                            cantripsCount={(cantrips||[]).length}
                            spellsCount={(magias||[]).length}
                            meta={metaState}
                            summary={summary}
                          />
                        </AccordionSection>
                        {isFourEl && (
                          <AccordionSection title="Disciplinas">
                            <MonkDisciplinesPanel meta={metaState} summary={summary} nivel={nivel} />
                          </AccordionSection>
                        )}
                        {isShadow && (
                          <AccordionSection title="Artes Sombrias">
                            <MonkShadowArtsPanel summary={summary} />
                          </AccordionSection>
                        )}
                        {isOpenHand && (
                          <AccordionSection title="Mão Aberta">
                            <MonkOpenHandPanel atributos={atributos} nivel={nivel} />
                          </AccordionSection>
                        )}
                        <AccordionSection title="Extras de Combate">
                          <CombatExtrasPanel meta={metaState} summary={summary} />
                        </AccordionSection>
                      </>
                    ) : (
                      <>
                        <ConjurationPanel
                          nivel={nivel}
                          atributos={atributos}
                          cantripsCount={(cantrips||[]).length}
                          spellsCount={(magias||[]).length}
                          meta={metaState}
                          summary={summary}
                        />
                        {isFourEl && (
                          <MonkDisciplinesPanel meta={metaState} summary={summary} nivel={nivel} />
                        )}
                        {isShadow && (
                          <MonkShadowArtsPanel summary={summary} />
                        )}
                        {isOpenHand && (
                          <MonkOpenHandPanel atributos={atributos} nivel={nivel} />
                        )}
                        <CombatExtrasPanel meta={metaState} summary={summary} />
                      </>
                    )}
                  </>
                );
              }
              if (cname.includes('druida') || cname.includes('druid')) {
                return (
                  <>
                    {isMobile ? (
                      <>
                        <AccordionSection title="Conjuração" defaultOpen>
                          <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} summary={summary} />
                        </AccordionSection>
                        <AccordionSection title="Formas Selvagens">
                          <DruidWildShapesPanel meta={metaState} summary={summary} />
                        </AccordionSection>
                      </>
                    ) : (
                      <>
                        <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} summary={summary} />
                        <DruidWildShapesPanel meta={metaState} summary={summary} />
                      </>
                    )}
                  </>
                );
              }
              if (cname.includes('paladino') || cname.includes('paladin')) {
                return (
                  <>
                    {isMobile ? (
                      <>
                        <AccordionSection title="Conjuração" defaultOpen>
                          <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} summary={summary} />
                        </AccordionSection>
                        <AccordionSection title="Juramento">
                          <PaladinOathPanel summary={summary} />
                        </AccordionSection>
                      </>
                    ) : (
                      <>
                        <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} summary={summary} />
                        <PaladinOathPanel summary={summary} />
                      </>
                    )}
                  </>
                );
              }
              if (cname.includes('patrulheiro') || cname.includes('ranger')) {
                const sub = String(subclassName || '').toLowerCase();
                const isBeastMaster = (sub.includes('best') || sub.includes('mestre'));
                return (
                  <>
                    {isMobile ? (
                      <>
                        <AccordionSection title="Conjuração" defaultOpen>
                          <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} summary={summary} />
                        </AccordionSection>
                        {isBeastMaster && (
                          <AccordionSection title="Companheiro de Patrulha">
                            <RangerCompanionPanel meta={metaState} summary={summary} />
                          </AccordionSection>
                        )}
                        <AccordionSection title="Extras de Combate">
                          <CombatExtrasPanel meta={metaState} summary={summary} />
                        </AccordionSection>
                      </>
                    ) : (
                      <>
                        <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} summary={summary} />
                        {isBeastMaster && (<RangerCompanionPanel meta={metaState} summary={summary} />)}
                        <CombatExtrasPanel meta={metaState} summary={summary} />
                      </>
                    )}
                  </>
                );
              }
              if (cname.includes('feiticeiro') || cname.includes('sorcerer')) {
                return (
                  <>
                    {isMobile ? (
                      <>
                        <AccordionSection title="Conjuração" defaultOpen>
                          <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} summary={summary} />
                        </AccordionSection>
                        <AccordionSection title="Metamagia">
                          <SorcererMetamagicPanel meta={metaState} sheetId={summary?.sheet?.id} nivel={nivel} />
                        </AccordionSection>
                      </>
                    ) : (
                      <>
                        <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} summary={summary} />
                        <SorcererMetamagicPanel meta={metaState} sheetId={summary?.sheet?.id} nivel={nivel} />
                      </>
                    )}
                  </>
                );
              }
              if (cname.includes('ladino') || cname.includes('rogue')) {
                const sub = String(subclassName || '').toLowerCase();
                const isArcaneTrickster = (sub.includes('arcano') || sub.includes('arcane'));
                return (
                  <>
                    {isMobile ? (
                      <>
                        <AccordionSection title="Ataque Furtivo" defaultOpen>
                          <SneakAttackPanel nivel={nivel} />
                        </AccordionSection>
                        {isArcaneTrickster && (
                          <AccordionSection title="Conjuração" defaultOpen>
                            <ConjurationPanel
                              nivel={nivel}
                              atributos={atributos}
                              cantripsCount={(cantrips||[]).length}
                              spellsCount={(magias||[]).length}
                              meta={metaState}
                              summary={summary}
                              preparedCount={(() => { try { return Object.values(preparedByLevel || {}).reduce((s,arr)=> s + (Array.isArray(arr)? arr.length : 0), 0); } catch(_){ return null; } })()}
                            />
                          </AccordionSection>
                        )}
                        <AccordionSection title="Extras de Combate">
                          <CombatExtrasPanel meta={metaState} summary={summary} />
                        </AccordionSection>
                      </>
                    ) : (
                      <>
                        <SneakAttackPanel nivel={nivel} />
                        {isArcaneTrickster && (
                          <ConjurationPanel
                            nivel={nivel}
                            atributos={atributos}
                            cantripsCount={(cantrips||[]).length}
                            spellsCount={(magias||[]).length}
                            meta={metaState}
                            summary={summary}
                            preparedCount={(() => { try { return Object.values(preparedByLevel || {}).reduce((s,arr)=> s + (Array.isArray(arr)? arr.length : 0), 0); } catch(_){ return null; } })()}
                          />
                        )}
                        <CombatExtrasPanel meta={metaState} summary={summary} />
                      </>
                    )}
                  </>
                );
              }
              return (
                isMobile ? (
                  <AccordionSection title="Conjuração" defaultOpen>
                  <ConjurationPanel
                    nivel={nivel}
                    atributos={atributos}
                    cantripsCount={(cantrips||[]).length}
                    spellsCount={(magias||[]).length}
                    meta={metaState}
                    summary={summary}
                    preparedCount={(() => { try { return Object.values(preparedByLevel || {}).reduce((s,arr)=> s + (Array.isArray(arr)? arr.length : 0), 0); } catch(_){ return null; } })()}
                  />
                  </AccordionSection>
                ) : (
                  <ConjurationPanel
                    nivel={nivel}
                    atributos={atributos}
                    cantripsCount={(cantrips||[]).length}
                    spellsCount={(magias||[]).length}
                    meta={metaState}
                    summary={summary}
                    preparedCount={(() => { try { return Object.values(preparedByLevel || {}).reduce((s,arr)=> s + (Array.isArray(arr)? arr.length : 0), 0); } catch(_){ return null; } })()}
                  />
                )
              );
            })()}

            {hasKnown && (() => {
              const preparedCaster = (summary?.conjuration?.mode === 'prepared');
              const preparedLimit = preparedCaster ? (summary?.conjuration?.prepared_limit ?? null) : null;
              const sheetId = summary?.sheet?.id;

              const Panel = (
                <SpellsKnownPanel
                  styles={styles}
                  byLevel={preparedCaster ? preparedByLevel : knownByLevel}
                  availableByLevel={preparedCaster ? knownByLevel : null}
                  spellDict={spellDict}
                  mode={preparedCaster ? 'prepared' : 'known'}
                  preparedLimit={preparedLimit}
                  sheetId={preparedCaster ? sheetId : null}
                  autoPreparedIds={preparedCaster ? autoPreparedIds : []}
                  onOptimisticPrepared={(map) => setPreparedByLevel(map)}
                  featKnownNames={featKnownNames}
                  featSourcesBySpellName={featSourcesBySpellName}
                  maxSelectableLevel={(() => {
                    try {
                      // Deriva do summary.conjuration.slots (array tamanho 9)
                      const slots = Array.isArray(summary?.conjuration?.slots) ? summary.conjuration.slots : [];
                      let max = 0;
                      for (let i = 0; i < 9; i++) { if (Number(slots[i] || 0) > 0) max = i + 1; }
                      return max || null;
                    } catch(_) { return null; }
                  })()}
                  secretsSpellIds={(() => {
                    try {
                      const per = metaState?.class_choices?.per_level || {};
                      const all = [];
                      Object.values(per).forEach((row) => {
                        const arr = Array.isArray(row?.learn_any_class_spells) ? row.learn_any_class_spells : [];
                        arr.forEach((s) => { const id = Number(s?.id || s); if (id) all.push(id); });
                      });
                      return Array.from(new Set(all));
                    } catch(_) { return []; }
                  })()}
                  invocationSpellIds={invocationSpellIds}
                  onChanged={reloadSummary}
                />
              );
              return (
                isMobile ? (
                  <AccordionSection title="Truques & Magias Conhecidas">{Panel}</AccordionSection>
                ) : (
                  <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
                    <CardHeader>Truques & Magias Conhecidas</CardHeader>
                    <CardContent>
                      {Panel}
                    </CardContent>
                  </Card>
                )
              );
            })()}

            {(() => {
              try {
                const vals = Object.values(preparedByLevel || {});
                const has = vals.some((arr) => (arr && arr.length > 0));
                if (!has) return null;
              } catch (_) { return null; }
              return (
                isMobile ? (
                  <AccordionSection title="Magias Preparadas">
                    <SpellsKnownPanel
                      byLevel={preparedByLevel}
                      spellDict={spellDict}
                      mode={'prepared'}
                      autoPreparedIds={autoPreparedIds}
                      circleSpellIds={circleSpellIds}
                      invocationSpellIds={invocationSpellIds}
                      featKnownNames={featKnownNames}
                      featSourcesBySpellName={featSourcesBySpellName}
                      secretsSpellIds={(() => {
                        try {
                          const per = metaState?.class_choices?.per_level || {};
                          const all = [];
                          Object.values(per).forEach((row) => {
                            const arr = Array.isArray(row?.learn_any_class_spells) ? row.learn_any_class_spells : [];
                            arr.forEach((s) => { const id = Number(s?.id || s); if (id) all.push(id); });
                          });
                          return Array.from(new Set(all));
                        } catch(_) { return []; }
                      })()}
                    />
                  </AccordionSection>
                ) : (
                  <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
                    <CardHeader><CardTitle>Magias Preparadas</CardTitle></CardHeader>
                    <CardContent>
                      <SpellsKnownPanel byLevel={preparedByLevel} spellDict={spellDict} styles={styles} mode={'prepared'} autoPreparedIds={autoPreparedIds} circleSpellIds={circleSpellIds} featKnownNames={featKnownNames}
                        secretsSpellIds={(() => {
                          try {
                            const per = metaState?.class_choices?.per_level || {};
                            const all = [];
                            Object.values(per).forEach((row) => {
                              const arr = Array.isArray(row?.learn_any_class_spells) ? row.learn_any_class_spells : [];
                              arr.forEach((s) => { const id = Number(s?.id || s); if (id) all.push(id); });
                            });
                            return Array.from(new Set(all));
                          } catch(_) { return []; }
                        })()}
                        featSourcesBySpellName={featSourcesBySpellName}
                      />
                    </CardContent>
                  </Card>
                )
              );
            })()}

            {hasSlots && (
              isMobile ? (
                <AccordionSection title="Espaços de Magia">
                  <SpellSlotsPanel slotCounts={slotCounts} styles={styles} />
                </AccordionSection>
              ) : (
                <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
                  <CardHeader><CardTitle>Espaços de Magia</CardTitle></CardHeader>
                  <CardContent>
                    <SpellSlotsPanel slotCounts={slotCounts} styles={styles} />
                  </CardContent>
                </Card>
              )
            )}
          </div>

          {/* Coluna Direita */}
          <div>
            {isMobile ? (
              <AccordionSection title="Talentos">
                <FeatsPanel feats={summary?.feats || []} readOnly={true} />
              </AccordionSection>
            ) : (
              <FeatsPanel feats={summary?.feats || []} readOnly={true} />
            )}

            {/* Equipped Weapons with roll buttons */}
            {isMobile ? (
              <AccordionSection title="Armas">
                <WeaponsPanel summary={summary} abilities={atributos} sheetItemsApi={sheetItemsApi} sheetId={summary?.sheet?.id} onChanged={reloadSummary} />
              </AccordionSection>
            ) : (
              <WeaponsPanel summary={summary} abilities={atributos} sheetItemsApi={sheetItemsApi} sheetId={summary?.sheet?.id} onChanged={reloadSummary} />
            )}

            {isMobile ? (
              <AccordionSection title="Características">
                <FeaturesList
                  features={features}
                  cfApi={cfApi}
                  onToggled={(id, show) => setFeatures(prev => prev.map(x => x.id === id ? { ...x, show } : x))}
                />
              </AccordionSection>
            ) : (
              <FeaturesList
                features={features}
                cfApi={cfApi}
                onToggled={(id, show) => setFeatures(prev => prev.map(x => x.id === id ? { ...x, show } : x))}
              />
            )}
          </div>
          <ChatWidget sheetId={summary?.sheet?.id} characterId={cid} characterName={ident?.nome} />
        </div>
      </div>
    </div>
  );
}
