"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "../UI/Card";
import Popover from "../UI/Popover";
import styles from "../../_styles/character/CharacterForm.module.css";

const MANEUVER_DESCRIPTIONS = {
  aparar: "Reação ao sofrer dano de ataque corpo a corpo: gaste 1 dado de superioridade para reduzir o dano igual ao resultado + mod.Destreza.",
  ameacador: "Ao acertar, gaste 1 dado: alvo faz TR Sabedoria; falha → fica amedrontado até o fim do seu próximo turno; some o dado ao dano.",
  encontrao: "Ao acertar, gaste 1 dado: empurre o alvo 4,5 m; some o dado ao dano.",
  desarmar: "Ao acertar, gaste 1 dado: alvo solta 1 item que segura; some o dado ao dano.",
  trespassante: "Ao acertar, gaste 1 dado: excedente de dano pode atingir outra criatura a 1,5 m do alvo; some o dado ao dano.",
  provocante: "Ao acertar, gaste 1 dado: você provoca o alvo; até o fim do próximo turno, ele tem desvantagem em ataques contra alvos que não sejam você; some o dado ao dano.",
  derrubar: "Ao acertar, gaste 1 dado: alvo faz TR Força; falha → fica caído; some o dado ao dano.",
  distrativo: "Ao acertar, gaste 1 dado: concede vantagem no próximo ataque de um aliado contra o alvo; some o dado ao dano.",
  ripostar: "Quando uma criatura erra um ataque contra você, reação: gaste 1 dado para fazer 1 ataque com arma; some o dado ao dano se acertar.",
  preciso: "Antes de saber o resultado, gaste 1 dado e adicione o resultado à jogada de ataque.",
};

export default function BattleMasterPanel({ nivel = 1, meta = {}, summary = {} }) {
  // Derive superiority dice by Fighter level (BM)
  const dados = useMemo(() => (nivel >= 15 ? 6 : nivel >= 7 ? 5 : nivel >= 3 ? 4 : 0), [nivel]);
  const dado = useMemo(() => (nivel >= 18 ? 'd12' : nivel >= 10 ? 'd10' : 'd8'), [nivel]);

  // Collect selected maneuvers from metadata per_level and from feats (e.g., talento Adepto Marcial)
  const maneuvers = useMemo(() => {
    try {
      const per = meta?.class_choices?.per_level || {};
      const seen = new Set();
      const list = [];
      Object.values(per).forEach((row) => {
        const arr = (Array.isArray(row?.maneuvers) ? row.maneuvers : [])
          .concat(Array.isArray(row?.manobras) ? row.manobras : []);
        arr.forEach((m) => {
          const id = (m && typeof m === 'object') ? (m.id || m.name) : m;
          const name = (m && typeof m === 'object') ? (m.name || m.id) : m;
          const key = String(id || name);
          if (key && !seen.has(key)) {
            seen.add(key);
            list.push({ id: id || key, name: name || key });
          }
        });
      });

      // Merge maneuvers that came from feats (metadata.feats and/or summary.feats)
      try {
        const pushFrom = (arr) => {
          (arr || []).forEach((f) => {
            const ch = f?.choices || f?.choices_data || {};
            const ms = Array.isArray(ch?.maneuvers) ? ch.maneuvers : (Array.isArray(ch?.manobras) ? ch.manobras : []);
            (ms || []).forEach((m) => {
              const id = (m && typeof m === 'object') ? (m.id || m.name) : m;
              const name = (m && typeof m === 'object') ? (m.name || m.id) : m;
              const key = String(id || name);
              if (key && !seen.has(key)) {
                seen.add(key);
                list.push({ id: id || key, name: name || key });
              }
            });
          });
        };
        // From metadata
        if (Array.isArray(meta?.feats)) pushFrom(meta.feats);
        // From summary (DB-backed feats list)
        if (Array.isArray(summary?.feats)) pushFrom(summary.feats);
      } catch (_) {}

      return list;
    } catch(_) { return []; }
  }, [meta, summary]);

  const [anchor, setAnchor] = useState(null);
  const [current, setCurrent] = useState(null);
  const open = (e, item) => { setCurrent(item); setAnchor(e.currentTarget); };
  const close = () => { setAnchor(null); setCurrent(null); };

  const mhProps = (() => {
    try { return summary?.equipment?.equipped?.main_hand?.weapon_props || null; } catch(_) { return null; }
  })();
  const hasWeapon = !!mhProps;
  const hasMelee = !!(mhProps && String(mhProps.type || '').toLowerCase() === 'melee');

  const reqFor = (idOrName) => {
    const key = String(idOrName || '').toLowerCase();
    // Default: weapon attack required
    const needsWeapon = [
      'ameacador','ameaçador','provocante','distrativo','desarmar','preciso','encontrao','encontrão','trespassante','derrubar'
    ];
    if (needsWeapon.some(k => key.includes(k))) {
      return hasWeapon ? { ok: true, msg: 'Pronto — requer ataque com arma' } : { ok: false, msg: 'Necessita arma equipada' };
    }
    // Ripostar: exige arma corpo a corpo (o ataque é com arma corpo a corpo na reação)
    if (key.includes('ripostar') || key.includes('contra-atacar') || key.includes('contra atacar')) {
      return hasMelee ? { ok: true, msg: 'Pronto — reação com arma corpo a corpo' } : { ok: false, msg: 'Necessita arma corpo a corpo' };
    }
    // Aparar: reação ao sofrer dano de ataque corpo a corpo; sem requisito de arma na mão
    if (key.includes('aparar')) {
      return { ok: true, msg: 'Situação: reação quando sofrer dano CC' };
    }
    // fallback
    return hasWeapon ? { ok: true, msg: 'Pronto' } : { ok: false, msg: 'Necessita arma equipada' };
  };

  if (dados === 0 && maneuvers.length === 0) return null;

  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardContent>
        <div className={styles.sectionCap}>SUPERIORIDADE EM COMBATE</div>
        <div className={styles.conjPanel}>
          <div className={styles.conjBoxRow}>
            <div className={styles.conjBox}><div className={styles.conjLabel}>Dados</div><div className={styles.conjOctagon}>{dados || '—'}</div></div>
            <div className={styles.conjBox}><div className={styles.conjLabel}>Dado</div><div className={styles.conjOctagon}>{dado}</div></div>
            <div className={styles.conjBox}><div className={styles.conjLabel}>Recuperação</div><div className={styles.conjOctagon} title="Recupera todos em descanso curto ou longo">SR/LR</div></div>
          </div>
        </div>

        {maneuvers.length > 0 && (
          <div className={styles.panel} style={{ marginTop: 12 }}>
            <div className={styles.panelTitle}>Manobras</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {maneuvers.map((m) => (
                <button key={String(m.id)} type="button" className={styles.stepTab}
                        onClick={(e) => open(e, m)} title="Clique para detalhes">
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <Popover
          anchorEl={anchor}
          open={!!anchor}
          onClose={close}
          placement="bottom"
          width={360}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          marginThreshold={8}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{current?.name || 'Manobra'}</div>
          <div className={styles.small} style={{ marginBottom: 6 }}>{(() => {
            const key = String(current?.id || current?.name || '').toLowerCase();
            // map PT ids and names to known descriptors
            const mapKey = Object.keys(MANEUVER_DESCRIPTIONS).find(k => key.includes(k) || (current?.name||'').toLowerCase().includes(k));
            return MANEUVER_DESCRIPTIONS[mapKey] || 'Sem descrição detalhada disponível.';
          })()}</div>
          <div className={styles.small}>
            {(() => {
              const k = (current?.id || current?.name || '');
              const st = reqFor(k);
              return (
                <span style={{
                  display: 'inline-block',
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: st.ok ? 'var(--success)' : 'var(--secondary)',
                  color: 'var(--default)'
                }}>
                  {st.msg}
                </span>
              );
            })()}
          </div>
        </Popover>
      </CardContent>
    </Card>
  );
}
