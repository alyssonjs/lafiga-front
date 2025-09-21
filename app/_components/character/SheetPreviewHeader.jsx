"use client";

import styles from "../../_styles/character/CharacterForm.module.css";

export default function SheetPreviewHeader({
  name,
  ac,
  hp,
  initiative,
  level,
  className,
  subclassName,
  speedFt = null,
  proficiencies = null,
  raceLabel = '',
  backgroundLabel = '',
}) {
  return (
    <div style={{ marginTop: 8 }}>
      <div className={styles.sheetTop}>
        <div className={styles.ribbon}>
          <div className={styles.ribbonLabel}>Nome</div>
          <div className={styles.ribbonValue}>{name || '—'}</div>
        </div>
        <div className={styles.infoBoard}>
          <div className={styles.infoCell}>
            <div className={styles.infoLabel}>CA</div>
            <div className={styles.infoValue}>{ac ?? '—'}</div>
          </div>
          <div className={styles.infoCell}>
            <div className={styles.infoLabel}>HP Máx</div>
            <div className={styles.infoValue}>{hp ?? '—'}</div>
          </div>
          <div className={styles.infoCell}>
            <div className={styles.infoLabel}>Iniciativa</div>
            <div className={styles.infoValue}>{initiative >= 0 ? `+${initiative}` : initiative}</div>
          </div>
          <div className={styles.infoCell}>
            <div className={styles.infoLabel}>Nível</div>
            <div className={styles.infoValue}>{Number(level)||1}</div>
          </div>
          <div className={styles.infoCell}>
            <div className={styles.infoLabel}>Velocidade</div>
            <div className={styles.infoValue}>
              {speedFt ? `${speedFt} ft (${Math.round(speedFt * 0.3048)} m)` : '—'}
            </div>
          </div>
        </div>
        <div className={styles.classWrap}>
          <div className={styles.classBanner}>
            <div className={styles.className}>{className || 'Classe'}</div>
            <div className={styles.classMeta}>{subclassName || ''}</div>
          </div>
          <div className={styles.classMeta} style={{ marginTop: 4 }}>
            {raceLabel || ''}{backgroundLabel ? ` • ${backgroundLabel}` : ''}
          </div>
        </div>
      </div>
      {!!proficiencies && (
        <div className={styles.panel} style={{ marginTop: 8 }}>
          <div className={styles.panelTitle}>Proficiências</div>
          <div className={styles.small}>
            <strong>Armaduras:</strong> {(proficiencies.armor || []).join(', ') || '—'}
          </div>
          <div className={styles.small}>
            <strong>Armas:</strong> {(proficiencies.weapons || []).join(', ') || '—'}
          </div>
          <div className={styles.small}>
            <strong>Ferramentas/Kits:</strong> {(proficiencies.tools || []).join(', ') || '—'}
          </div>
          <div className={styles.small}>
            <strong>Idiomas:</strong> {(proficiencies.languages || []).join(', ') || '—'}
          </div>
        </div>
      )}
    </div>
  );
}

