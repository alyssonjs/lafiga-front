"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent, CardHeader } from "../UI/Card";

function buildShadowSpellRows() {
  // PHB baseline and overrides.yml alignment
  const cost = 2;
  const notes = 'sem componentes materiais';
  return [
    { name: 'Escuridão', ki: cost, notes },
    { name: 'Visão no Escuro', ki: cost, notes },
    { name: 'Passos sem Pegadas', ki: cost, notes },
    { name: 'Silêncio', ki: cost, notes }
  ];
}

export default function MonkShadowArtsPanel({ summary = {} }) {
  const rows = buildShadowSpellRows();
  const grants = ['Ilusão Menor'];

  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardHeader>Artes Sombrias</CardHeader>
      <CardContent>
        <div className={styles.bigBox} style={{ marginBottom: 10 }}>
          <div className={styles.sectionCap}>MAGIAS VIA KI</div>
          <div className={styles.small} style={{ marginBottom: 6, color: 'var(--secundary-text)', whiteSpace: 'normal' }}>
            Cada magia abaixo pode ser imitada gastando 2 pontos de Ki ({rows[0].notes}). CD de resistência = CD de Ki.
          </div>
          <div className={styles.conjBox}>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 80px 1fr', gap: 8, fontWeight: 600, marginBottom: 6 }}>
              <div>Magia</div><div>Ki</div><div>Obs.</div>
            </div>
            {rows.map((r) => (
              <div key={r.name} style={{ display:'grid', gridTemplateColumns:'2fr 80px 1fr', gap: 8, marginBottom: 4 }}>
                <div>{r.name}</div>
                <div>{r.ki}</div>
                <div className={styles.small} style={{ color: 'var(--secundary-text)', whiteSpace: 'normal' }}>{r.notes}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sectionCap}>TÉCNICAS</div>
        <div className={styles.bigBox}>
          <div className={styles.conjBox} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Passo das Sombras (6º)</div>
            <div className={styles.small} style={{ color: 'var(--secundary-text)', whiteSpace: 'normal' }}>
              Bônus: teleporta até 18 m entre penumbra/escuridão; vantagem no primeiro ataque corpo a corpo até o fim do turno.
            </div>
          </div>
          <div className={styles.conjBox} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Manto de Sombras (11º)</div>
            <div className={styles.small} style={{ color: 'var(--secundary-text)', whiteSpace: 'normal' }}>
              Ação: fica invisível em penumbra/escuridão até atacar, conjurar, ou entrar em luz plena.
            </div>
          </div>
          <div className={styles.conjBox}>
            <div style={{ fontWeight: 600 }}>Oportunista (17º)</div>
            <div className={styles.small} style={{ color: 'var(--secundary-text)', whiteSpace: 'normal' }}>
              Reação: quando uma criatura adjacente sofre um ataque de outro, faz 1 ataque corpo a corpo contra ela.
            </div>
          </div>
        </div>

        <div className={styles.sectionCap}>CONCEDE</div>
        <div className={styles.bigBox}>
          <div className={styles.conjPills}>
            {grants.map((g) => (
              <div key={g} className={styles.pill}><span>Truque</span><strong>{g}</strong></div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
