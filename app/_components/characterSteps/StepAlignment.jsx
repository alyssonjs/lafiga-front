"use client";

import React from "react";
import styles from "../../_styles/character/CharacterForm.module.css";

const StepAlignment = ({ 
  alignmentKey, 
  setAlignmentKey, 
  alignmentDetails, 
  alignmentMap = {}, 
  alignments = [] 
}) => {
  return (
    <>
      <label className={styles.label}>Alinhamento:</label>
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Selecione um alinhamento</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            ['lawful-good','neutral-good','chaotic-good'],
            ['lawful-neutral','neutral','chaotic-neutral'],
            ['lawful-evil','neutral-evil','chaotic-evil'],
          ].flat().map((idx) => {
            const a = alignmentMap[idx] || alignments.find(x=>x.index===idx);
            const active = alignmentKey === idx;
            return (
              <button 
                key={idx} 
                type="button" 
                onClick={()=>setAlignmentKey(idx)} 
                className={`${styles.stepTab} ${active ? styles.active : ''}`}
              >
                {a?.name || idx}
              </button>
            );
          })}
        </div>
        {!!alignmentDetails?.desc && (
          <div className={styles.small} style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
            {alignmentDetails.desc}
          </div>
        )}
      </div>
    </>
  );
};

export default StepAlignment;
