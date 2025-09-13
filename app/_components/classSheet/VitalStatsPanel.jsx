"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";
import Tooltip from "../UI/Tooltip";

export default function VitalStatsPanel({ atributos = [], desloc = '—', vida = { atual: '—', max: '—' }, tempHp = 0, hitDie = 'd8', summary = null }) {
  const dexScore = Number(atributos.find(a=>a.a==='DES')?.s) || 10;
  const dexMod = Math.floor((dexScore - 10) / 2);
  // Prefer backend equipment AC (includes armor/shield, FS, caps, etc.)
  const caFromSummary = (() => {
    try { return Number(summary?.equipment?.ac?.ac); } catch (_) { return null; }
  })();
  const ca = Number.isFinite(caFromSummary) ? caFromSummary : (10 + dexMod);
  const iniciativa = dexMod;
  const die = String(hitDie).startsWith('d') ? String(hitDie) : `d${hitDie}`;

  const caSource = (() => { try { return summary?.equipment?.ac?.source; } catch(_) { return null; } })();

  return (
    <Card disableHover bgVar="medium-hover">
      <CardContent>
        <div className={styles.statusGrid}>
          <div className={styles.statBox}>
            <div className={styles.label}>CA</div>
            <Tooltip placement="right" content={caSource || '—'}>
              <div className={styles.statValue}>{ca}</div>
            </Tooltip>
          </div>
          <div className={styles.statBox}><div className={styles.label}>INICIATIVA</div><div className={styles.statValue}>{iniciativa}</div></div>
          <div className={styles.statBox}><div className={styles.label}>DESLOCAMENTO</div><div className={styles.statValue}>{desloc}</div></div>
        </div>

        <div className={styles.hpWrap}>
          <div className={styles.hpMain}>
            <div className={styles.label}>Pontos de Vida Máximos</div>
            <div className={styles.hpNumbers}>{vida.atual} / {vida.max}</div>
          </div>
          <div className={styles.hpTemp}>
            <div className={styles.label}>Pontos de Vida Temporários</div>
            <div className={styles.hpNumbers}>{Number(tempHp) || 0}</div>
          </div>
        </div>

        <div className={styles.footerGrid}>
          <div className={styles.hitDieBox}>
            <div className={styles.label}>Dado de Vida</div>
            <div className={styles.small}>Usado / Total</div>
            <div className={styles.dieBadge}>{die}</div>
          </div>
          <div className={styles.deathBox}>
            <div className={styles.label}>Resistência à Morte</div>
            <div className={styles.deathGrid}>
              <div className={styles.deathCol}>
                <div className={styles.small}>Sucessos</div>
                <div className={styles.dots}><span className={styles.dotCircle}></span><span className={styles.dotCircle}></span><span className={styles.dotCircle}></span></div>
              </div>
              <div className={styles.deathCol}>
                <div className={styles.small}>Falhas</div>
                <div className={styles.dots}><span className={styles.dotCircle}></span><span className={styles.dotCircle}></span><span className={styles.dotCircle}></span></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
