"use client";

import React from "react";
import Button from "../UI/Button";
import styles from "../../_styles/character/CharacterForm.module.css";

const StepTabs = ({ 
  steps, 
  currentStep, 
  onStepChange, 
  onCancel, 
  onBack, 
  onNext, 
  canGoBack = true,
  canGoNext = true,
  nextLabel = "Próximo",
  backLabel = "Voltar",
  cancelLabel = "Cancelar",
  showCancel = true,
  showBack = true,
  showNext = true,
  nextDisabled = false,
  nextTitle = ""
}) => {
  return (
    <div className={styles.stepTabs}>
      <div className={styles.stepTabsHeader}>
        <div className={styles.stepTabsNavigation}>
          {showCancel && (
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
          )}
          {showBack && canGoBack && (
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onBack}
            >
              {backLabel}
            </Button>
          )}
          {showNext && (
            <Button
              type="button"
              variant="highlight"
              onClick={onNext}
              disabled={!canGoNext || nextDisabled}
              title={nextTitle}
            >
              {nextLabel}
            </Button>
          )}
        </div>
      </div>
      
      <div className={styles.stepTabsProgress}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`${styles.stepTab} ${
              index + 1 === currentStep ? styles.stepTabActive : ''
            } ${
              index + 1 < currentStep ? styles.stepTabCompleted : ''
            } ${
              index + 1 > currentStep ? styles.stepTabDisabled : ''
            }`}
            onClick={() => {
              // Only allow clicking on current step or completed steps
              if (index + 1 <= currentStep && onStepChange) {
                onStepChange(step.id);
              }
            }}
            style={{
              cursor: index + 1 <= currentStep ? 'pointer' : 'not-allowed',
              opacity: index + 1 > currentStep ? 0.5 : 1
            }}
          >
            <div className={styles.stepTabNumber}>
              {index + 1 < currentStep ? '✓' : step.id}
            </div>
            <div className={styles.stepTabName}>{step.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepTabs;
