"use client";

import React from "react";
import Tooltip from "./UI/Tooltip";

function splitColumns(list = []) {
  const left = [];
  const right = [];
  list.forEach((item, idx) => (idx % 2 === 0 ? left : right).push(item));
  return [left, right];
}

export default function KnownLevelPanel({ level = 0, spells = [], onSpellClick = () => {}, styles = {}, edit = false, selected = new Set(), onToggle = () => {}, isAlways = () => false, isSecret = () => false, isInvocation = () => false, isDomain = () => false, isCircle = () => false, isFeatKnown = () => false, getFeatSource = () => null }) {
  const title = level === 0 ? "Truques (Nv 0)" : `Nível ${level}`;
  const [left, right] = splitColumns(spells || []);
  const normName = (it) => (typeof it === 'object' ? (it.name || it.id) : it);

  return (
    <div className={styles.knownPanel}>
      <div className={styles.knownHeader}>{title}</div>
      <div className={styles.spellListGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className={styles.spellListCol}>
          {left.map((item, idx) => {
            const nm = normName(item);
            const locked = (typeof item === 'object' && !!item.always_prepared) || isAlways(nm);
            const checked = selected?.has(nm) || locked;
            const domain = isDomain(nm);
            return (
              <div key={`L-${idx}`} className={styles.spellRow}>
                {edit ? (
                  <input type="checkbox" checked={checked} disabled={locked} onChange={() => onToggle(nm)} style={{ marginRight: 6 }} />
                ) : (
                  <span className={styles.box}></span>
                )}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <button type="button" className={styles.linkLike} onClick={() => onSpellClick(nm)}>{nm}</button>
                  {isSecret(nm) && <span className={styles.secretsTag}>Secrets</span>}
                  {isInvocation(nm) && <span className={styles.invocationTag}>Invoc.</span>}
                  {domain && <span className={styles.secretsTag}>Domínio</span>}
                  {isCircle(nm) && <span className={styles.secretsTag}>Círculo</span>}
                  {isFeatKnown(nm) && (
                    <Tooltip content={(getFeatSource(nm) ? `Talento: ${getFeatSource(nm)}` : 'Concedido por talento')}>
                      <span className={styles.talentTag}>Talento</span>
                    </Tooltip>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles.spellListCol}>
          {right.map((item, idx) => {
            const nm = normName(item);
            const locked = (typeof item === 'object' && !!item.always_prepared) || isAlways(nm);
            const checked = selected?.has(nm) || locked;
            const domain = isDomain(nm);
            return (
              <div key={`R-${idx}`} className={styles.spellRow}>
                {edit ? (
                  <input type="checkbox" checked={checked} disabled={locked} onChange={() => onToggle(nm)} style={{ marginRight: 6 }} />
                ) : (
                  <span className={styles.box}></span>
                )}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <button type="button" className={styles.linkLike} onClick={() => onSpellClick(nm)}>{nm}</button>
                  {isSecret(nm) && <span className={styles.secretsTag}>Secrets</span>}
                  {isInvocation(nm) && <span className={styles.invocationTag}>Invoc.</span>}
                  {domain && <span className={styles.secretsTag}>Domínio</span>}
                  {isCircle(nm) && <span className={styles.secretsTag}>Círculo</span>}
                  {isFeatKnown(nm) && (
                    <Tooltip content={(getFeatSource(nm) ? `Talento: ${getFeatSource(nm)}` : 'Concedido por talento')}>
                      <span className={styles.talentTag}>Talento</span>
                    </Tooltip>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
