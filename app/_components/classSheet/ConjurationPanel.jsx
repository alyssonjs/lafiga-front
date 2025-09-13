"use client";

import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";

export default function ConjurationPanel({
  nivel = 1,
  atributos = [],
  cantripsCount = 0,
  spellsCount = 0,
  meta = {},
  pb = null,
  atkBonus = null,
  dc = null,
  inspirationDie = null,
  inspirationTotal = null,
  songRestDie = null,
  preparedCount = null,
}) {
  // Compute casting ability modifier according to class' casting_ability
  const modFor = (abbr) => {
    const map = { STR:'FOR', DEX:'DES', CON:'CON', INT:'INT', WIS:'SAB', CHA:'CAR' };
    const tag = map[String(abbr||'').toUpperCase()] || 'CAR';
    const score = Number(atributos.find(a=>a.a===tag)?.s) || 10;
    return Math.floor((score - 10) / 2);
  };
  const castingAbility = (meta?.class_summary?.spellcasting?.casting_ability)
    || (() => {
      const n = String(meta?.class_summary?.name || '').toLowerCase();
      if (n.includes('clérigo') || n.includes('cleric')) return 'WIS';
      if (n.includes('druida') || n.includes('druid')) return 'WIS';
      if (n.includes('mago') || n.includes('wizard')) return 'INT';
      if (n.includes('patrulheiro') || n.includes('ranger')) return 'WIS';
      if (n.includes('paladino') || n.includes('paladin')) return 'CHA';
      if (n.includes('feiticeiro') || n.includes('sorcerer')) return 'CHA';
      if (n.includes('bruxo') || n.includes('warlock')) return 'CHA';
      if (n.includes('bardo') || n.includes('bard')) return 'CHA';
      return 'CHA';
    })();
  const modCast = modFor(castingAbility);
  const prof = (pb != null) ? pb : (2 + Math.floor(((Number(nivel)||1) - 1) / 4));
  const localAtk = (atkBonus != null) ? atkBonus : (modCast + prof);
  const localDc = (dc != null) ? dc : (8 + modCast + prof);
  const bardDie = (nivel >= 15 ? 'd12' : (nivel >= 10 ? 'd10' : (nivel >= 5 ? 'd8' : 'd6')));
  const songRest = songRestDie || (nivel >= 17 ? 'd12' : (nivel >= 13 ? 'd10' : (nivel >= 9 ? 'd8' : (nivel >= 2 ? 'd6' : '—'))));
  const chaMod = modFor('CHA');
  const inspTotal = (inspirationTotal != null) ? inspirationTotal : Math.max(1, chaMod);
  const inspDie = inspirationDie || bardDie;
  const className = String(meta?.class_summary?.name || '').toLowerCase();
  const isCleric = className.includes('clérigo') || className.includes('cleric') || className.includes('clerigo');
  const isWarlock = className.includes('bruxo') || className.includes('warlock');
  const isDruid  = className.includes('druida') || className.includes('druid');
  const isSorcerer = className.includes('feiticeiro') || className.includes('sorcerer');
  const isWizard = className.includes('mago') || className.includes('wizard');
  const isMonk   = className.includes('monge') || className.includes('monk');
  const isPaladin = className.includes('paladino') || className.includes('paladin');

  const focus = (() => {
    if ((meta?.class_summary?.name || '').toLowerCase() === 'bardo') return 'Instrumento musical';
    const f = meta?.class_summary?.spellcasting?.focus || meta?.class_summary?.focus;
    return f ? String(f).replace(/_/g,' ') : '—';
  })();
  const preparedCaster = String(meta?.class_summary?.spellcasting?.preparation || '').toLowerCase() === 'prepared';
  // Compute prepared allowed (reacts to attributes and level)
  const preparedAllowed = (() => {
    if (!preparedCaster) return 0;
    const className = String(meta?.class_summary?.name || '').toLowerCase();
    const paladin = className.includes('paladino') || className.includes('paladin');
    if (paladin) {
      const chaMod = modFor('CHA');
      return Math.max(1, Math.floor((Number(nivel)||1) / 2) + chaMod);
    }
    return Math.max(1, (Number(nivel)||1) + modCast);
  })();

  // Hide entire panel when there's no spellcasting focus (except Monk, which uses Chi) and not a prepared caster
  if ((!focus || String(focus).trim() === '' || focus === '—') && !isMonk && !preparedCaster) return null;

  // Cleric-specific layout: include Channel Divinity (uses scale with level)
  if (isCleric) {
    const channelTotal = (nivel >= 18 ? 3 : (nivel >= 6 ? 2 : (nivel >= 2 ? 1 : 0)));
    return (
      <Card disableHover bgVar="medium-hover" style={{ marginTop: 12 }}>
        <CardContent>
          <div className={styles.conjPanel}>
            <div className={styles.conjTop}>
              <div className={styles.conjCircles}>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>Bônus de Ataque de Magia</div>
                  <div className={styles.conjCircle}>{localAtk >= 0 ? `+${localAtk}` : localAtk}</div>
                </div>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>CD de Resistência de Magia</div>
                  <div className={styles.conjCircle}>{localDc}</div>
                </div>
              </div>
              <div>
                <div className={styles.conjLabel}>Canalizar Divindade</div>
                <div className={styles.conjBox}>
                  <div className={styles.conjPills}>
                    <div className={styles.pill}><span>Usado</span><strong>0</strong></div>
                    <div className={styles.pill}><span>Total</span><strong>{channelTotal || '—'}</strong></div>
                  </div>
                </div>
              </div>
              {preparedCaster && (
                <div>
                  <div className={styles.conjLabel}>Magias Preparadas</div>
                  <div className={styles.conjBox}>
                    <div className={styles.conjPills}>
                      <div className={styles.pill}><span>Atual</span><strong>{preparedCount ?? '—'}</strong></div>
                      <div className={styles.pill}><span>Limite</span><strong>{preparedAllowed}</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <div><div className={styles.label}>Foco</div><div className={styles.frameBox}>{focus}</div></div>
            </div>
            <div className={styles.small} style={{ marginTop: 6 }}>
              Restrições: sem formas com natação antes do 4º nível e sem voo antes do 8º nível.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isWarlock) {
    const pactInfo = (lvl) => {
      if (lvl >= 17) return { total: 4, slotLevel: 5 };
      if (lvl >= 11) return { total: 3, slotLevel: 5 };
      if (lvl >= 9)  return { total: 2, slotLevel: 5 };
      if (lvl >= 7)  return { total: 2, slotLevel: 4 };
      if (lvl >= 5)  return { total: 2, slotLevel: 3 };
      if (lvl >= 3)  return { total: 2, slotLevel: 2 };
      if (lvl >= 2)  return { total: 2, slotLevel: 1 };
      return { total: 1, slotLevel: 1 };
    };
    const pact = pactInfo(Number(nivel)||1);
    return (
      <Card style={{ marginTop: 12 }}>
        <CardContent>
          <div className={styles.conjPanel}>
            <div className={styles.conjTop}>
              <div className={styles.conjCircles}>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>Bônus de Ataque de Magia</div>
                  <div className={styles.conjCircle}>{localAtk >= 0 ? `+${localAtk}` : localAtk}</div>
                </div>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>CD de Resistência de Magia</div>
                  <div className={styles.conjCircle}>{localDc}</div>
                </div>
              </div>
              <div>
                <div className={styles.conjLabel}>Espaços de Magia</div>
                <div className={styles.conjBox}>
                  <div className={styles.conjPills}>
                    <div className={styles.pill}><span>Usado</span><strong>0</strong></div>
                    <div className={styles.pill}><span>Total</span><strong>{pact.total}</strong></div>
                  </div>
                  <div className={styles.conjSmall}>{`Nível ${pact.slotLevel}`}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <div><div className={styles.label}>Foco</div><div className={styles.frameBox}>{focus}</div></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isDruid) {
    // Wild Shape: uses and max CR by level (PHB 2014)
    const usesTotal = (Number(nivel)||1) >= 2 ? 2 : 0;
    const maxCR = (() => {
      const n = Number(nivel)||1;
      if (n >= 8) return '1';
      if (n >= 4) return '1/2';
      if (n >= 2) return '1/4';
      return '—';
    })();
    return (
      <Card style={{ marginTop: 12 }}>
        <CardContent>
          <div className={styles.conjPanel}>
            <div className={styles.conjTop}>
              <div className={styles.conjCircles}>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>Bônus de Ataque de Magia</div>
                  <div className={styles.conjCircle}>{localAtk >= 0 ? `+${localAtk}` : localAtk}</div>
                </div>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>CD de Resistência de Magia</div>
                  <div className={styles.conjCircle}>{localDc}</div>
                </div>
              </div>
              <div>
                <div className={styles.conjLabel}>Forma Selvagem</div>
                <div className={styles.conjBox}>
                  <div className={styles.conjPills}>
                    <div className={styles.pill}><span>Usado</span><strong>0</strong></div>
                    <div className={styles.pill}><span>Total</span><strong>{usesTotal || '—'}</strong></div>
                  </div>
                  <div className={styles.conjSmall}>{`Max ND ${maxCR}`}</div>
                </div>
              </div>
              {preparedCaster && (
                <div>
                  <div className={styles.conjLabel}>Magias Preparadas</div>
                  <div className={styles.conjBox}>
                    <div className={styles.conjPills}>
                      <div className={styles.pill}><span>Atual</span><strong>{preparedCount ?? '—'}</strong></div>
                      <div className={styles.pill}><span>Limite</span><strong>{preparedAllowed}</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <div><div className={styles.label}>Foco</div><div className={styles.frameBox}>{focus}</div></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSorcerer) {
    const spTotal = (Number(nivel)||1) >= 2 ? (Number(nivel)||1) : 0; // PHB: sorcery points start at 2º, equal to level
    return (
      <Card style={{ marginTop: 12 }}>
        <CardContent>
          <div className={styles.conjPanel}>
            <div className={styles.conjTop}>
              <div className={styles.conjCircles}>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>Bônus de Ataque de Magia</div>
                  <div className={styles.conjCircle}>{localAtk >= 0 ? `+${localAtk}` : localAtk}</div>
                </div>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>CD de Resistência de Magia</div>
                  <div className={styles.conjCircle}>{localDc}</div>
                </div>
              </div>
              <div>
                <div className={styles.conjLabel}>Pontos de Feitiçaria</div>
                <div className={styles.conjBox}>
                  <div className={styles.conjPills}>
                    <div className={styles.pill}><span>Usado</span><strong>0</strong></div>
                    <div className={styles.pill}><span>Total</span><strong>{spTotal || '—'}</strong></div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <div><div className={styles.label}>Foco</div><div className={styles.frameBox}>{focus}</div></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isWizard) {
    return (
      <Card style={{ marginTop: 12 }}>
        <CardContent>
          <div className={styles.conjPanel}>
            <div className={styles.conjTop}>
              <div className={styles.conjCircles}>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>Bônus de Ataque de Magia</div>
                  <div className={styles.conjCircle}>{localAtk >= 0 ? `+${localAtk}` : localAtk}</div>
                </div>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>CD de Resistência de Magia</div>
                  <div className={styles.conjCircle}>{localDc}</div>
                </div>
              </div>
            </div>
            {preparedCaster && (
              <div style={{ marginTop: 8 }}>
                <div className={styles.conjLabel}>Magias Preparadas</div>
                <div className={styles.conjBox}>
                  <div className={styles.conjPills}>
                    <div className={styles.pill}><span>Atual</span><strong>{preparedCount ?? '—'}</strong></div>
                    <div className={styles.pill}><span>Limite</span><strong>{preparedAllowed}</strong></div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
              <div><div className={styles.label}>Foco</div><div className={styles.frameBox}>{focus}</div></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMonk) {
    const wisScore = Number(atributos.find(a=>a.a==='SAB')?.s) || 10;
    const modWis = Math.floor((wisScore - 10) / 2);
    const profMonk = (pb != null) ? pb : (2 + Math.floor(((Number(nivel)||1) - 1) / 4));
    const atkMonk = modWis + profMonk;
    const dcMonk = 8 + modWis + profMonk; // Ki save DC
    const kiTotal = (Number(nivel)||1) >= 2 ? (Number(nivel)||1) : 0; // Ki a partir do 2º nível
    const amDie = (nivel >= 17 ? 'd10' : (nivel >= 11 ? 'd8' : (nivel >= 5 ? 'd6' : 'd4')));
    return (
      <Card style={{ marginTop: 12 }}>
        <CardContent>
          <div className={styles.conjPanel}>
            <div className={styles.conjTop}>
              <div className={styles.conjCircles}>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>Bônus de Ataque</div>
                  <div className={styles.conjCircle}>{atkMonk >= 0 ? `+${atkMonk}` : atkMonk}</div>
                </div>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>CD de Resistência de Chi</div>
                  <div className={styles.conjCircle}>{dcMonk}</div>
                </div>
              </div>
              <div>
                <div className={styles.conjLabel}>Pontos de Chi</div>
                <div className={styles.conjBox}>
                  <div className={styles.conjPills}>
                    <div className={styles.pill}><span>Usado</span><strong>0</strong></div>
                    <div className={styles.pill}><span>Total</span><strong>{kiTotal}</strong></div>
                  </div>
                  <div className={styles.conjSmall}>{`Dado A.M. ${amDie}`}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isWizard) {
    return (
      <Card style={{ marginTop: 12 }}>
        <CardContent>
          <div className={styles.conjPanel}>
            <div className={styles.conjTop}>
              <div className={styles.conjCircles}>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>Bônus de Ataque de Magia</div>
                  <div className={styles.conjCircle}>{localAtk >= 0 ? `+${localAtk}` : localAtk}</div>
                </div>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>CD de Resistência de Magia</div>
                  <div className={styles.conjCircle}>{localDc}</div>
                </div>
              </div>
            </div>
            <div className={styles.conjBoxRow}>
              <div className={styles.conjBox}>
                <div className={styles.conjLabel}>Truques conhecidos</div>
                <div className={styles.conjOctagon}>{cantripsCount}</div>
              </div>
              <div className={styles.conjBox}>
                <div className={styles.conjLabel}>Magias conhecidas</div>
                <div className={styles.conjOctagon}>{spellsCount}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <div><div className={styles.label}>Foco</div><div className={styles.frameBox}>{focus}</div></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isPaladin) {
    const carScore = Number(atributos.find(a=>a.a==='CAR')?.s) || 10;
    const carMod = Math.floor((carScore - 10) / 2);
    const divineSenseTotal = Math.max(0, 1 + carMod);
    const layOnHandsPool = Math.max(0, (Number(nivel)||1) * 5);
    return (
      <Card style={{ marginTop: 12 }}>
        <CardContent>
          <div className={styles.conjPanel}>
            <div className={styles.conjTop}>
              <div className={styles.conjCircles}>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>Bônus de Ataque de Magia</div>
                  <div className={styles.conjCircle}>{localAtk >= 0 ? `+${localAtk}` : localAtk}</div>
                </div>
                <div className={styles.conjItem}>
                  <div className={styles.conjLabel}>CD de Resistência de Magia</div>
                  <div className={styles.conjCircle}>{localDc}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
              <div className={styles.conjBox}>
                <div className={styles.conjLabel}>Sentido Divino</div>
                <div className={styles.conjPills}>
                  <div className={styles.pill}><span>Usado</span><strong>0</strong></div>
                  <div className={styles.pill}><span>Total</span><strong>{divineSenseTotal}</strong></div>
                </div>
                <div className={styles.conjSmall}>Recupera após descanso longo</div>
              </div>
              <div className={styles.conjBox}>
                <div className={styles.conjLabel}>Cura pelas Mãos</div>
                <div className={styles.conjPills}>
                  <div className={styles.pill}><span>Usado</span><strong>0</strong></div>
                  <div className={styles.pill}><span>Total</span><strong>{layOnHandsPool}</strong></div>
                </div>
                <div className={styles.conjSmall}>Recupera após descanso longo</div>
              </div>
            </div>
            {preparedCaster && (
              <div style={{ marginTop: 8 }}>
                <div className={styles.conjLabel}>Magias Preparadas</div>
                <div className={styles.conjBox}>
                  <div className={styles.conjPills}>
                    <div className={styles.pill}><span>Atual</span><strong>{preparedCount ?? '—'}</strong></div>
                    <div className={styles.pill}><span>Limite</span><strong>{preparedAllowed}</strong></div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
              <div><div className={styles.label}>Foco</div><div className={styles.frameBox}>{focus}</div></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ marginTop: 12 }}>
      <CardContent>
        <div className={styles.conjPanel}>
          <div className={styles.conjTop}>
            <div className={styles.conjCircles}>
              <div className={styles.conjItem}>
                <div className={styles.conjLabel}>Bônus de Ataque de Magia</div>
                <div className={styles.conjCircle}>{localAtk >= 0 ? `+${localAtk}` : localAtk}</div>
              </div>
              <div className={styles.conjItem}>
                <div className={styles.conjLabel}>CD de Resistência de Magia</div>
                <div className={styles.conjCircle}>{localDc}</div>
              </div>
            </div>
            <div>
              <div className={styles.conjLabel}>Inspiração de Bardo</div>
              <div className={styles.conjBox}>
                <div className={styles.conjPills}>
                  <div className={styles.pill}><span>Usado</span><strong>0</strong></div>
                  <div className={styles.pill}><span>Total</span><strong>{inspTotal}</strong></div>
                </div>
                <div className={styles.conjSmall}>{inspDie}</div>
              </div>
            </div>
          </div>
          <div className={styles.conjBoxRow}>
            <div className={styles.conjBox}>
              <div className={styles.conjLabel}>Truques conhecidos</div>
              <div className={styles.conjOctagon}>{cantripsCount}</div>
            </div>
            <div className={styles.conjBox}>
              <div className={styles.conjLabel}>Magias conhecidas</div>
              <div className={styles.conjOctagon}>{spellsCount}</div>
            </div>
            <div className={styles.conjBox}>
              <div className={styles.conjLabel}>Canção de Descanso</div>
              <div className={styles.conjSmall}>{songRest}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <div><div className={styles.label}>Foco</div><div className={styles.frameBox}>{focus}</div></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
