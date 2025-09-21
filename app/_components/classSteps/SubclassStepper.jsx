"use client";

import { useEffect, useState } from "react";
import Select from "../UI/Select";
import { useSubclasses } from "../../_hooks/useSubclasses";
import styles from "../../_styles/character/CharacterForm.module.css";

const SubclassStepper = ({
  rule,
  level,
  classSubclassId, setClassSubclassId,
  klassId,
  klassApiIndex,
  picksByLevel = {},
}) => {
  const [localOptions, setLocalOptions] = useState([]);
  const [apSubclass, setApSubclass] = useState([]);
  const { subclasses, loading, error } = useSubclasses(klassId, klassApiIndex);

  // Buscar somente da API (subclasses autoritativas do backend)
  useEffect(() => {
    // Normaliza e filtra somente itens válidos vindos da API
    const apiOptions = (subclasses || [])
      .filter((s) => s && s.id) // exige id válido
      .map((s) => ({
        id: s.id,
        name: s.name || String(s.id),
        custom: !!s.custom,
        description: s.description || '',
        always_prepared: s.always_prepared || {},
        always_prepared_by_terrain: s.always_prepared_by_terrain || {}
      }));
    // Dedup por id (caso backend retorne duplicatas)
    const seen = new Set();
    const dedup = apiOptions.filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
    setLocalOptions(dedup);
  }, [rule, subclasses]);

  // Fallback seguro quando houver erro na API — usar opções estáticas apenas em erro
  useEffect(() => {
    console.log(error)
    if (!error) return;
    console.warn('Erro ao carregar subclasses:', error);
    const fallbackOptions = Object.values(rule?.subclass?.options || {}).map((o) => ({
      id: o.id,
      name: o.name,
      grants: o.grants
    }));
    setLocalOptions(fallbackOptions);
  }, [error, rule]);

  if (!rule) return null;
  
  const chooseLevel = Number(rule?.subclass?.choose_level || 0);
  const reachedChooseLevel = chooseLevel > 0 && Number(level) >= chooseLevel;
  const isAtChooseLevel = chooseLevel > 0 && Number(level) === chooseLevel;
  const canChoose = chooseLevel > 0 && Number(level) >= chooseLevel;

  // Compute always-prepared list from localOptions payload
  useEffect(() => {
    try {
      setApSubclass([]);
      if (!canChoose || !classSubclassId) return;
      const opt = (localOptions || []).find(o => String(o.id) === String(classSubclassId));
      if (!opt) return;
      const acc = [];
      // If terrain-based mapping exists, prefer it when a terrain was chosen
      const byTerrain = opt.always_prepared_by_terrain || {};
      const chosenTerrain = (() => {
        // Scan picksByLevel for a 'terrain' choice (usually at level 3)
        try {
          const keys = Object.keys(picksByLevel || {}).map(n=>Number(n)).sort((a,b)=>a-b);
          for (const lv of keys) {
            const row = (picksByLevel || {})[lv] || {};
            const t = row.terrain || row.terreno || null;
            if (t) return (typeof t === 'object') ? (t.id || t.name || String(t)) : String(t);
          }
        } catch(_) {}
        return null;
      })();
      const collectUpTo = (map) => {
        const out = [];
        Object.keys(map||{})
          .map(n => Number(n))
          .sort((a,b)=>a-b)
          .forEach(k => {
            if (k <= Number(level)) {
              const arr = map[String(k)] || [];
              arr.forEach(nm => out.push(nm));
            }
          });
        return out;
      };
      if (chosenTerrain && byTerrain[chosenTerrain]) {
        setApSubclass(collectUpTo(byTerrain[chosenTerrain]));
        return;
      }
      // Fallback: generic always_prepared map
      if (opt.always_prepared) {
        setApSubclass(collectUpTo(opt.always_prepared));
        return;
      }
      setApSubclass([]);
    } catch (_) {
      setApSubclass([]);
    }
  }, [localOptions, canChoose, classSubclassId, level, picksByLevel]);

  if (loading) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Subclasse</div>
          <div className={styles.small}>Carregando subclasses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.stepContent}>
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Subclasse</div>
        {!reachedChooseLevel && (
          <div className={styles.small}>Disponível a partir do nível {chooseLevel}.</div>
        )}
        <Select
          placeholder={isAtChooseLevel ? "Selecione a subclasse" : (reachedChooseLevel ? `Subclasse escolhida no nível ${chooseLevel}` : `Disponível no nível ${chooseLevel}`)}
          options={localOptions}
          value={classSubclassId || null}
          onChange={(val) => isAtChooseLevel && setClassSubclassId(val)}
          disabled={!isAtChooseLevel}
        />
        {reachedChooseLevel && (
          <div className={styles.small} style={{ marginTop: 8 }}>
            Algumas subclasses podem conceder recursos adicionais (ex.: magias de lista expandida ou conjuração parcial).
            {localOptions.some(opt => opt.custom) && (
              <div style={{ marginTop: 4, fontStyle: 'italic' }}>
                Subclasses customizadas disponíveis: {localOptions.filter(opt => opt.custom).length}
              </div>
            )}
          </div>
        )}
        {!!(reachedChooseLevel && classSubclassId) && (
          <div className={styles.panel} style={{ marginTop: 8 }}>
              <div className={styles.panelTitle}>Magias da Subclasse (Sempre Preparadas)</div>
              <div className={styles.pillList}>
                {(apSubclass || []).length ? (
                  apSubclass.map((nm, idx) => (
                    <span key={`aps-${idx}`} className={styles.spellPill}>{nm}</span>
                  ))
                ) : (
                  <span className={styles.small} style={{ color: 'var(--muted)' }}>
                    {(() => {
                      const opt = (localOptions || []).find(o => String(o.id) === String(classSubclassId));
                      const hasTerrain = opt && opt.always_prepared_by_terrain && Object.keys(opt.always_prepared_by_terrain).length > 0;
                      return hasTerrain ? 'Selecione o terreno para ver as magias' : 'Nenhuma no nível atual';
                    })()}
                  </span>
                )}
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubclassStepper;
