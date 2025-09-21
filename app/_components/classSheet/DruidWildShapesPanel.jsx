"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent, CardHeader } from "../UI/Card";

function collectWildShapes(meta = {}) {
  const list = [];
  // Accept multiple possible keys users might save
  const top = meta?.class_choices?.wild_shapes || meta?.class_choices?.formas || meta?.class_choices?.beasts || [];
  (Array.isArray(top) ? top : []).forEach(x => list.push(x?.name || x));
  const per = meta?.class_choices?.per_level || {};
  Object.values(per).forEach((row) => {
    const arr = row?.wild_shapes || row?.formas || row?.beasts;
    if (Array.isArray(arr)) arr.forEach(x => list.push(x?.name || x));
  });
  return Array.from(new Set(list.filter(Boolean)));
}

function deriveWildShape(summary = {}) {
  try {
    const klasses = Array.isArray(summary.klasses) ? summary.klasses : [];
    const druid = klasses.find(k => String(k.name || '').toLowerCase().includes('druida') || String(k.name || '').toLowerCase().includes('druid'));
    const lvl = Number(druid?.level || 0);
    // PHB defaults
    const uses = (lvl >= 20) ? '∞ (Arquidruida)' : 2;
    let cr = 0;
    if (lvl >= 8) cr = 1; else if (lvl >= 4) cr = 0.5; else if (lvl >= 2) cr = 0.25; else cr = 0;
    const sub = String(druid?.subclass?.name || '').toLowerCase();
    const isMoon = sub.includes('lua') || sub.includes('moon');
    if (isMoon) {
      if (lvl >= 6) cr = Math.floor(lvl / 3);
      else if (lvl >= 2) cr = 1;
    }
    return {
      level: lvl,
      uses,
      crLimit: cr,
      swim: lvl >= 4,
      fly: lvl >= 8,
      elemental: isMoon && lvl >= 10,
      isMoon,
    };
  } catch (_) {
    return { level: 0, uses: 0, crLimit: 0, swim: false, fly: false, elemental: false, isMoon: false };
  }
}

export default function DruidWildShapesPanel({ meta = {}, summary = {} }) {
  const items = collectWildShapes(meta);
  const ws = deriveWildShape(summary);
  const [left, right] = (() => {
    const mid = Math.ceil(items.length / 2);
    return [items.slice(0, mid), items.slice(mid)];
  })();
  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardHeader>Formas Selvagens</CardHeader>
      <CardContent>
        <div className={styles.bigBox} style={{ marginBottom: 10 }}>
          <div className={styles.sectionCap}>LIMITES ATUAIS</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap: 8, marginTop: 6 }}>
            <div><b>Nível Druida:</b> {ws.level || '—'}</div>
            <div><b>Usos:</b> {String(ws.uses)}</div>
            <div><b>ND Máx:</b> {ws.crLimit === 0 ? '—' : (ws.crLimit === 0.25 ? '1/4' : ws.crLimit === 0.5 ? '1/2' : '1')}</div>
            <div><b>Nadar/Voo:</b> {ws.swim ? 'sim' : 'não'} / {ws.fly ? 'sim' : 'não'}</div>
          </div>
          <div className={styles.small} style={{ marginTop: 6, color: 'var(--secundary-text)' }}>
            Restrições padrão: sem natação antes do 4º nível; sem voo antes do 8º nível.
            {ws.elemental && (
              <>
                <br />Círculo da Lua (nível 10): pode gastar 2 usos para assumir forma de Elemental (Ar, Terra, Fogo ou Água).
              </>
            )}
            {ws.isMoon && ws.level >= 2 && (
              <>
                <br />Círculo da Lua: usar Forma Selvagem como Ação Bônus; em forma de besta, gastar espaço de magia como Ação Bônus para curar 1d8 por nível do espaço.
              </>
            )}
          </div>
        </div>

        <div className={styles.sectionCap}>FORMAS DE BESTAS CONHECIDAS</div>
        <div className={styles.bigBox} style={{ minHeight: 180 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{(left.length ? left.join("\n") : '—')}</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{(right.length ? right.join("\n") : '')}</div>
          </div>
          {(!items || items.length === 0) && (
            <div className={styles.small} style={{ marginTop: 8, color: 'var(--secundary-text)' }}>
              Nenhuma forma cadastrada na ficha. Você pode anotar suas formas favoritas no campo de anotações ou via escolhas de classe.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
