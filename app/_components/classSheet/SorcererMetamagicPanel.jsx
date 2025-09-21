"use client";

import { useMemo, useState } from "react";
import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";
import Popover from "../UI/Popover";
import { crudFor } from "../../_services/railsApi";

function collectMetamagic(meta = {}) {
  const list = [];
  const top = meta?.class_choices?.metamagic || meta?.class_choices?.metamágica || [];
  (Array.isArray(top) ? top : []).forEach(x => list.push(x?.name || x));
  const per = meta?.class_choices?.per_level || {};
  Object.values(per).forEach((row) => {
    const arr = row?.metamagic || row?.metamágica;
    if (Array.isArray(arr)) arr.forEach(x => list.push(x?.name || x));
  });
  return Array.from(new Set(list.filter(Boolean)));
}

export default function SorcererMetamagicPanel({ meta = {}, sheetId = null, nivel = 1 }) {
  const items = collectMetamagic(meta);
  const [anchor, setAnchor] = useState(null);
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);

  const totalPoints = Math.max(0, Number(nivel || 1) >= 2 ? Number(nivel || 1) : 0);
  const initialUsed = (() => {
    try {
      const used = meta?.resources?.sorcery_points?.used;
      return Number.isFinite(Number(used)) ? Number(used) : 0;
    } catch(_) { return 0; }
  })();
  const [used, setUsed] = useState(initialUsed);

  const descMap = useMemo(() => ({
    'Acelerar Magia': 'Conjura a magia como Ação Bônus em vez de Ação. Custo: 2 PF.',
    'Alcançar Magia': 'Dobra o alcance da magia; magias de Toque passam a 9 m. Custo: 1 PF.',
    'Expandir Magia': 'Dobra o alvo único: afeta um segundo alvo válido (sem ser “em si mesmo”, sem área). Custo: igual ao nível da magia (truque: 1 PF).',
    'Estender Magia': 'Dobra a duração da magia (máx. 24h). Custo: 1 PF.',
    'Suturar Magia': 'Protege aliados em magias de área: criaturas escolhidas automaticamente têm sucesso no teste (tomam metade do dano quando aplicável). Custo: 1 PF.',
    'Potencializar Magia': 'Ao rolar dano, você pode rerrolar um número de dados até seu modificador de CAR (mín. 1). Custo: 1 PF. Pode combinar com outra metamagia.',
    'Sutilizar Magia': 'Conjura sem componentes verbais e somáticos. Custo: 1 PF.',
    'Transmutar Magia': 'Altera o tipo de dano entre: ácido, frio, fogo, elétrico, trovejante, necrótico, psíquico, radiante. Custo: 1 PF.'
  }), []);

  const costMap = useMemo(() => ({
    'Acelerar Magia': 2,
    'Alcançar Magia': 1,
    'Expandir Magia': null, // variável: igual ao nível da magia (truque = 1)
    'Estender Magia': 1,
    'Suturar Magia': 1,
    'Potencializar Magia': 1,
    'Sutilizar Magia': 1,
    'Transmutar Magia': 1
  }), []);

  const open = (e, name) => { setAnchor(e.currentTarget); setCurrent(name); };
  const close = () => { setAnchor(null); setCurrent(null); };

  const sheetsApi = useMemo(() => crudFor('sheets','player'), []);
  const saveUsed = async (val) => {
    if (!sheetId) return;
    try {
      setSaving(true);
      const md = { ...(meta || {}) };
      md.resources = { ...(md.resources || {}) };
      const node = { ...(md.resources.sorcery_points || {}) };
      node.uses = totalPoints;
      node.used = Math.min(Math.max(0, Number(val || 0)), totalPoints);
      node.recharge = node.recharge || 'LR';
      md.resources.sorcery_points = node;
      await sheetsApi.update(sheetId, { metadata: md });
    } catch(_) { /* noop */ }
    finally { setSaving(false); }
  };

  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardContent>
        <div className={styles.sectionCap}>OPÇÕES METAMÁGICAS</div>
        <div className={styles.conjBox} style={{ margin: '8px 0 12px' }}>
          <div className={styles.conjLabel}>Pontos de Feitiçaria</div>
          <div className={styles.conjPills}>
            <div className={styles.pill}><span>Usado</span><strong>{used}</strong></div>
            <div className={styles.pill}><span>Total</span><strong>{totalPoints}</strong></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button className={styles.stepTab} disabled={used <= 0 || saving} onClick={async ()=>{ const v=Math.max(0, used-1); setUsed(v); await saveUsed(v); }}>−1</button>
            <button className={styles.stepTab} disabled={used >= totalPoints || saving} onClick={async ()=>{ const v=Math.min(totalPoints, used+1); setUsed(v); await saveUsed(v); }}>+1</button>
            <button className={styles.stepTab} disabled={used === 0 || saving} onClick={async ()=>{ setUsed(0); await saveUsed(0); }}>Reset</button>
          </div>
          <div className={styles.small} style={{ marginTop: 4, color: 'var(--muted)' }}>{saving ? 'Salvando…' : 'Recupera em Descanso Longo'}</div>
        </div>
        {items.length === 0 ? (
          <div className={styles.bigBox} style={{ minHeight: 120 }}>—</div>
        ) : (
          <div className={styles.bigBox} style={{ minHeight: 120 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {items.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={styles.stepTab}
                  onClick={(e) => open(e, name)}
                  title="Ver descrição"
                >
                  {name}
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
          width={340}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          marginThreshold={8}
        >
          <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight: 600, marginBottom: 6 }}>
            <span>{current || 'Metamágica'}</span>
            {(() => {
              if (!current) return null;
              const c = costMap[current];
              const available = Math.max(0, totalPoints - used);
              if (c == null) {
                // custo variável — não avaliar insuficiência aqui
                return <span className={styles.invocationTag} title="Custo variável (min 1)">PF variável</span>;
              }
              if (available < c) {
                return <span className={styles.secretsTag} title="Pontos de Feitiçaria insuficientes">sem PF</span>;
              }
              return null;
            })()}
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
            {current ? (descMap[current] || 'Sem descrição disponível.') : '—'}
          </div>
        </Popover>
      </CardContent>
    </Card>
  );
}
