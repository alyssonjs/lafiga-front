"use client";

import styles from "../../_styles/character/CharacterForm.module.css";

const StepperNav = ({ steps, stepIndex }) => (
  <div className={styles.stepperNav}>
    {steps.map((s, i) => (
      <div key={s.id} className={`${styles.step} ${i === stepIndex ? styles.activeStep : ""}`}>
        {i + 1}. {s.name}
      </div>
    ))}
  </div>
);

export default StepperNav;
