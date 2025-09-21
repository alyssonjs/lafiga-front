"use client";

import { useMemo, useState } from "react";
import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";
import Popover from "../UI/Popover";

function collectExtras(meta = {}) {
  const out = [];
  const per = meta?.class_choices?.per_level || {};
  Object.entries(per).forEach(([lvl, row]) => {
    if (!row) return;
    // Try generic keys that might exist in metadata for classes
    if (row.expertise_skills || row.expertise) {
      const arr = row.expertise_skills || row.expertise;
      const list = (Array.isArray(arr) ? arr : [arr]).map(x => x?.name || x).join(', ');
      out.push(`Perícia Aprimorada (${lvl}): ${list}`);
    }
    if (row.fighting_style) {
      const v = row.fighting_style;
      out.push(`Estilo de Luta (${lvl}): ${v.name || v}`);
    }
    if (row.maneuvers || row.manobras) {
      const mans = row.maneuvers || row.manobras;
      const list = (Array.isArray(mans) ? mans : [mans]).map(x => x?.name || x).join(', ');
      out.push(`Manobras (${lvl}): ${list}`);
    }
    // Beast Master companion
    try {
      const bc = row?.beast_companion;
      if (bc) {
        const nm = (bc && typeof bc === 'object') ? (bc.name || bc.id) : bc;
        const idx = row?.beast_companion_index;
        let line = `Companheiro (${lvl}): ${nm}`;
        if (idx) line += ` [${idx}]`;
        out.push(line);
      }
    } catch(_) {}
  });

  // Fighting Style bonuses ativos (do backend equipment.mods)
  try {
    const mods = meta?.equipment?.mods || {};
    const styles = mods.active_styles || [];
    if (styles.length) {
      out.push(`Estilo ativo: ${styles.join(', ')}`);
    }
    const wm = mods.weapon_mods || {};
    const fmt = (side, m) => {
      const parts = [];
      if ((m?.attack || 0) > 0) parts.push(`+${m.attack} Ataque`);
      if ((m?.damage || 0) > 0) parts.push(`+${m.damage} Dano`);
      if (m?.offhand_add_ability) parts.push('Off‑hand soma modificador');
      if (parts.length) out.push(`${side}: ${parts.join(', ')}`);
    };
    if (wm.main_hand) fmt('Mão principal', wm.main_hand);
    if (wm.off_hand) fmt('Mão secundária', wm.off_hand);
  } catch (_) {}

  // Ranger: exibir Inimigo/Terreno Favoritos agregados
  try {
    const enemies = [];
    const terrains = [];
    Object.values(per).forEach((row) => {
      const fav = row?.favored_enemy;
      if (fav) {
        const name = fav?.name || fav;
        let extra = '';
        if (String(name).toLowerCase().includes('humanoide') && Array.isArray(row?.favored_enemy_details) && row.favored_enemy_details.length) {
          const det = row.favored_enemy_details.map((x) => (x?.name || x)).join(', ');
          extra = ` (${det})`;
        }
        enemies.push(`${name}${extra}`);
      }
      const t = row?.favored_terrain;
      if (t) terrains.push(t?.name || t);
    });
    if (enemies.length) out.push(`Inimigos Favoritos: ${Array.from(new Set(enemies)).join(', ')}`);
    if (terrains.length) out.push(`Terrenos Favoritos: ${Array.from(new Set(terrains)).join(', ')}`);
    // Efeitos informativos de Explorador Nato / Consciência Primitiva
    const main = (() => {
      try {
        const list = Array.isArray(meta?.klasses) ? meta.klasses : [];
        return list.reduce((a,b)=> (!a || (b?.level||0) > (a?.level||0)) ? b : a, null);
      } catch(_) { return null; }
    })();
    const cname = String(main?.name || meta?.class_summary?.name || '').toLowerCase();
    const isRanger = cname.includes('patrulheiro') || cname.includes('ranger');
    const lvl = Number(main?.level || 0);
    if (isRanger) {
      out.push('Explorador Nato: ignora terreno difícil em viagem; vantagem em iniciativa/Percepção em terreno favorito; não se perde facilmente.');
      if (lvl >= 3) out.push('Consciência Primitiva: detecta a presença de tipos de criaturas gastando espaços de magia (sem localização exata).');
    }
  } catch (_) {}

  // Rogue: Cunning Action (Ação Ardilosa) from level 2
  try {
    const klasses = Array.isArray(meta?.klasses) ? meta.klasses : [];
    const main = klasses.reduce((a,b)=> (!a || (b?.level||0) > (a?.level||0)) ? b : a, null);
    const name = String(main?.name || '').toLowerCase();
    const isRogue = name.includes('ladino') || name.includes('rogue');
    const lvl = Number(main?.level || 0);
    if (isRogue && lvl >= 2) {
      out.push('Ação Ardilosa: pode usar Desengajar, Disparada ou Esconder como Ação Bônus.');
    }
  } catch (_) {}
  return Array.from(new Set(out));
}

// Descrições resumidas para tooltip de manobras
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
  preciso: "Antes de saber o resultado, gaste 1 dado e adicione o resultado à jogada de ataque."
};

// Descrições de Estilos de Luta
const FS_DESCRIPTIONS = {
  defesa: "+1 na CA enquanto estiver usando armadura.",
  defense: "+1 Armor Class while wearing armor.",
  arquearia: "+2 nas jogadas de ataque com armas à distância.",
  archery: "+2 to attack rolls you make with ranged weapons.",
  duelos: "+2 no dano com uma arma corpo a corpo empunhada com uma mão e sem outra arma.",
  duelo: "+2 no dano com uma arma corpo a corpo empunhada com uma mão e sem outra arma.",
  dueling: "+2 to damage rolls when wielding a melee weapon in one hand and no other weapon.",
  "combate com duas armas": "Adicione seu modificador de habilidade ao dano do segundo ataque ao lutar com duas armas.",
  "two-weapon fighting": "Add your ability modifier to the damage of the second attack when two-weapon fighting.",
  protecao: "Reação: quando uma criatura que você vê ataca um alvo diferente de você a 1,5 m de você, imponha desvantagem (requer escudo).",
  proteção: "Reação: quando uma criatura que você vê ataca um alvo diferente de você a 1,5 m de você, imponha desvantagem (requer escudo).",
  protection: "When a creature you can see attacks a target other than you within 5 feet, impose disadvantage (requires a shield).",
  "grande arma": "Quando rolar 1 ou 2 no dado de dano com arma de duas mãos/versátil (duas mãos), pode rolar novamente o dado e deve usar o novo resultado.",
  "great weapon": "When you roll a 1 or 2 on a damage die with a two-handed/versatile (two-handed) melee weapon, reroll the die and must use the new roll."
};

function collectFeatManeuvers(meta = {}, summary = {}) {
  const out = [];
  const seen = new Set();
  const push = (m) => {
    const id = (m && typeof m === 'object') ? (m.id || m.name) : m;
    const name = (m && typeof m === 'object') ? (m.name || m.id) : m;
    const key = String(id || name);
    if (!key) return;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ id: id || key, name: name || key });
  };
  try {
    const per = meta?.class_choices?.per_level || {};
    Object.values(per).forEach((row) => {
      const arr = []
        .concat(Array.isArray(row?.maneuvers) ? row.maneuvers : (row?.maneuvers ? [row.maneuvers] : []))
        .concat(Array.isArray(row?.manobras) ? row.manobras : (row?.manobras ? [row.manobras] : []));
      arr.forEach(push);
    });
  } catch (_) {}
  const addFromFeats = (arr) => {
    (arr || []).forEach((f) => {
      const ch = f?.choices || f?.choices_data || {};
      const mans = Array.isArray(ch?.maneuvers) ? ch.maneuvers : (Array.isArray(ch?.manobras) ? ch.manobras : []);
      (mans || []).forEach(push);
    });
  };
  try { if (Array.isArray(meta?.feats)) addFromFeats(meta.feats); } catch (_) {}
  try { if (Array.isArray(summary?.feats)) addFromFeats(summary.feats); } catch (_) {}
  return out;
}

export default function CombatExtrasPanel({ meta = {}, summary = {} }) {
  const lines = collectExtras(meta);
  const content = lines.length ? lines.join("\n") : '—';
  const maneuvers = useMemo(() => collectFeatManeuvers(meta, summary), [meta, summary]);

  // Detectar se a classe principal é Guerreiro; nesse caso, o bloco de Manobras
  // será exibido pelo FighterCombatExtras (evitar duplicidade)
  const isFighterMain = useMemo(() => {
    try {
      const list = Array.isArray(summary?.klasses) ? summary.klasses : [];
      if (list.length) {
        const main = list.reduce((a,b)=> (!a || (b?.level||0) > (a?.level||0)) ? b : a, null);
        const nm = String(main?.name || '').toLowerCase();
        return nm.includes('guerreiro') || nm.includes('fighter');
      }
      const nm2 = String(meta?.class_summary?.name || meta?.class_summary?.klass_name || '').toLowerCase();
      return nm2.includes('guerreiro') || nm2.includes('fighter');
    } catch(_) { return false; }
  }, [summary, meta]);

  // Requisitos simples baseados no equipamento atual
  const mhProps = (() => {
    try { return summary?.equipment?.equipped?.main_hand?.weapon_props || null; } catch(_) { return null; }
  })();
  const hasWeapon = !!mhProps;
  const hasMelee = !!(mhProps && String(mhProps.type || '').toLowerCase() === 'melee');
  const reqFor = (idOrName) => {
    const key = String(idOrName || '').toLowerCase();
    const needsWeapon = [
      'ameacador','ameaçador','provocante','distrativo','desarmar','preciso','encontrao','encontrão','trespassante','derrubar'
    ];
    if (needsWeapon.some(k => key.includes(k))) {
      return hasWeapon ? { ok: true, msg: 'Pronto — requer ataque com arma' } : { ok: false, msg: 'Necessita arma equipada' };
    }
    if (key.includes('ripostar') || key.includes('contra-atacar') || key.includes('contra atacar')) {
      return hasMelee ? { ok: true, msg: 'Pronto — reação com arma corpo a corpo' } : { ok: false, msg: 'Necessita arma corpo a corpo' };
    }
    if (key.includes('aparar')) return { ok: true, msg: 'Situação: reação quando sofrer dano CC' };
    return hasWeapon ? { ok: true, msg: 'Pronto' } : { ok: false, msg: 'Necessita arma equipada' };
  };

  const [anchor, setAnchor] = useState(null);
  const [current, setCurrent] = useState(null);
  const open = (e, m) => { setCurrent(m); setAnchor(e.currentTarget); };
  const close = () => { setAnchor(null); setCurrent(null); };

  // Fighting styles list (top + per-level) e popover
  const fightingStyles = useMemo(() => {
    const out = [];
    try {
      const fsTop = meta?.class_summary?.fighting_style || meta?.class_choices?.fighting_style || null;
      if (fsTop) out.push((fsTop.name || fsTop));
      const per = meta?.class_choices?.per_level || {};
      Object.values(per).forEach((row) => {
        const v = row?.fighting_style;
        if (v) out.push((v.name || v));
      });
    } catch(_) {}
    const seen = new Set();
    return out.map(x => (typeof x === 'object' ? (x.name || x.id) : x)).filter(Boolean).filter((nm) => {
      const k = String(nm);
      if (seen.has(k)) return false; seen.add(k); return true;
    });
  }, [meta]);

  const activeStyles = useMemo(() => {
    try { return Array.isArray(summary?.equipment?.mods?.active_styles) ? summary.equipment.mods.active_styles : []; } catch(_) { return []; }
  }, [summary]);

  const reqTextForFS = (nm) => {
    const k = String(nm || '').toLowerCase();
    if (k.includes('defesa') || k.includes('defense')) return 'Requer: usando armadura.';
    if (k.includes('arquearia') || k.includes('archery')) return 'Requer: arma à distância na mão principal.';
    if (k.includes('duelo') || k.includes('duelos') || k.includes('dueling')) return 'Requer: arma corpo a corpo em uma mão e sem outra arma.';
    if (k.includes('duas') || k.includes('two-weapon')) return 'Requer: duas armas (uma em cada mão).';
    if (k.includes('prote') || k.includes('protection')) return 'Requer: escudo equipado.';
    if (k.includes('grande arma') || k.includes('great weapon')) return 'Requer: arma de duas mãos ou versátil (usada com duas mãos).';
    return null;
  };
  const isActiveFS = (nm) => {
    const key = String(nm || '');
    return activeStyles.some((s) => String(s).toLowerCase().includes(key.toLowerCase()))
  };
  const [fsAnchor, setFsAnchor] = useState(null);
  const [fsCurrent, setFsCurrent] = useState(null);
  const openFS = (e, name) => { setFsCurrent(name); setFsAnchor(e.currentTarget); };
  const closeFS = () => { setFsAnchor(null); setFsCurrent(null); };
  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardContent>
        <div className={styles.sectionCap}>CARACTERÍSTICAS ADICIONAIS DE COMBATE</div>
        <div className={styles.bigBox} style={{ minHeight: 220, whiteSpace: 'pre-wrap' }}>
          {content}
        </div>

        {fightingStyles.length > 0 && (
          <div className={styles.panel} style={{ marginTop: 12 }}>
            <div className={styles.panelTitle}>Estilo de Luta</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {fightingStyles.map((nm) => (
                <button key={String(nm)} type="button" className={styles.stepTab}
                        onClick={(e)=> openFS(e, nm)} title="Clique para detalhes">
                  {nm}
                </button>
              ))}
            </div>
          </div>
        )}

        {(!isFighterMain) && maneuvers.length > 0 && (
          <div className={styles.panel} style={{ marginTop: 12 }}>
            <div className={styles.panelTitle}>Manobras</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {maneuvers.map((m) => (
                <button key={String(m.id)} type="button" className={styles.stepTab}
                        onClick={(e)=> open(e, m)} title="Clique para detalhes">
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
            const mapKey = Object.keys(MANEUVER_DESCRIPTIONS).find(k => key.includes(k) || (current?.name||'').toLowerCase().includes(k));
            return MANEUVER_DESCRIPTIONS[mapKey] || 'Sem descrição detalhada disponível.';
          })()}</div>
          <div className={styles.small}>
            {(() => {
              const st = reqFor(current?.id || current?.name);
              return (
                <span style={{ display:'inline-block', padding:'3px 8px', borderRadius: 999, background: st.ok ? 'var(--success)' : 'var(--secondary)', color: 'var(--default)' }}>
                  {st.msg}
                </span>
              );
            })()}
          </div>
        </Popover>

        <Popover
          anchorEl={fsAnchor}
          open={!!fsAnchor}
          onClose={closeFS}
          placement="bottom"
          width={360}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          marginThreshold={8}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{fsCurrent || 'Estilo de Luta'}</div>
          <div className={styles.small} style={{ marginBottom: 6 }}>{(() => {
            const key = String(fsCurrent || '').toLowerCase();
            const match = Object.keys(FS_DESCRIPTIONS).find(k => key.includes(k));
            return FS_DESCRIPTIONS[match] || 'Sem descrição disponível.';
          })()}</div>
          <div className={styles.small}>
            {(() => {
              const active = isActiveFS(fsCurrent);
              const req = reqTextForFS(fsCurrent);
              return (
                <span style={{ display:'inline-block', padding:'3px 8px', borderRadius: 999, background: active ? 'var(--success)' : 'var(--secondary)', color: 'var(--default)' }}>
                  {active ? 'Ativo' : (req ? `Inativo — ${req}` : 'Inativo')}
                </span>
              );
            })()}
          </div>
        </Popover>
      </CardContent>
    </Card>
  );
}
