"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "../UI/Card";
import styles from "../../_styles/character/CharacterForm.module.css";
import { apiClient } from "../../_lib/api/client";

export default function PaladinOathPanel({ summary = {} }) {
  const [oathSpells, setOathSpells] = useState({}); // { lvl: [names] }
  const [loading, setLoading] = useState(false);

  const main = useMemo(() => {
    try { return (summary?.klasses || []).reduce((a,b)=> (a && a.level > b.level) ? a : b, null); } catch(_) { return null; }
  }, [summary]);
  const subclassName = String(main?.subclass?.name || '');
  const palLevel = Number(main?.level || 0);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const klassId = main?.id;
        if (!klassId) { setOathSpells({}); return; }
        const res = await apiClient.get(`/api/v1/public/klasses/${klassId}/subclasses`);
        const subs = Array.isArray(res?.subclasses) ? res.subclasses : [];
        // Match by name case-insensitive (PT/EN)
        const sub = subs.find((s) => String(s?.name || '').toLowerCase() === subclassName.toLowerCase());
        const ap = sub?.always_prepared || {};
        // Normalize to { lvl: [string] }
        const map = {};
        Object.entries(ap).forEach(([lvl, arr]) => {
          const list = Array.isArray(arr) ? arr.map(x => (typeof x === 'string' ? x : (x?.name || x))) : [];
          if (list.length) map[lvl] = list;
        });
        setOathSpells(map);
      } catch (_) {
        setOathSpells({});
      } finally { setLoading(false); }
    })();
  }, [main?.id, subclassName]);

  // Channel Divinity features from the summary features list
  const channelDivinity = useMemo(() => {
    try {
      const feats = Array.isArray(summary?.features) ? summary.features : [];
      const hits = feats.filter((f) => {
        const nm = String(f?.name || '').toLowerCase();
        return nm.includes('canalizar divindade') || nm.includes('channel divinity');
      });
      return hits.map((f) => ({ name: f?.name || 'Canalizar Divindade', desc: f?.desc || '' }));
    } catch(_) { return []; }
  }, [summary]);

  if (!main || !(String(main?.name||'').toLowerCase().includes('paladino') || String(main?.name||'').toLowerCase().includes('paladin'))) return null;

  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardHeader>Juramento: Referências Rápidas</CardHeader>
      <CardContent>
        {/* Auras (escala com nível) */}
        {palLevel >= 6 && (
          <>
            <div className={styles.sectionCap}>AURAS</div>
            <div className={styles.bigBox}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap: 8 }}>
                {/* Aura de Proteção (nível 6) */}
                <div className={styles.conjBox}>
                  <div className={styles.conjPills}>
                    <div className={styles.pill}><span>Nível</span><strong>6+</strong></div>
                    <div className={styles.pill}><span>Raio</span><strong>{palLevel >= 18 ? '9 m' : '3 m'}</strong></div>
                  </div>
                  <div style={{ fontWeight: 600 }}>Aura de Proteção</div>
                  <div className={styles.small} style={{ marginTop: 4, color:'var(--secundary-text)', whiteSpace:'normal' }}>
                    Você e aliados no raio adicionam seu mod. de Carisma aos testes de resistência.
                  </div>
                </div>
                {/* Aura de Coragem (nível 10) */}
                {palLevel >= 10 && (
                  <div className={styles.conjBox}>
                    <div className={styles.conjPills}>
                      <div className={styles.pill}><span>Nível</span><strong>10+</strong></div>
                      <div className={styles.pill}><span>Raio</span><strong>{palLevel >= 18 ? '9 m' : '3 m'}</strong></div>
                    </div>
                    <div style={{ fontWeight: 600 }}>Aura de Coragem</div>
                    <div className={styles.small} style={{ marginTop: 4, color:'var(--secundary-text)', whiteSpace:'normal' }}>
                      Você e aliados no raio não podem ser amedrontados enquanto você estiver consciente.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        <div className={styles.sectionCap}>MAGIAS DO JURAMENTO</div>
        <div className={styles.bigBox}>
          {(() => {
            const keys = Object.keys(oathSpells || {}).map(n=>Number(n)).sort((a,b)=>a-b);
            if (!keys.length) return (
              <div className={styles.small} style={{ color:'var(--secundary-text)' }}>
                {loading ? 'Carregando…' : 'Nenhuma magia do juramento encontrada para este nível.'}
              </div>
            );
            return (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap: 8 }}>
                {keys.map((lvl) => (
                  <div key={lvl} className={styles.conjBox}>
                    <div className={styles.conjPills}>
                      <div className={styles.pill}><span>Nível</span><strong>{lvl}</strong></div>
                    </div>
                    <div style={{ width:'100%', whiteSpace:'pre-wrap' }}>
                      {(oathSpells[String(lvl)] || []).join('\n')}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {channelDivinity.length > 0 && (
          <>
            <div className={styles.sectionCap}>CANALIZAR DIVINDADE</div>
            <div className={styles.bigBox}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap: 8 }}>
                {channelDivinity.map((c, idx) => (
                  <div key={`${c.name}-${idx}`} className={styles.conjBox}>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    {c.desc && (
                      <div className={styles.small} style={{ marginTop: 4, color:'var(--secundary-text)', whiteSpace:'normal' }}>{c.desc}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
