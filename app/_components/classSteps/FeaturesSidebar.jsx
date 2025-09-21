"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "../UI/Dialog";
import styles from "../../_styles/character/CharacterForm.module.css";
import SpellsSummary from "./SpellsSummary";
import { useSubclasses } from "../../_hooks/useSubclasses";
import SubclassSummary from "./SubclassSummary";
import FeaturesByLevel from "./FeaturesByLevel";
import { apiClient } from "../../_lib/api/client";

// Independent sidebar showing per-level features and spell summary
const FeaturesSidebar = ({
  rule,
  klassLevels = [],
  picksByLevel = {},
  maxLevel = 1,
  raceCantripsExtra = [],
  raceSpellsExtra = [],
  subKlasses = [],
  selectedKlassId = null,
  traitDict = {},
  raceRuleId = null,
  subRuleId = null,
  spellDict = {},
  classSubclassId = null,
}) => {
  const [modal, setModal] = useState({ open: false, title: '', body: '' });
  const [apSubclass, setApSubclass] = useState([]);
  const openInfo = (title, body) => setModal({ open: true, title, body: body || 'Descrição indisponível.' });
  const closeInfo = () => setModal({ open: false, title: '', body: '' });
  const toTitle = (s) => {
    try {
      const str = String(s || '').trim();
      if (!str) return '';
      if (str.includes(' ')) return str; // already a display name
      // slug → Title Case with spaces
      return str.split('-').map(w => w ? (w[0].toUpperCase() + w.slice(1)) : w).join(' ');
    } catch(_) { return String(s||''); }
  };
  const toArray = (list) => {
    if (Array.isArray(list)) return list;
    if (list == null) return [];
    const s = String(list);
    if (s.includes(',')) return s.split(',').map(x => x.trim()).filter(Boolean);
    return [s];
  };
  const view = useMemo(() => {
    const chooseSubclassLevel = Number(rule?.subclass?.choose_level || 0);
    const subclassOptions = Object.values(rule?.subclass?.options || {}).map(o=>({ id:o.id, name:o.name, grants:o.grants }));
    const chosenSubclassId = (() => {
      // Prefer valor controlado (seleção atual do SubclassStepper)
      if (classSubclassId) return classSubclassId;
      // Fallback: varrer escolhas persistidas por nível
      for (let i = 1; i <= Math.max(1, Number(maxLevel) || 1); i++) {
        const p = picksByLevel[i] || {};
        if (p.subclass_id) return p.subclass_id;
      }
      return null;
    })();
    const chosenSubclass = chosenSubclassId ? (subclassOptions || []).find(s => String(s.id) === String(chosenSubclassId)) : null;
    // DB subclass (com descrição e níveis) — match por api_index e klass_id
    const subDb = (() => {
      if (!chosenSubclassId || !selectedKlassId) return null;
      return (subKlasses || []).find(sk => String(sk.api_index) === String(chosenSubclassId) && Number(sk.klass_id) === Number(selectedKlassId));
    })();
    let subLevels = [];
    try { subLevels = subDb?.levels_json ? JSON.parse(subDb.levels_json) : []; } catch(_) {}

    const items = [];
    for (let i = 1; i <= Math.max(1, Number(maxLevel) || 1); i++) {
      const row = (klassLevels || []).find((cl) => Number(cl.level) === i) || {};
      const feats = Array.isArray(row.features) ? row.features : [];
      const entries = feats.map((f) => {
        const name = typeof f === 'string' ? f : (f?.name || '—');
        const finalName = (chosenSubclass && name.toLowerCase().includes('feature')) ? `${name} — (${chosenSubclass.name})` : name;
        const desc = (typeof f === 'object' && (f?.description || f?.desc)) ? (Array.isArray(f.description || f.desc) ? (f.description || f.desc).join("\n\n") : (f.description || f.desc)) : null;
        return { name: finalName, desc };
      });
      if (entries.length) items.push({ level: i, entries });
    }

    const allCan = [];
    const seenC = new Set();
    // Feat-derived picks (cantrips/spells) aggregated across levels
    const featCantrips = [];
    const featSpellsByLevel = {};
    for (let i = 1; i <= Math.max(1, Number(maxLevel) || 1); i++) {
      const p = picksByLevel[i] || {};
      const a = p.asi;
      if (a && a.mode === 'feat' && a.choices) {
        const fcan = Array.isArray(a.choices.cantrips) ? a.choices.cantrips : [];
        fcan.forEach(c => {
          const id = c?.id || c;
          const name = c?.name || c?.id || String(c);
          const lvl = c?.level != null ? c.level : 0;
          featCantrips.push({ id, name, level: lvl });
        });
        const fsp = Array.isArray(a.choices.spells) ? a.choices.spells : [];
        fsp.forEach(s => {
          const id = s?.id || s;
          const name = s?.name || s?.id || String(s);
          const lvl = s?.level != null ? s.level : 1;
          if (!featSpellsByLevel[lvl]) featSpellsByLevel[lvl] = [];
          featSpellsByLevel[lvl].push({ id, name });
        });
      }
    }
    (raceCantripsExtra || []).forEach(c => { const id=c.id||c; if(!seenC.has(id)){ seenC.add(id); allCan.push(c.name||c.id);} });
    for (let i=1;i<=Math.max(1, Number(maxLevel)||1);i++){
      const p=picksByLevel[i]||{}; (p.cantrips||[]).forEach(c=>{ const id=c.id||c; if(!seenC.has(id)){ seenC.add(id); allCan.push(c.name||c.id);} });
    }
    // Include feat-granted cantrips, labeled
    featCantrips.forEach(c => { const id=c.id||c; if(!seenC.has(id)){ seenC.add(id); allCan.push(`${c.name} (Talento)`);} });
    const knownByLevel = [];
    const spellsBySpellLevel = {};
    
    // Agregar magias por nível da spell (1, 2, 3, etc.)
    for (let i=1;i<=Math.max(1, Number(maxLevel)||1);i++){
      const p=picksByLevel[i]||{}; 
      const spells = p.spells || [];
      
      spells.forEach(spell => {
        const spellLevel = spell.level || 1;
        if (!spellsBySpellLevel[spellLevel]) {
          spellsBySpellLevel[spellLevel] = [];
        }
        spellsBySpellLevel[spellLevel].push(spell.name || spell.id);
      });
    }
    // Add feat-granted spells per spell level, labeled and avoiding duplicate names
    Object.keys(featSpellsByLevel).forEach(lvlKey => {
      const lvl = Number(lvlKey);
      const list = featSpellsByLevel[lvl] || [];
      if (!spellsBySpellLevel[lvl]) spellsBySpellLevel[lvl] = [];
      const existing = new Set(spellsBySpellLevel[lvl]);
      list.forEach(s => {
        const nm = s.name;
        if (!existing.has(nm)) {
          spellsBySpellLevel[lvl].push(`${nm} (Talento)`);
          existing.add(nm);
        }
      });
    });
    
    // Converter para array ordenado por nível da spell
    Object.keys(spellsBySpellLevel)
      .sort((a, b) => Number(a) - Number(b))
      .forEach(spellLevel => {
        const list = spellsBySpellLevel[spellLevel];
        if (list.length) {
          knownByLevel.push({level: Number(spellLevel), list});
        }
      });

    // Agregar magias preparadas por nível da spell
    const preparedBySpellLevel = {};
    
    for (let i=1;i<=Math.max(1, Number(maxLevel)||1);i++){
      const p=picksByLevel[i]||{}; 
      const prepared = p.prepared || [];
      
      prepared.forEach(spell => {
        const spellLevel = spell.level || 1;
        if (!preparedBySpellLevel[spellLevel]) {
          preparedBySpellLevel[spellLevel] = [];
        }
        preparedBySpellLevel[spellLevel].push(spell.name || spell.id);
      });
    }
    
    // Converter para array ordenado por nível da spell
    const preparedByLevel = [];
    Object.keys(preparedBySpellLevel)
      .sort((a, b) => Number(a) - Number(b))
      .forEach(spellLevel => {
        const list = preparedBySpellLevel[spellLevel];
        if (list.length) {
          preparedByLevel.push({level: Number(spellLevel), list});
        }
      });

    // racial traits from RaceRules (if provided)
    const traitKeys = [];
    try {
      // rely on external RaceRules merge; here we only format
      const baseTraits = (rule?.traits || []); // class rule traits (usually none)
    } catch(_) {}

    return { items, allCan, knownByLevel, preparedByLevel, raceSpellsExtra, subDb, subLevels, chosenSubclassId };
  }, [rule, klassLevels, picksByLevel, maxLevel, raceCantripsExtra, raceSpellsExtra, subKlasses, selectedKlassId, traitDict, raceRuleId, subRuleId, classSubclassId]);

  // Carregar subclasses da API (mesma fonte usada no SubclassStepper) para ter always_prepared_by_terrain consolidado
  const { subclasses: apiSubclasses } = useSubclasses(selectedKlassId, rule?.id);

  // Derivar magias sempre preparadas da subclasse a partir da API (preferível) e fallback para levels_json
  useEffect(() => {
    const arraysEqual = (a, b) => {
      if (!Array.isArray(a) || !Array.isArray(b)) return false;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return false; }
      return true;
    };
    try {
      const upto = Number(maxLevel) || 1;
      const chosenSubclassId = view.chosenSubclassId;
      let next = [];
      // 1) Prefer API map (ClassRules.available_subclasses)
      try {
        if (chosenSubclassId && Array.isArray(apiSubclasses)) {
          const hit = apiSubclasses.find(s => String(s.id) === String(chosenSubclassId));
          if (hit) {
            // descobrir terreno
            const terrain = (() => {
              const keys = Object.keys(picksByLevel || {}).map(n=>Number(n)).filter(n=>n<=upto).sort((a,b)=>a-b);
              for (const lv of keys) {
                const row = picksByLevel[lv] || {};
                const t = row.terrain || row.terreno;
                if (t) return (typeof t === 'object') ? (t.id || t.name || String(t)) : String(t);
              }
              return null;
            })();
            const names = [];
            const collect = (map={}) => {
              Object.keys(map).map(n=>Number(n)).sort((a,b)=>a-b).forEach(k => {
                if (k <= upto) toArray(map[String(k)]).forEach(nm => names.push(toTitle(nm)));
              });
            };
            if (terrain && hit.always_prepared_by_terrain && hit.always_prepared_by_terrain[terrain]) {
              collect(hit.always_prepared_by_terrain[terrain]);
            } else if (hit.always_prepared) {
              collect(hit.always_prepared);
            }
            if (names.length) { next = Array.from(new Set(names)); }
          }
        }
      } catch(_) {}

      // 2) Fallback: usar levels_json
      if (next.length === 0) {
        const subLevels = Array.isArray(view.subLevels) ? view.subLevels : [];
        if (subLevels.length) {
          // Descobrir terreno escolhido, se houver
          const terrain = (() => {
            const keys = Object.keys(picksByLevel || {}).map(n=>Number(n)).filter(n=>n<=upto).sort((a,b)=>a-b);
            for (const lv of keys) {
              const row = picksByLevel[lv] || {};
              const t = row.terrain || row.terreno;
              if (t) return (typeof t === 'object') ? (t.id || t.name || String(t)) : String(t);
            }
            return null;
          })();
          const names = [];
          subLevels
            .filter(r => Number(r.level) > 0 && Number(r.level) <= upto)
            .forEach((r) => {
              // grants podem estar no nível ou dentro de cada feature
              const buckets = [];
              if (r && r.grants) buckets.push(r);
              const feats = Array.isArray(r.features) ? r.features : [];
              feats.forEach((f) => { if (f && f.grants) buckets.push(f); });
              buckets.forEach((node) => {
                const grants = node.grants || {};
                const spells = grants.spells || {};
                // 1) sempre preparadas padrão
                const ap = spells.always_prepared || {};
                Object.keys(ap || {})
                  .map(n => Number(n))
                  .sort((a,b)=>a-b)
                  .forEach(k => {
                    if (k <= upto) { toArray(ap[String(k)]).forEach(nm => names.push(toTitle(nm))); }
                  });
                // 2) por terreno
                const terr = spells.always_prepared_by_terrain || {};
                if (terrain && terr[terrain]) {
                  const map = terr[terrain] || {};
                  Object.keys(map)
                    .map(n => Number(n))
                    .sort((a,b)=>a-b)
                    .forEach(k => {
                      if (k <= upto) { toArray(map[String(k)]).forEach(nm => names.push(toTitle(nm))); }
                    });
                }
              });
            });
          next = Array.from(new Set(names.filter(Boolean)));
        }
      }
      // Commit only if changed (avoid render loops)
      setApSubclass(prev => (arraysEqual(prev, next) ? prev : next));
    } catch (_) {
      setApSubclass(prev => (prev.length ? [] : prev));
    }
  }, [apiSubclasses, view.chosenSubclassId, view?.subDb?.levels_json, picksByLevel, maxLevel]);

  return (
    <div className={styles.featureSidebar}>
      <SubclassSummary subDb={view.subDb} subLevels={view.subLevels} openInfo={openInfo} />
      <FeaturesByLevel items={view.items} openInfo={openInfo} />
      {!!(view.raceSpellsExtra && view.raceSpellsExtra.length) && (
        <>
          <div className={styles.featureHeader}>Inatas (Raça)</div>
          <div className={styles.featureCard}>
            <ul className={styles.summaryList}>
              {view.raceSpellsExtra.map((s, idx) => (
                <li key={`rs-${idx}`} className={styles.summaryItem}>{s.name || s.id}</li>
              ))}
            </ul>
          </div>
        </>
      )}
      <div className={styles.featureHeader}>Truques & Magias Conhecidas</div>
      <SpellsSummary
        allCan={view.allCan}
        knownByLevel={view.knownByLevel}
        preparedByLevel={view.preparedByLevel}
        autoPrepared={apSubclass}
        spellDict={spellDict}
        openInfo={openInfo}
      />
      {/* Racial Traits (if provided) */}
      {raceRuleId && (
        <>
          <div className={styles.featureHeader}>Traços Raciais</div>
          <div className={styles.featureCard}>
            <div className={styles.featureTitle}>
              {(() => {
                const traits = [];
                // Expect external caller to pass a merged RaceRules (we accept ids and traitDict only)
                // We'll infer from traitDict and ids when available
                // This block intentionally left minimal since wizard already shows traits by race step
                return traits;
              })()}
            </div>
          </div>
        </>
      )}
      <Dialog isOpen={modal.open} onClose={closeInfo} size="md" style={{ maxWidth: 200, width: '50%' }}>
        <DialogHeader>
          <DialogTitle>{modal.title}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className={styles.featureDesc}>{modal.body}</div>
        </DialogContent>
        <DialogFooter>
          <button className={styles.stepTab} onClick={closeInfo}>Fechar</button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default FeaturesSidebar;
