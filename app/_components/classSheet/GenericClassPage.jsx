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
import FighterCombatExtras from "./FighterCombatExtras";
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
  const [metaState, setMetaState] = useState({});
  const [summary, setSummary] = useState({});
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
        const byLevel = s.spells?.known_by_level || {};
        // byLevel: known spells per level from summary
        setKnownByLevel(Object.fromEntries(Object.entries(byLevel).map(([lvl, arr]) => [lvl, (arr||[]).map(o=>o.name)])));
        const lvl0 = (byLevel['0'] || []).length;
        const others = Object.entries(byLevel).filter(([k]) => k !== '0').reduce((acc, [_, arr]) => acc + (arr||[]).length, 0);
        setCantrips(Array.from({length: lvl0}).map(()=>''));
        setMagias(Array.from({length: others}).map(()=>''));
        const catalog = s.spells?.catalog_by_id || {}; const byName = {};
        Object.values(catalog).forEach(sp => { if (sp?.name) byName[sp.name] = sp; });
        setSpellDict(byName);
        // Prepared spells: build per-level map using catalog from summary
        try {
          const prepRes = await apiClient.get(`/api/v1/player/sheet_prepared_spells`, { params: { sheet_id: sheet.id } });
          const list = (prepRes.sheet_prepared_spells || []);
          const byLvl = {};
          const missing = [];
          list.forEach((row) => {
            const sid = row.spell_id;
            const sp = catalog[sid];
            if (!sp) { missing.push(sid); return; }
            const lvl = Number(sp.level || 0);
            byLvl[lvl] ||= [];
            byLvl[lvl].push(sp.name);
          });
          if (missing.length) {
            const uniq = Array.from(new Set(missing.filter(Boolean)));
            if (uniq.length) {
              const resp = await apiClient.get('/api/v1/public/spells', { params: { ids: uniq } });
              const spells = resp.spells || [];
              spells.forEach(sp => {
                catalog[sp.id] = { id: sp.id, name: sp.name, level: sp.level, desc: sp.desc, higher_level: sp.higher_level };
                byName[sp.name] = { id: sp.id, name: sp.name, level: sp.level, desc: sp.desc, higher_level: sp.higher_level };
              });
              // rebuild byLvl entries for any missing ids
              list.forEach((row) => {
                const sid = row.spell_id;
                const sp = catalog[sid];
                if (!sp) return;
                const lvl = Number(sp.level || 0);
                byLvl[lvl] ||= [];
                if (!byLvl[lvl].includes(sp.name)) byLvl[lvl].push(sp.name);
              });
              setSpellDict({ ...byName });
            }
          }
          setPreparedByLevel(byLvl);
        } catch (_) { setPreparedByLevel({}); }
        const collected = (s.features || []).map(f => ({ id: f.id, lvl: f.level, name: f.name, desc: f.desc, show: (f.show !== false), pref_id: f.pref_id }));
        setFeatures(collected);
      } catch (e) {
        console.error(e); setError('Falha ao carregar a ficha.');
      }
    })();
  }, [cid]);

  const subLabel = subclassLabelFor(classe?.name);

  const reloadSummary = async () => {
    try {
      const sid = summary?.sheet?.id;
      if (!sid) return;
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
    } catch (e) { /* noop */ }
  };
  
  return (
    <div style={{ background: 'var(--dark)', padding: 16 }}>
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
                return (
                  <>
                    <FighterPanel nivel={nivel} />
                    <FighterCombatExtras meta={metaState} />
                  </>
                );
              }
              if (cname.includes('bárbaro') || cname.includes('barbarian') || cname.includes('barbaro')) {
                return (
                  <>
                    {isMobile ? (
                      <>
                        <AccordionSection title="Combate" defaultOpen>
                          <FighterPanel nivel={nivel} />
                        </AccordionSection>
                        <AccordionSection title="Extras de Combate">
                          <FighterCombatExtras meta={metaState} />
                        </AccordionSection>
                      </>
                    ) : (
                      <>
                        <FighterPanel nivel={nivel} />
                        <FighterCombatExtras meta={metaState} />
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
                          <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} />
                        </AccordionSection>
                        <AccordionSection title="Arcanos Místicos">
                          <WarlockArcanumPanel nivel={nivel} meta={metaState} />
                        </AccordionSection>
                        <AccordionSection title="Invocações">
                          <WarlockInvocationsPanel meta={metaState} />
                        </AccordionSection>
                      </>
                    ) : (
                      <>
                        <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} />
                        <WarlockArcanumPanel nivel={nivel} meta={metaState} />
                        <WarlockInvocationsPanel meta={metaState} />
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
                          <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} />
                        </AccordionSection>
                        <AccordionSection title="Formas Selvagens">
                          <DruidWildShapesPanel meta={metaState} />
                        </AccordionSection>
                      </>
                    ) : (
                      <>
                        <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} />
                        <DruidWildShapesPanel meta={metaState} />
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
                          <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} />
                        </AccordionSection>
                        <AccordionSection title="Metamagia">
                          <SorcererMetamagicPanel meta={metaState} />
                        </AccordionSection>
                      </>
                    ) : (
                      <>
                        <ConjurationPanel nivel={nivel} atributos={atributos} cantripsCount={(cantrips||[]).length} spellsCount={(magias||[]).length} meta={metaState} />
                        <SorcererMetamagicPanel meta={metaState} />
                      </>
                    )}
                  </>
                );
              }
              if (cname.includes('ladino') || cname.includes('rogue')) {
                return (
                  <>
                    {isMobile ? (
                      <>
                        <AccordionSection title="Ataque Furtivo" defaultOpen>
                          <SneakAttackPanel nivel={nivel} />
                        </AccordionSection>
                        <AccordionSection title="Extras de Combate">
                          <CombatExtrasPanel meta={metaState} />
                        </AccordionSection>
                      </>
                    ) : (
                      <>
                        <SneakAttackPanel nivel={nivel} />
                        <CombatExtrasPanel meta={metaState} />
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
                    preparedCount={(() => { try { return Object.values(preparedByLevel || {}).reduce((s,arr)=> s + (Array.isArray(arr)? arr.length : 0), 0); } catch(_){ return null; } })()}
                  />
                )
              );
            })()}

            {hasKnown && (
              isMobile ? (
                <AccordionSection title="Truques & Magias Conhecidas">
                  <SpellsKnownPanel byLevel={knownByLevel} spellDict={spellDict} />
                </AccordionSection>
              ) : (
                <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
                  <CardHeader>Truques & Magias Conhecidas</CardHeader>
                  <CardContent>
                    <SpellsKnownPanel byLevel={knownByLevel} spellDict={spellDict} />
                  </CardContent>
                </Card>
              )
            )}

            {(() => {
              try {
                const vals = Object.values(preparedByLevel || {});
                const has = vals.some((arr) => (arr && arr.length > 0));
                if (!has) return null;
              } catch (_) { return null; }
              return (
                isMobile ? (
                  <AccordionSection title="Magias Preparadas">
                    <SpellsKnownPanel byLevel={preparedByLevel} spellDict={spellDict} />
                  </AccordionSection>
                ) : (
                  <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
                    <CardHeader><CardTitle>Magias Preparadas</CardTitle></CardHeader>
                    <CardContent>
                      <SpellsKnownPanel byLevel={preparedByLevel} spellDict={spellDict} styles={styles} />
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
