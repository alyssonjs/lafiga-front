"use client";

import { useState, useEffect } from 'react'
import Select from "../UI/Select";
import Input from "../UI/Input";
import { apiClient } from "../../_lib/api/client";
import styles from "../../_styles/character/CharacterForm.module.css";
import ASISelector from "../classSteps/ASISelector";

const ABILITY_OPTIONS = [
  { id:'STR', name:'FOR' },
  { id:'DEX', name:'DES' },
  { id:'CON', name:'CON' },
  { id:'INT', name:'INT' },
  { id:'WIS', name:'SAB' },
  { id:'CHA', name:'CAR' },
];

// Fallback map only if usuário digitar texto manual (desencorajado)
const FEAT_NAME_TO_ID = {
  'Observador': 'observador',
  'Durável': 'duravel',
  'Atirador Aguçado': 'atirador_agucado',
  'Sentinela': 'sentinela',
  'Resiliente': 'resiliente',
  'Atleta': 'atleta',
  'Mágico Iniciante': 'magico_iniciante'
};

const RaceHuman = ({ subRuleId, picks, setPicks, skillOptions = [], klasses = [] }) => {
  if (subRuleId !== 'variant') return null;
  const vhASI = picks?.variantHumanASI || null;
  const chosenFeatId = vhASI?.featId || picks?.variantHumanFeat || (picks?.variantHumanFeatText ? FEAT_NAME_TO_ID[picks.variantHumanFeatText] : null) || null;
  const vhChoices = vhASI?.choices || picks?.variantHumanFeatChoices || {};
  const setChoices = (patch) => setPicks({ ...(picks||{}), variantHumanASI: { ...(picks?.variantHumanASI || { mode: 'attributes' }), choices: { ...(vhChoices || {}), ...patch } } });
  return (
    <div>
      <ASISelector
        title={'Humano Variante: Atributos ou Talento'}
        asiGrant={1}
        asiChoice={vhASI || { mode: 'attributes', attributes: [] }}
        setAsiChoice={(updater) => {
          const prev = picks?.variantHumanASI || { mode: 'attributes', attributes: [], choices: {} };
          const next = (typeof updater === 'function') ? (updater(prev) || {}) : (updater || {});
          setPicks({ ...(picks || {}), variantHumanASI: next });
        }}
        cantripOptions={[]}
        spellOptions={[]}
        klasses={klasses}
        currentFeatId={chosenFeatId}
        excludeIds={[]}
        showModeToggle={true}
        defaultMode={(vhASI?.mode) || 'attributes'}
        attributesLabel={'Selecione 2 atributos distintos (+1 em cada)'}
      />
    </div>
  );
};

export default RaceHuman;
