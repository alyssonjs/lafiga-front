"use client";

import React from "react";
import styles from "../../_styles/character/CharacterForm.module.css";
import AbilityIncreaseSelector from "./AbilityIncreaseSelector";
import FeatPicker from "./FeatPicker";

// Reusable ASI selector panel: attributes vs feat.
// Can be used in ClassChoices and for Variant Human (feat-only mode).
export default function ASISelector({
  title = 'Aprimoramento de Atributo (ASI)',
  asiGrant = 1,
  asiChoice = null,
  setAsiChoice = () => {},
  cantripOptions = [],
  spellOptions = [],
  klasses = [],
  currentFeatId = null,
  excludeIds = [],
  showModeToggle = true,
  defaultMode = 'attributes'
}) {
  console.log(typeof asiChoice === 'function')
  const asiChoiceObj = typeof asiChoice === 'function' ? asiChoice() : asiChoice;
  const effectiveMode = asiChoiceObj?.mode || defaultMode;

  const handleMode = (mode) => {
    if (mode === 'attributes') {
      setAsiChoice({
        mode: 'attributes',
        attributes: asiChoiceObj?.attributes || [],
        featId: asiChoiceObj?.featId || null,
        choices: asiChoiceObj?.choices || {}
      });
    } else {
      setAsiChoice({
        mode: 'feat',
        featId: asiChoiceObj?.featId || null,
        choices: asiChoiceObj?.choices || {},
        attributes: asiChoiceObj?.attributes || []
      });
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>{title} — {asiGrant} escolha(s) neste nível</div>

      {showModeToggle && (
        <div className={styles.radioGroup}>
          <div className={styles.radioOption}>
            <input
              type="radio"
              name="asiMode"
              className={styles.radioInput}
              checked={effectiveMode === 'attributes'}
              onChange={() => handleMode('attributes')}
            />
            <span className={styles.radioLabel}>Aumentar atributos (+2 em 1 ou +1/+1)</span>
          </div>
          <div className={styles.radioOption}>
            <input
              type="radio"
              name="asiMode"
              className={styles.radioInput}
              checked={effectiveMode === 'feat'}
              onChange={() => handleMode('feat')}
            />
            <span className={styles.radioLabel}>Escolher talento (feat)</span>
          </div>
        </div>
      )}

      {(effectiveMode === 'attributes') && (
        <AbilityIncreaseSelector
          value={asiChoiceObj?.attributes || []}
          onChange={(ids)=> setAsiChoice(prev => ({ ...(typeof prev === 'function' ? prev() : prev), mode:'attributes', attributes: ids }))}
        />
      )}

      {(effectiveMode === 'feat') && (
        <FeatPicker
          value={currentFeatId}
          onChange={(featId)=> setAsiChoice({ ...(asiChoiceObj || {}), mode:'feat', featId, choices: asiChoiceObj?.choices || {} })}
          choices={asiChoiceObj?.choices || {}}
          onChangeChoices={(choices)=> setAsiChoice({ ...(asiChoiceObj || {}), choices })}
          cantripOptions={cantripOptions || []}
          spellOptions={spellOptions || []}
          klasses={klasses || []}
          excludeIds={excludeIds || []}
        />
      )}
    </div>
  );
}
