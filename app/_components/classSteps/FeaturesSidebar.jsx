"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "../UI/Dialog";
import styles from "../../_styles/character/CharacterForm.module.css";
import SpellsSummary from "./SpellsSummary";
import SubclassSummary from "./SubclassSummary";
import FeaturesByLevel from "./FeaturesByLevel";

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
}) => {
  const [modal, setModal] = useState({ open: false, title: '', body: '' });
  const openInfo = (title, body) => setModal({ open: true, title, body: body || 'Descrição indisponível.' });
  const closeInfo = () => setModal({ open: false, title: '', body: '' });
  const view = useMemo(() => {
    const chooseSubclassLevel = Number(rule?.subclass?.choose_level || 0);
    const subclassOptions = Object.values(rule?.subclass?.options || {}).map(o=>({ id:o.id, name:o.name, grants:o.grants }));
    const chosenSubclassId = (() => {
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

    return { items, allCan, knownByLevel, preparedByLevel, raceSpellsExtra, subDb, subLevels };
  }, [rule, klassLevels, picksByLevel, maxLevel, raceCantripsExtra, raceSpellsExtra, subKlasses, selectedKlassId, traitDict, raceRuleId, subRuleId]);

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
