"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";

export default function CharacterHeader({ ident, classe, nivel, subclassName, subclassLabel = 'Subclasse' }) {
  return (
    <Card disableHover bgVar="medium-hover">
      <CardContent>
        <div className={styles.sheetTop}>
          <div className={styles.ribbon}>
            <div className={styles.ribbonLabel}>Nome do Personagem</div>
            <div className={styles.ribbonValue}>{ident.nome}</div>
          </div>
          <div className={styles.infoBoard}>
            <div className={styles.infoCell}>
              <div className={styles.infoLabel}>Raça</div>
              <div className={styles.infoValue}>{ident.raca}</div>
            </div>
            <div className={styles.infoCell}>
              <div className={styles.infoLabel}>Antecedente</div>
              <div className={styles.infoValue}>{ident.antecedente}</div>
            </div>
            <div className={styles.infoCell}>
              <div className={styles.infoLabel}>Tendência</div>
              <div className={styles.infoValue}>{ident.tendencia}</div>
            </div>
            <div className={styles.infoCell}>
              <div className={styles.infoLabel}>Pontos de Experiência</div>
              <div className={styles.infoValue}>{ident.xp}</div>
            </div>
          </div>
          <div className={styles.classWrap}>
            <div className={styles.classBanner}>
              <div className={styles.className}>{classe.name}</div>
              <div className={styles.classMeta}>Nível {nivel} • PHB</div>
            </div>
            <div className={styles.crest}></div>
          </div>
          <div className={styles.collegeBanner}>
            <span className={styles.collegeLabel}>{subclassLabel}</span>
            <span className={styles.collegeValue}>{subclassName || '—'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
