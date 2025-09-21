"use client";

import { useMemo, useState, useEffect, useCallback } from "react";

export function useWizard(rawSteps, initialStepId) {
  const steps = useMemo(
    () =>
      (rawSteps || []).map((step, index) => ({
        id: step.id ?? index + 1,
        name: step.name ?? `Step ${index + 1}`,
        ...step,
      })),
    [rawSteps]
  );

  const normalizedInitial = useMemo(() => {
    if (!steps.length) return null;
    const fallback = steps[0].id;
    if (initialStepId == null) return fallback;
    const hit = steps.find((step) => String(step.id) === String(initialStepId));
    return hit ? hit.id : fallback;
  }, [steps, initialStepId]);

  const [currentStepId, setCurrentStepId] = useState(normalizedInitial);

  useEffect(() => {
    setCurrentStepId(normalizedInitial);
  }, [normalizedInitial]);

  useEffect(() => {
    if (!steps.length) return;
    const exists = steps.some((step) => String(step.id) === String(currentStepId));
    if (!exists) {
      setCurrentStepId(steps[0].id);
    }
  }, [steps, currentStepId]);

  const currentIndex = useMemo(() => {
    const idx = steps.findIndex((step) => String(step.id) === String(currentStepId));
    return idx >= 0 ? idx : 0;
  }, [steps, currentStepId]);

  const goToStep = useCallback(
    (targetStepId) => {
      if (!steps?.length) return;
      const exists = steps.some((step) => String(step.id) === String(targetStepId));
      if (exists) {
        setCurrentStepId(targetStepId);
      }
    },
    [steps]
  );

  const nextStepMeta = steps[currentIndex + 1] || null;
  const previousStepMeta = steps[currentIndex - 1] || null;

  const nextStep = useCallback(() => {
    if (!nextStepMeta) return null;
    setCurrentStepId(nextStepMeta.id);
    return nextStepMeta;
  }, [nextStepMeta]);

  const previousStep = useCallback(() => {
    if (!previousStepMeta) return null;
    setCurrentStepId(previousStepMeta.id);
    return previousStepMeta;
  }, [previousStepMeta]);

  return {
    steps,
    currentStepId,
    currentStepIndex: currentIndex + 1,
    currentStep: steps[currentIndex] || steps[0] || null,
    isFirstStep: currentIndex <= 0,
    isLastStep: currentIndex >= steps.length - 1,
    goToStep,
    nextStep,
    previousStep,
    nextStepMeta,
    previousStepMeta,
  };
}

export default useWizard;
