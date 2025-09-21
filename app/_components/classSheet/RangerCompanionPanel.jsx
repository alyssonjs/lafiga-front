"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent, CardHeader } from "../UI/Card";

function findCompanion(meta = {}) {
  try {
    const per = meta?.class_choices?.per_level || {};
    const levels = Object.keys(per).map(n=>Number(n)).sort((a,b)=>a-b);
    for (const lvl of levels) {
      const row = per[lvl] || {};
      const bc = row?.beast_companion;
      if (bc) {
        const name = (bc && typeof bc === 'object') ? (bc.name || bc.id || String(bc)) : String(bc);
        const idx = row?.beast_companion_index || null;
        return { level: lvl, name, index: idx };
      }
    }
  } catch(_) {}
  return null;
}

function profBonusFromLevel(n) {
  const lvl = Number(n)||1;
  return 2 + Math.floor((lvl - 1) / 4);
}

export default function RangerCompanionPanel({ meta = {}, summary = {} }) {
  // Only show for Ranger Beast Master
  try {
    const main = (Array.isArray(summary?.klasses) ? summary.klasses : []).reduce((a,b)=> (!a || (b?.level||0) > (a?.level||0)) ? b : a, null);
    const cname = String(main?.name || meta?.class_summary?.name || '').toLowerCase();
    const isRanger = cname.includes('patrulheiro') || cname.includes('ranger');
    const sub = String(main?.subclass?.name || meta?.class_summary?.subclass || '').toLowerCase();
    const isBeastMaster = isRanger && (sub.includes('best') || sub.includes('mestre'));
    if (!isBeastMaster) return null;
  } catch(_) { return null; }

  const comp = findCompanion(meta);
  const rangerLevel = Number(((summary?.klasses || [])[0]?.level) || meta?.class_summary?.level || 1);
  const pb = profBonusFromLevel(rangerLevel);

  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardHeader>Companheiro de Patrulha</CardHeader>
      <CardContent>
        <div className={styles.bigBox}>
          <div className={styles.conjPills}>
            <div className={styles.pill}><span>Nível do Patrulheiro</span><strong>{rangerLevel}</strong></div>
            <div className={styles.pill}><span>Bônus de Proficiência</span><strong>{`+${pb}`}</strong></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8, width:'100%' }}>
            <div className={styles.conjBox}>
              <div className={styles.conjLabel}>Companheiro</div>
              <div style={{ fontWeight: 600 }}>{comp ? (comp.name || '—') : '—'}</div>
              {comp?.index && (
                <div className={styles.small} style={{ color:'var(--secundary-text)' }}>Índice SRD: {comp.index}</div>
              )}
            </div>
            <div className={styles.conjBox}>
              <div className={styles.conjLabel}>Diretrizes de Estatísticas</div>
              <div className={styles.small} style={{ whiteSpace:'normal', textAlign:'center' }}>
                CA: da besta + seu bônus de proficiência.<br/>
                Ataques/Dano/Testes/Perícias: somam seu bônus de proficiência quando aplicável.
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sectionCap}>PONTOS DE VIDA</div>
        <div className={styles.bigBox}>
          <div className={styles.conjBox}>
            <div className={styles.conjLabel}>Cálculo Sugerido</div>
            <div className={styles.small} style={{ whiteSpace:'normal', textAlign:'center' }}>
              PV do companheiro = máximo entre os PV normais da besta e {`4 × nível de Patrulheiro (${4 * (Number(rangerLevel)||1)})`}.
            </div>
          </div>
        </div>

        <div className={styles.sectionCap}>INICIATIVA & COMANDOS</div>
        <div className={styles.bigBox}>
          <div className={styles.small} style={{ whiteSpace:'normal' }}>
            Atua na sua iniciativa. Sem comando, apenas Reações.
            <br/>Comando de movimento: verbal (sem ação).
            <br/>Comando de ação (custa sua Ação): Ataque, Disparada, Desengajar, Esquivar, Ajuda.
            <br/>Se você tiver Ataque Extra, ao comandar “Ataque” você pode fazer 1 ataque com arma.
          </div>
        </div>

        <div className={styles.sectionCap}>VÍNCULO & SUBSTITUIÇÃO</div>
        <div className={styles.bigBox}>
          <div className={styles.small} style={{ whiteSpace:'normal' }}>
            Ritual de 8 horas para vincular uma nova besta não‑hostil.
            <br/>Em sua ausência ou incapacitado, o companheiro prioriza defendê‑lo.
            <br/>Em terreno favorito, viajando só com a besta, pode mover‑se furtivamente em ritmo normal.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

