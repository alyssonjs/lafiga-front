"use client";

import React from "react";

// Renders spell slots grid from a 9-length numeric array (levels 1..9)
export default function SpellSlotsPanel({ slotCounts = [], styles = {} }) {
  const counts = Array.from({ length: 9 }, (_, i) => Number(slotCounts[i]) || 0);
  return (
    <div className={styles.slotsGrid}>
      {counts.map((n, i) => (
        <div key={`sl-${i}`} className={styles.slotCol}>
          <div className={styles.slotHeader}>{i + 1}º</div>
          <div className={styles.slotDots}>
            {Array.from({ length: n }).map((_, j) => (
              <span key={`sd-${i}-${j}`} className={styles.slotDot}></span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
