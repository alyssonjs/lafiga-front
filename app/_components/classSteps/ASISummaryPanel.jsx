"use client";

import React from "react";
import styles from "../../_styles/character/CharacterForm.module.css";

const ASISummaryPanel = ({ classPicksByLevel = {}, level = 1 }) => {
  const getASISummary = () => {
    const summary = [];
    
    for (let i = 1; i <= level; i++) {
      const picks = classPicksByLevel[i];
      const asi = picks?.asi;
      
      if (asi) {
        if (asi.mode === 'attributes') {
          const attributes = asi.attributes || [];
          if (attributes.length === 1) {
            // +2 em um atributo
            const attrName = getAttributeName(attributes[0]);
            summary.push({
              level: i,
              type: 'attributes',
              description: `Atributos: +2 ${attrName}`
            });
          } else if (attributes.length === 2) {
            // +1 em dois atributos
            const attrNames = attributes.map(getAttributeName);
            summary.push({
              level: i,
              type: 'attributes',
              description: `Atributos: +1 ${attrNames.join(', +1 ')}`
            });
          }
        } else if (asi.mode === 'feat') {
          const featName = getFeatName(asi.featId || asi.featName);
          const choices = asi.choices || {};
          
          // Build feat description with choices
          let featDesc = featName;
          const choiceParts = [];
          
          if (choices.ability) {
            choiceParts.push(`+1 ${getAttributeName(choices.ability)}`);
          }
          
          if (choices.saving_throws) {
            choiceParts.push(`proficiência em ${getAttributeName(choices.saving_throws)}`);
          }
          
          if (choices.cantrips && choices.cantrips.length > 0) {
            choiceParts.push(`${choices.cantrips.length} cantrip(s)`);
          }
          
          if (choices.spells && choices.spells.length > 0) {
            choiceParts.push(`${choices.spells.length} magia(s)`);
          }
          
          if (choiceParts.length > 0) {
            featDesc += `: ${choiceParts.join(', ')}`;
          }
          
          summary.push({
            level: i,
            type: 'feat',
            description: featDesc
          });
        }
      }
    }
    
    return summary;
  };

  const getAttributeName = (attr) => {
    const attrMap = {
      'str': 'FOR',
      'dex': 'DES', 
      'con': 'CON',
      'int': 'INT',
      'wis': 'SAB',
      'cha': 'CAR',
      'STR': 'FOR',
      'DEX': 'DES',
      'CON': 'CON', 
      'INT': 'INT',
      'WIS': 'SAB',
      'CHA': 'CAR'
    };
    return attrMap[attr] || attr;
  };

  const getFeatName = (featId) => {
    const featMap = {
      'observador': 'Observador',
      'duravel': 'Durável',
      'atirador_agucado': 'Atirador Aguçado',
      'sentinela': 'Sentinela',
      'resiliente': 'Resiliente',
      'atleta': 'Atleta',
      'especialista_em_armas': 'Especialista em Armas',
      'magico_iniciante': 'Mágico Iniciante',
      'especialista_em_armadura': 'Especialista em Armadura',
      'especialista_em_escudo': 'Especialista em Escudo'
    };
    return featMap[featId] || featId;
  };

  const summary = getASISummary();

  if (summary.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Aprimoramentos de Atributo (ASI)</div>
        <div className={styles.scrollText}>
          Nenhum aprimoramento de atributo ainda.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>Aprimoramentos de Atributo (ASI)</div>
      <div className={styles.scrollText}>
        {summary.map((item, index) => (
          <div key={index} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', color: '#495057' }}>
              Nível {item.level}:
            </div>
            <div style={{ marginLeft: '12px', color: '#6c757d' }}>
              {item.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ASISummaryPanel;
