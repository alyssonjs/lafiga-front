"use client";

import { useMemo, useState, useEffect } from "react";
import KnownLevelPanel from "./KnownLevelPanel";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "./UI/Dialog";
import { apiClient } from "../_lib/api/client";

// Renders per-level spell panels. `byLevel` = { 0: [names or objects], 1: [...], ... }
// If `mode` === 'prepared', component shows edit icon to select prepared spells across all levels.
export default function SpellsKnownPanel({
  byLevel = {},
  spellDict = {},
  styles = {},
  mode = 'known',
  preparedLimit = null,
  sheetId = null,
  availableByLevel = null,
  onChanged = null,
  autoPreparedIds = [],
  onOptimisticPrepared = null,
  maxSelectableLevel = null,
  secretsSpellIds = [],
  invocationSpellIds = [],
  circleSpellIds = [],
  featKnownNames = new Set(),
  featKnownIds = [],
  featSourcesBySpellName = {},
}) {
  // Levels: union of available (class list) and byLevel (prepared list)
  const levels = useMemo(() => {
    const keys = new Set([
      ...Object.keys(byLevel || {}),
      ...Object.keys(availableByLevel || {}),
    ]);
    return Array.from(keys)
      .map(n => parseInt(n, 10))
      .filter(n => {
        if (Number.isNaN(n)) return false;
        if (mode !== 'prepared') return true;
        // Em modo prepared: ignorar truques e respeitar nível máximo selecionável
        if (n === 0) return false;
        if (maxSelectableLevel == null) return true;
        return n <= Number(maxSelectableLevel);
      })
      .sort((a,b)=>a-b);
  }, [byLevel, availableByLevel, mode, maxSelectableLevel]);
  const [modal, setModal] = useState({ open: false, title: '', body: '' });
  const [edit, setEdit] = useState(false);
  // Build set of always prepared names from byLevel entries when objects provided
  const alwaysSet = useMemo(() => {
    const s = new Set();
    try {
      Object.values(byLevel || {}).forEach(arr => {
        (arr || []).forEach(sp => {
          if (sp && typeof sp === 'object' && sp.always_prepared && sp.name) s.add(sp.name);
        });
      });
    } catch(_){}
    return s;
  }, [byLevel]);
  // Also track always-prepared by spell id to avoid name mismatches
  const alwaysIdSet = useMemo(() => {
    const s = new Set();
    try {
      Object.values(byLevel || {}).forEach(arr => {
        (arr || []).forEach(sp => {
          if (sp && typeof sp === 'object' && sp.always_prepared && (sp.id != null)) s.add(Number(sp.id));
        });
      });
    } catch(_) {}
    (autoPreparedIds || []).forEach(id => { if (id != null) s.add(Number(id)); });
    return s;
  }, [byLevel, autoPreparedIds]);

  const nameToId = useMemo(() => {
    const map = {};
    try {
      Object.values(spellDict || {}).forEach(sp => { if (sp?.name && sp?.id != null) map[sp.name] = Number(sp.id); });
      Object.values(byLevel || {}).forEach(arr => {
        (arr || []).forEach(sp => { if (sp && typeof sp === 'object' && sp.name && sp.id != null) map[sp.name] = Number(sp.id); });
      });
    } catch(_) {}
    return map;
  }, [spellDict, byLevel]);
  // Magical Secrets: build id set once and expose helper by name
  const secretsIdSet = useMemo(() => {
    const s = new Set();
    (secretsSpellIds || []).forEach((id) => { if (id != null) s.add(Number(id)); });
    return s;
  }, [secretsSpellIds]);
  const isSecret = (nm) => {
    try {
      const id = nameToId[nm];
      return id != null && secretsIdSet.has(Number(id));
    } catch(_) { return false; }
  };
  // Invocations: tag spells granted by invocations (ids provided by parent)
  const invocationIdSet = useMemo(() => {
    const s = new Set();
    (invocationSpellIds || []).forEach((id) => { if (id != null) s.add(Number(id)); });
    return s;
  }, [invocationSpellIds]);
  const isInvocation = (nm) => {
    try {
      const id = nameToId[nm];
      return id != null && invocationIdSet.has(Number(id));
    } catch(_) { return false; }
  };
  // Circle tag: druid circle terrain spells
  const circleIdSet = useMemo(() => {
    const s = new Set();
    (circleSpellIds || []).forEach((id) => { if (id != null) s.add(Number(id)); });
    return s;
  }, [circleSpellIds]);
  const circleNameSet = useMemo(() => {
    const s = new Set();
    try {
      Object.values(byLevel || {}).forEach(arr => {
        (arr || []).forEach(sp => {
          if (sp && typeof sp === 'object' && sp.circle) s.add(sp.name);
        });
      });
    } catch(_) {}
    return s;
  }, [byLevel]);
  const isCircle = (nm) => {
    try {
      if (circleNameSet.has(nm)) return true;
      const id = nameToId[nm];
      return id != null && circleIdSet.has(Number(id));
    } catch(_) { return false; }
  };
  // Feat-known tag: map provided names/ids into a unified id set and test by name
  const featIdSet = useMemo(() => {
    const s = new Set();
    try { (featKnownIds || []).forEach((id) => { if (id != null) s.add(Number(id)); }); } catch(_) {}
    try {
      if (featKnownNames && typeof featKnownNames.forEach === 'function') {
        featKnownNames.forEach((nm) => {
          const id = nameToId[nm];
          if (id != null) s.add(Number(id));
        });
      }
    } catch(_) {}
    return s;
  }, [featKnownIds, featKnownNames, nameToId]);
  const isFeatKnown = (nm) => {
    try { const id = nameToId[nm]; return id != null && featIdSet.has(Number(id)); } catch(_) { return false; }
  };
  // Resolve feat source name for a given spell name
  const getFeatSource = (nm) => {
    try {
      if (!nm) return null;
      // Exact name match
      if (featSourcesBySpellName && featSourcesBySpellName[nm]) return featSourcesBySpellName[nm];
      // Case-insensitive fallback
      const key = Object.keys(featSourcesBySpellName || {}).find(k => String(k).toLowerCase() === String(nm).toLowerCase());
      if (key) return featSourcesBySpellName[key];
    } catch(_) {}
    return null;
  };
  // Domain tag: only for always-prepared that are NOT circle spells
  const isDomain = (nm) => {
    if (mode !== 'prepared') return false;
    try {
      if (isCircle(nm)) return false;
      const id = nameToId[nm];
      if (id != null && alwaysIdSet.has(Number(id))) return true;
      if (alwaysSet.has(nm)) return true;
    } catch(_) {}
    return false;
  };
  // Initial selected spell names (prepared): byLevel contains prepared list
  const initialSelected = useMemo(() => {
    const set = new Set();
    try {
      Object.values(byLevel || {}).forEach(arr => {
        (arr || []).forEach(sp => {
          const nm = (typeof sp === 'object') ? sp.name : sp;
          if (!nm) return;
          // Em modo prepared, não considerar truques na seleção
          if (mode === 'prepared') {
            const entry = spellDict && spellDict[nm];
            if (entry && Number(entry.level) === 0) return;
          }
          set.add(nm);
        });
      });
    } catch(_) {}
    return set;
  }, [byLevel, spellDict, mode]);
  const [selected, setSelected] = useState(initialSelected);
  // Sincroniza seleção com a fonte (byLevel) após qualquer reload externo
  useEffect(() => {
    setSelected(new Set(initialSelected));
  }, [initialSelected]);
  const selectedNonAutoCount = useMemo(() => {
    let c = 0;
    selected.forEach(nm => {
      const id = nameToId[nm];
      const isAuto = alwaysSet.has(nm) || (id != null && alwaysIdSet.has(id));
      if (isAuto) return;
      // Em modo prepared, não contar truques contra o limite
      if (mode === 'prepared') {
        const sp = spellDict && spellDict[nm];
        if (sp && Number(sp.level) === 0) return;
      }
      c += 1;
    });
    return c;
  }, [selected, alwaysSet, alwaysIdSet, nameToId, mode, spellDict]);
  const openInfo = async (name) => {
    const key = name?.trim?.() || name;
    let entry = (spellDict && spellDict[key]) || null;
    let desc = entry?.desc || entry?.description || entry?.higher_level || null;
    if (!desc && entry?.id) {
      try {
        const res = await apiClient.get(`/api/v1/public/spells/${entry.id}`);
        const spell = res.spell || {};
        desc = spell.desc || spell.higher_level || null;
      } catch (_) {
        // ignore
      }
    }
    if (!desc) desc = 'Descrição indisponível.';
    setModal({ open: true, title: name, body: Array.isArray(desc) ? desc.join('\n\n') : desc });
  };
  const closeInfo = () => setModal({ open: false, title: '', body: '' });

  const toggleSelect = (name) => {
    if (!edit) return;
    const id = nameToId[name];
    if (alwaysSet.has(name) || (id != null && alwaysIdSet.has(id))) return; // locked
    const next = new Set(selected);
    if (next.has(name)) {
      next.delete(name);
    } else {
      // enforce preparedLimit if provided (non-auto only)
      if (preparedLimit != null && selectedNonAutoCount >= preparedLimit) return;
      next.add(name);
    }
    setSelected(next);
  };

  const performSave = async () => {
    if (mode !== 'prepared' || !sheetId) { setEdit(false); return; }
    try {
      // Load current non-auto prepared to compute diffs
      const res = await apiClient.get('/api/v1/player/sheet_prepared_spells', { params: { sheet_id: sheetId } });
      const current = Array.isArray(res.sheet_prepared_spells) ? res.sheet_prepared_spells : [];
      const nonAuto = current.filter(r => !r.auto);
      // Build robust id maps (prefer ids to avoid name mismatches)
      const idByName = { ...nameToId };
      const nameById = {};
      try {
        // Seed from spellDict
        Object.values(spellDict || {}).forEach(sp => { if (sp?.id != null && sp?.name) nameById[Number(sp.id)] = sp.name; });
      } catch(_) {}
      try {
        // Also seed from prepared list objects (byLevel)
        Object.values(byLevel || {}).forEach(arr => {
          (arr || []).forEach(sp => {
            if (sp && typeof sp === 'object' && sp.id != null && sp.name) {
              nameById[Number(sp.id)] = sp.name;
              idByName[sp.name] = Number(sp.id);
            }
          });
        });
      } catch(_) {}

      const currentIds = new Set(nonAuto.map(r => Number(r.spell_id)));
      const targetNames = Array.from(selected).filter(nm => {
        if (alwaysSet.has(nm)) return false;
        if (mode === 'prepared') {
          const sp = spellDict && spellDict[nm];
          if (sp && Number(sp.level) === 0) return false; // não salvar truques como preparados
        }
        return true;
      });
      const targetIds = new Set(targetNames.map(nm => idByName[nm]).filter(id => id != null));

      // IMPORTANT: Do deletes first to free up slots, then adds.
      // Compute rows to remove using the fetched nonAuto rows (more robust than re-finding each time)
      const toRemoveRows = nonAuto.filter(r => !targetIds.has(Number(r.spell_id)));
      console.log('toRemoveRows', toRemoveRows.length, 'targetIds', targetIds)
      toRemoveRows.forEach(async row => {
        console.log(row)
        await apiClient.delete(`/api/v1/player/sheet_prepared_spells/${row.id}`, { params: { sheet_id: sheetId } })
      })
      // for (const row of toRemoveRows) {
      //   console.log(row, 'row')
      //   await apiClient.delete(`/api/v1/player/sheet_prepared_spells/${row.id}`, { params: { sheet_id: sheetId } });
      // }
      // Adds (ids present in target and not in current)
      for (const id of Array.from(targetIds)) {
        if (!currentIds.has(Number(id))) {
          await apiClient.post('/api/v1/player/sheet_prepared_spells', { sheet_id: sheetId, spell_id: id, auto: false });
        }
      }
      // Fecha edição e sincroniza estado local imediatamente com o alvo salvo
      setEdit(false);
      // Garante que os checkboxes reflitam o estado salvo já (sem depender do reload)
      try {
        const newSelected = new Set(Array.from(targetIds).map(id => nameById[Number(id)]).filter(Boolean));
        setSelected(newSelected);
      } catch(_) {}
      // Otimismo visual: atualizar lista de preparadas por nível no pai, se callback fornecido
      try {
        if (typeof onOptimisticPrepared === 'function') {
          const finalIds = new Set([ ...Array.from(alwaysIdSet || []), ...Array.from(targetIds) ].map(Number));
          const byLvl = {};
          const toEntry = (id) => {
            const name = nameById[Number(id)];
            let entry = null;
            if (name && spellDict && spellDict[name]) {
              const sp = spellDict[name];
              entry = { id: sp.id, name: sp.name, desc: sp.desc, higher_level: sp.higher_level, description: sp.desc, always_prepared: !!(alwaysIdSet && alwaysIdSet.has(Number(id))), _level: Number(sp.level || 0) };
            } else {
              try {
                Object.values(byLevel || {}).forEach(arr => {
                  (arr || []).forEach(sp => {
                    if (sp && typeof sp === 'object' && Number(sp.id) === Number(id)) {
                      entry = { id: sp.id, name: sp.name, desc: sp.desc, higher_level: sp.higher_level, description: sp.description || sp.desc, always_prepared: !!sp.always_prepared };
                    }
                  });
                });
              } catch(_) {}
            }
            return entry;
          };
          finalIds.forEach((id) => {
            const e = toEntry(id);
            if (!e) return;
            let lvl = e._level;
            if (typeof lvl !== 'number') {
              try {
                const nm = e.name;
                for (const [k, arr] of Object.entries(availableByLevel || {})) {
                  if ((arr || []).some(it => (typeof it === 'object' ? it.name : it) === nm)) { lvl = Number(k); break; }
                }
              } catch(_) {}
            }
            if (typeof lvl !== 'number') lvl = 1;
            byLvl[lvl] ||= [];
            if (!byLvl[lvl].some(x => (x.id && e.id) ? Number(x.id) === Number(e.id) : x.name === e.name)) {
              byLvl[lvl].push({ id: e.id, name: e.name, desc: e.desc, higher_level: e.higher_level, description: e.description, always_prepared: e.always_prepared });
            }
          });
          Object.keys(byLvl).forEach(k => { byLvl[k] = (byLvl[k] || []).sort((a,b)=> (a.name||'').localeCompare(b.name||'')); });
          onOptimisticPrepared(byLvl);
        }
      } catch(_) {}
      // Recarrega o summary (pai) para consolidar estado e prepared_by_level
      if (onChanged) await onChanged();
    } catch (e) {
      setEdit(false);
    }
  };

  // Build display list per level: merge availableByLevel with prepared entries (to include domain-only spells)
  const displayByLevel = useMemo(() => {
    const result = {};
    const toName = (it) => (typeof it === 'object' ? it.name : it);
    levels.forEach(lvl => {
      const base = Array.isArray(availableByLevel?.[lvl]) ? availableByLevel[lvl] : [];
      const prepared = Array.isArray(byLevel?.[lvl]) ? byLevel[lvl] : [];
      const byName = {};
      // seed from base
      (base || []).forEach(item => {
        const nm = toName(item);
        if (nm) byName[nm] = item;
      });
      // overlay prepared, preferring objects with always_prepared=true
      (prepared || []).forEach(sp => {
        const nm = toName(sp);
        if (!nm) return;
        const existing = byName[nm];
        if (!existing) {
          byName[nm] = sp;
        } else {
          const existingIsObj = typeof existing === 'object';
          const existingAuto = existingIsObj && !!existing.always_prepared;
          const newIsObj = typeof sp === 'object';
          const newAuto = newIsObj && !!sp.always_prepared;
          if (newAuto && (!existingIsObj || !existingAuto)) {
            byName[nm] = sp; // promote prepared auto entry
          }
        }
      });
      result[lvl] = Object.values(byName);
    });
    return result;
  }, [levels, availableByLevel, byLevel]);

  return (
    <>
      <div className={styles.knownContainer} style={{ position: 'relative', maxHeight: 500, overflowY: 'auto' }}>
        {mode === 'prepared' && (
          <div style={{ position: 'sticky', top: 0, left: 0, zIndex: 2, paddingBottom: 8, background: 'var(--medium)' }}>
            { !edit && <a
              type="button"
              aria-label="Editar preparadas"
              className={styles.stepTab}
              onClick={() => { setEdit((v) => !v); /* Não resetar seleção aqui; Cancelar já reseta */ }}
              style={{ marginRight: 8 }}
            >✎</a>}
            {edit && (
              <>
                <a type="button" className={styles.stepTab} onClick={performSave} style={{ marginRight: 6 }}>✅</a>
                <a type="button" className={styles.stepTab} onClick={() => { setEdit(false); setSelected(initialSelected); }}>❎</a>
                <div>
                {preparedLimit != null && (
                  <span className={styles.small} style={{ marginRight: 12 }}>
                    Selecionadas: {selectedNonAutoCount}/{preparedLimit} (sempre preparadas não contam)
                  </span>
                )}
                </div>
              </>
            )}
          </div>
        )}
        {(levels).map(lvl => (
          <KnownLevelPanel
            key={`lvl-${lvl}`}
            level={lvl}
            spells={displayByLevel[lvl] || []}
            onSpellClick={openInfo}
            styles={styles}
            edit={edit && mode === 'prepared'}
            selected={selected}
            onToggle={toggleSelect}
            isAlways={(nm) => (alwaysSet.has(nm) || (nameToId[nm] != null && alwaysIdSet.has(Number(nameToId[nm]))))}
            isSecret={isSecret}
            isInvocation={isInvocation}
            isDomain={isDomain}
            isCircle={isCircle}
            isFeatKnown={isFeatKnown}
            getFeatSource={getFeatSource}
          />
        ))}
      </div>
      <Dialog isOpen={modal.open} onClose={closeInfo} size="md">
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
    </>
  );
}
