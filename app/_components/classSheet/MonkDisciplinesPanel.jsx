"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent, CardHeader } from "../UI/Card";
import { apiClient } from "../../_lib/api/client";

function collectChosenDisciplines(meta = {}) {
  const out = [];
  try {
    const per = meta?.class_choices?.per_level || {};
    Object.keys(per).forEach((lvl) => {
      const row = per[lvl] || {};
      const ds = row.disciplines || row.disciplinas || [];
      (Array.isArray(ds) ? ds : [ds]).forEach((x) => {
        if (!x) return;
        const id = (typeof x === 'object') ? (x.id || x.name || String(x)) : String(x);
        const name = (typeof x === 'object') ? (x.name || x.id || String(x)) : String(x);
        if (name) out.push({ level: Number(lvl), id: String(id), name: String(name) });
      });
    });
  } catch (_) {}
  return out;
}

function deriveUpcastMaxByLevel(nivel = 1) {
  const n = Number(nivel) || 1;
  if (n >= 17) return 6;
  if (n >= 13) return 5;
  if (n >= 9) return 4;
  if (n >= 5) return 3;
  return null;
}

export default function MonkDisciplinesPanel({ meta = {}, summary = {}, nivel = 1 }) {
  const [optionsMap, setOptionsMap] = useState({}); // by lower-name or id -> { name, ki_cost, effect }
  const [loading, setLoading] = useState(false);

  const chosen = useMemo(() => collectChosenDisciplines(meta), [meta]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const main = Array.isArray(summary?.klasses) ? summary.klasses.reduce((a,b)=> (a && a.level > b.level) ? a : b, null) : null;
        const klassId = main?.id;
        const subName = String(main?.subclass?.name || '').toLowerCase();
        if (!klassId || !(subName.includes('quatro') || subName.includes('four') || subName.includes('element'))) {
          setOptionsMap({}); setLoading(false); return;
        }
        const res = await apiClient.get(`/api/v1/public/klasses/${klassId}/subclasses`);
        const subs = Array.isArray(res?.subclasses) ? res.subclasses : [];
        const hit = subs.find(sc => String(sc?.name || '').toLowerCase().includes('quatro') || String(sc?.name || '').toLowerCase().includes('four')) || null;
        const add = hit?.additional_choices_by_level || {};
        const map = {};
        Object.values(add).forEach((row) => {
          const d = row?.disciplines || row?.disciplinas;
          if (!d) return;
          const opts = Array.isArray(d?.options) ? d.options : [];
          opts.forEach((o) => {
            const id = String(o?.id || o?.name || '');
            const name = String(o?.name || o?.id || '');
            if (!name) return;
            const lower = name.toLowerCase();
            const kiCost = (o?.ki_cost != null) ? o.ki_cost : (o?.rules?.ki_cost);
            const effect = o?.effect || o?.rules?.effect || '';
            map[id] = { id, name, ki_cost: kiCost, effect };
            map[lower] = map[id];
          });
        });
        setOptionsMap(map);
      } catch (_) {
        setOptionsMap({});
      } finally { setLoading(false); }
    })();
  }, [summary]);

  const upcastCap = deriveUpcastMaxByLevel(nivel);
  const alwaysKnown = ['Sintonia Elemental'];
  const expectedByTier = useMemo(() => {
    return {
      3: 1,
      6: 1,
      11: 1,
      17: 1,
      always: alwaysKnown.length
    };
  }, []);

  // Count picks per tier actually chosen
  const chosenByTier = useMemo(() => {
    const map = { 3: 0, 6: 0, 11: 0, 17: 0 };
    chosen.forEach((c) => {
      const lv = Number(c.level || 0);
      if (lv >= 17) map[17] += 1;
      else if (lv >= 11) map[11] += 1;
      else if (lv >= 6) map[6] += 1;
      else if (lv >= 3) map[3] += 1;
    });
    return map;
  }, [chosen]);

  const pills = useMemo(() => {
    if (!chosen || chosen.length === 0) return [];
    return chosen
      .sort((a,b) => (a.level||99) - (b.level||99))
      .map((c) => {
        const key = optionsMap[c.id] ? c.id : (optionsMap[c.name?.toLowerCase?.()] ? c.name.toLowerCase() : null);
        const base = key ? optionsMap[key] : null;
        return {
          name: c.name,
          level: c.level,
          ki_cost: (base && base.ki_cost != null) ? base.ki_cost : '—',
          effect: base?.effect || ''
        };
      });
  }, [chosen, optionsMap]);

  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardHeader>Disciplinas Elementais</CardHeader>
      <CardContent>
        <div className={styles.bigBox} style={{ marginBottom: 10 }}>
          <div className={styles.sectionCap}>RESUMO</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap: 8, marginTop: 6 }}>
            <div><b>Conhecidas:</b> {pills.length + alwaysKnown.length}</div>
            <div><b>Esperadas:</b> {expectedByTier[3] + expectedByTier[6] + expectedByTier[11] + expectedByTier[17] + expectedByTier.always}</div>
            <div><b>Upcast máx. (Ki):</b> {upcastCap ?? '—'}</div>
            <div><b>Estado:</b> {loading ? 'carregando...' : 'ok'}</div>
          </div>
          <div className={styles.small} style={{ marginTop: 6, color: 'var(--secundary-text)', whiteSpace: 'normal' }}>
            Sempre conhecida: Sintonia Elemental. Custo e efeitos resumidos abaixo; algumas disciplinas permitem gastar Ki adicional para ampliar efeito.
          </div>
        </div>

        <div className={styles.sectionCap}>DISCIPLINAS ESCOLHIDAS</div>
        <div className={styles.bigBox}>
          {pills.length === 0 && (
            <div className={styles.small} style={{ color: 'var(--secundary-text)' }}>
              Nenhuma disciplina registrada nas escolhas da ficha.
            </div>
          )}
          {pills.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
              {pills.map((p, idx) => (
                <div key={`${p.name}-${idx}`} className={styles.conjBox}>
                  <div className={styles.conjPills}>
                    <div className={styles.pill}><span>Ki</span><strong>{p.ki_cost}</strong></div>
                    <div className={styles.pill}><span>Nível</span><strong>{p.level}</strong></div>
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{p.name}</div>
                  {p.effect && (
                    <div className={styles.small} style={{ marginTop: 4, color: 'var(--secundary-text)', whiteSpace: 'normal' }}>{p.effect}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.sectionCap}>PROGRESSO POR PATAMAR</div>
        <div className={styles.bigBox}>
          <div className={styles.conjPills}>
            <div className={styles.pill}><span>3º</span><strong>{chosenByTier[3]}/{expectedByTier[3]}</strong></div>
            <div className={styles.pill}><span>6º</span><strong>{chosenByTier[6]}/{expectedByTier[6]}</strong></div>
            <div className={styles.pill}><span>11º</span><strong>{chosenByTier[11]}/{expectedByTier[11]}</strong></div>
            <div className={styles.pill}><span>17º</span><strong>{chosenByTier[17]}/{expectedByTier[17]}</strong></div>
            <div className={styles.pill}><span>Sempre</span><strong>{alwaysKnown.length}</strong></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
