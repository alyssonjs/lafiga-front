"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent, CardHeader } from "../UI/Card";

function computeKiDC(atributos = [], nivel = 1) {
  try {
    const wis = Number(atributos.find(a=>a.a==='SAB')?.s) || 10;
    const modWis = Math.floor((wis - 10) / 2);
    const prof = 2 + Math.floor(((Number(nivel)||1) - 1) / 4);
    return 8 + modWis + prof;
  } catch(_) { return null; }
}

export default function MonkOpenHandPanel({ atributos = [], nivel = 1 }) {
  const kiDc = computeKiDC(atributos, nivel);

  return (
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
      <CardHeader>Caminho da Mão Aberta</CardHeader>
      <CardContent>
        <div className={styles.sectionCap}>TÉCNICA DA MÃO ABERTA (3º)</div>
        <div className={styles.bigBox}>
          <div className={styles.small} style={{ marginBottom: 6, color: 'var(--secundary-text)', whiteSpace: 'normal' }}>
            Ao acertar com Rajada de Golpes, escolha um efeito:
          </div>
          <div className={styles.conjBox} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Derrubar</div>
            <div className={styles.small} style={{ color: 'var(--secundary-text)', whiteSpace: 'normal' }}>Teste de Destreza CD {kiDc} (CD de Ki). Falha: alvo fica caído.</div>
          </div>
          <div className={styles.conjBox} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Empurrar</div>
            <div className={styles.small} style={{ color: 'var(--secundary-text)', whiteSpace: 'normal' }}>Teste de Força CD {kiDc}. Falha: empurrado 4,5 m para longe.</div>
          </div>
          <div className={styles.conjBox}>
            <div style={{ fontWeight: 600 }}>Sem Reações</div>
            <div className={styles.small} style={{ color: 'var(--secundary-text)', whiteSpace: 'normal' }}>O alvo não pode realizar reações até o fim do seu próximo turno.</div>
          </div>
        </div>

        <div className={styles.sectionCap}>RECURSOS (6º / 11º / 17º)</div>
        <div className={styles.bigBox}>
          <div className={styles.conjBox} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Integridade Corporal (6º)</div>
            <div className={styles.small} style={{ color: 'var(--secundary-text)', whiteSpace: 'normal' }}>Ação: cura PV = 3 × nível de monge. 1/descanso longo.</div>
          </div>
          <div className={styles.conjBox} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Tranquilidade (11º)</div>
            <div className={styles.small} style={{ color: 'var(--secundary-text)', whiteSpace: 'normal' }}>Após descanso longo: efeito de Santuário até o próximo descanso longo (CD {kiDc}).</div>
          </div>
          <div className={styles.conjBox}>
            <div style={{ fontWeight: 600 }}>Palma Vibrante (17º)</div>
            <div className={styles.small} style={{ color: 'var(--secundary-text)', whiteSpace: 'normal' }}>
              Ao acertar, gasta 3 Ki e aplica vibrações (1 alvo por vez, dura dias = seu nível). Ação para finalizar: CON CD {kiDc};
              falha: PV do alvo vão a 0; sucesso: 10d10 necrótico.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
