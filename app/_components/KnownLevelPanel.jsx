"use client";

import React from "react";

function splitColumns(list = []) {
  const left = [];
  const right = [];
  list.forEach((item, idx) => (idx % 2 === 0 ? left : right).push(item));
  return [left, right];
}

export default function KnownLevelPanel({ level = 0, spells = [], onSpellClick = () => {}, styles = {} }) {
  const title = level === 0 ? "Truques (Nv 0)" : `Nível ${level}`;
  const visible = spells.slice(0, 3);
  const rest = spells.slice(3);
  const [vLeft, vRight] = splitColumns(visible);
  const [rLeft, rRight] = splitColumns(rest);

  return (
    <div className={styles.knownPanel}>
      <div className={styles.knownHeader}>{title}</div>
      {/* Top: first 3 visible (two columns) */}
      <div className={styles.spellListGrid}>
        <div className={styles.spellListCol}>
          {vLeft.map((nm, idx) => (
            <div key={`vL-${idx}`} className={styles.spellRow}>
              <span className={styles.box}></span>
              <button type="button" className={styles.linkLike} onClick={() => onSpellClick(nm)}>{nm}</button>
            </div>
          ))}
        </div>
        <div className={styles.spellListCol}>
          {vRight.map((nm, idx) => (
            <div key={`vR-${idx}`} className={styles.spellRow}>
              <span className={styles.box}></span>
              <button type="button" className={styles.linkLike} onClick={() => onSpellClick(nm)}>{nm}</button>
            </div>
          ))}
        </div>
      </div>
      {/* Rest in scrollable area */}
      {rest.length > 0 && (
        <div className={styles.knownScroll}>
          <div className={styles.spellListGrid}>
            <div className={styles.spellListCol}>
              {rLeft.map((nm, idx) => (
                <div key={`rL-${idx}`} className={styles.spellRow}>
                  <span className={styles.box}></span>
                  <button type="button" className={styles.linkLike} onClick={() => onSpellClick(nm)}>{nm}</button>
                </div>
              ))}
            </div>
            <div className={styles.spellListCol}>
              {rRight.map((nm, idx) => (
                <div key={`rR-${idx}`} className={styles.spellRow}>
                  <span className={styles.box}></span>
                  <button type="button" className={styles.linkLike} onClick={() => onSpellClick(nm)}>{nm}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
