"use client";

import React, { useState, useEffect } from "react";
import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";

const StepBackground = ({ 
  backgroundKey, 
  setBackgroundKey, 
  backgroundName, 
  setBackgroundName, 
  backgroundProfs, 
  setBackgroundProfs,
  backgroundOptions = [],
  backgroundIndexMap = {},
  backgroundChoices = {},
  setBackgroundChoices,
  onValidationChange
}) => {
  const [backgroundDetails, setBackgroundDetails] = useState(null);

  // Função para validar se todas as escolhas obrigatórias foram feitas
  const validateBackgroundChoices = () => {
    if (!backgroundDetails || !backgroundKey) return true;
    
    const currentChoices = backgroundChoices[backgroundKey] || {};
    
    // Validar idiomas
    if (backgroundDetails.languages?.choose > 0) {
      const selectedLanguages = currentChoices.languages || [];
      if (selectedLanguages.length < backgroundDetails.languages.choose) {
        return false;
      }
    }
    
    // Validar ferramentas com escolhas
    if (backgroundDetails.tools) {
      for (const tool of backgroundDetails.tools) {
        if (typeof tool === 'object' && tool !== null) {
          const toolKey = Object.keys(tool)[0];
          const toolData = tool[toolKey];
          if (toolData.choose > 0) {
            const selectedTool = currentChoices.tools?.[toolKey];
            if (!selectedTool) {
              return false;
            }
          }
        }
      }
    }
    
    return true;
  };

  // Função para obter dados estruturados para a API
  const getBackgroundDataForAPI = () => {
    if (!backgroundKey || !backgroundDetails) return null;
    
    const currentChoices = backgroundChoices[backgroundKey] || {};
    
    return {
      background_id: backgroundKey,
      background_name: backgroundDetails.name,
      choices: {
        languages: currentChoices.languages || [],
        tools: currentChoices.tools || {}
      },
      source: 'background' // Identifica que as escolhas vêm do background
    };
  };

  // Função para lidar com escolhas de idiomas
  const handleLanguageChoice = (choice) => {
    if (!backgroundKey) return;
    
    const currentChoices = backgroundChoices[backgroundKey] || {};
    const currentLanguages = currentChoices.languages || [];
    
    // Se já está selecionado, remove; senão, adiciona
    const newLanguages = currentLanguages.includes(choice)
      ? currentLanguages.filter(lang => lang !== choice)
      : [...currentLanguages, choice];
    
    // Verifica se não excede o limite
    const maxChoices = backgroundDetails?.languages?.choose || 0;
    if (newLanguages.length > maxChoices) {
      newLanguages.splice(0, newLanguages.length - maxChoices);
    }
    
    setBackgroundChoices({
      ...backgroundChoices,
      [backgroundKey]: {
        ...currentChoices,
        languages: newLanguages
      }
    });
  };

  // Função para lidar com escolhas de ferramentas
  const handleToolChoice = (toolType, choice) => {
    if (!backgroundKey) return;
    
    const currentChoices = backgroundChoices[backgroundKey] || {};
    const currentTools = currentChoices.tools || {};
    
    setBackgroundChoices({
      ...backgroundChoices,
      [backgroundKey]: {
        ...currentChoices,
        tools: {
          ...currentTools,
          [toolType]: choice
        }
      }
    });
  };

  const handleBackgroundChange = (val) => {
    setBackgroundKey(val);
    const found = backgroundOptions.find(b => String(b.id) === String(val));
    setBackgroundName(found?.name || '');
    const skills = (found?.skills || []).map(s => ({ id: s, name: s }));
    setBackgroundProfs(skills);
    
    // Usar dados do backgroundIndexMap que já vêm do PlayerCharacterFormDialog
    const local = backgroundIndexMap?.[val] || found;
    console.log('local', local);
    if (local) {
      setBackgroundDetails({ 
        name: local.name, 
        desc: local.desc || local.description || '', 
        tools: local.tools || [], 
        skills: local.skills || [],
        languages: local.languages || null,
        equipment: local.equipment || [],
        feature: local.feature || null
      });
    } else {
      setBackgroundDetails(null);
    }
  };

  // Notificar mudanças de validação
  useEffect(() => {
    if (onValidationChange) {
      const isValid = validateBackgroundChoices();
      const backgroundData = getBackgroundDataForAPI();
      onValidationChange(isValid, backgroundData);
    }
  }, [backgroundKey, backgroundDetails, backgroundChoices]);

  return (
    <>
      <label className={styles.label}>Antecedente (Background):</label>
      <Select
        placeholder="Selecione o background"
        options={backgroundOptions.map(b=>({ id: b.id, name: b.name }))}
        value={backgroundKey}
        onChange={handleBackgroundChange}
      />
      
      {backgroundKey && backgroundDetails && (
        <div className={styles.backgroundDetails} style={{ marginTop: 16 }}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>{backgroundDetails.name}</div>
            </div>
            
            {/* Descrição do antecedente */}
            {backgroundDetails.desc && (
              <div className={styles.backgroundSection}>
                <div className={styles.sectionTitle}>Descrição</div>
                <div className={styles.backgroundDescription}>
                  {backgroundDetails.desc}
                </div>
              </div>
            )}
            
            {/* Proficiências de perícias */}
            {backgroundDetails.skills && backgroundDetails.skills.length > 0 && (
              <div className={styles.backgroundSection}>
                <div className={styles.sectionTitle}>Perícias</div>
                <div className={styles.proficiencyList}>
                  {backgroundDetails.skills.map((skill, index) => (
                    <span key={index} className={styles.proficiencyItem}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Proficiências de ferramentas */}
            {backgroundDetails.tools && backgroundDetails.tools.length > 0 && (
              <div className={styles.backgroundSection}>
                <div className={styles.sectionTitle}>Ferramentas</div>
                <div className={styles.proficiencyList}>
                  {backgroundDetails.tools.map((tool, index) => {
                    // Se for um objeto complexo, renderizar de forma especial
                    if (typeof tool === 'object' && tool !== null) {
                      const toolKey = Object.keys(tool)[0];
                      const toolData = tool[toolKey];
                      const currentChoices = backgroundChoices[backgroundKey] || {};
                      
                      return (
                        <div key={index} className={styles.complexToolItem}>
                          <span className={styles.proficiencyItem}>{toolKey.replace('_', ' ')}</span>
                          {toolData.choose > 0 && (
                            <span className={styles.toolChoice}>
                              (escolha {toolData.choose})
                              {!currentChoices.tools?.[toolKey] && (
                                <span className={styles.requiredIndicator}> * Obrigatório</span>
                              )}
                            </span>
                          )}
                          {toolData.choices && toolData.choices.length > 0 && (
                            <div className={styles.toolChoices}>
                              {toolData.choices.map((choice, choiceIndex) => {
                                const selectedTool = currentChoices.tools?.[toolKey];
                                const isSelected = selectedTool === choice;
                                
                                return (
                                  <span 
                                    key={choiceIndex} 
                                    className={`${styles.toolChoiceItem} ${isSelected ? styles.selected : styles.clickable}`}
                                    onClick={() => handleToolChoice(toolKey, choice)}
                                  >
                                    {choice}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                    // Se for string simples, renderizar normalmente
                    return (
                      <span key={index} className={styles.proficiencyItem}>
                        {tool}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Idiomas */}
            {backgroundDetails.languages && (
              <div className={styles.backgroundSection}>
                <div className={styles.sectionTitle}>
                  Idiomas {backgroundDetails.languages.choose > 0 && `(escolha ${backgroundDetails.languages.choose})`}
                </div>
                {backgroundDetails.languages.choices && backgroundDetails.languages.choices.length > 0 ? (
                  <div className={styles.proficiencyList}>
                    {backgroundDetails.languages.choices.map((language, index) => {
                      const currentChoices = backgroundChoices[backgroundKey] || {};
                      const selectedLanguages = currentChoices.languages || [];
                      const isSelected = selectedLanguages.includes(language);
                      const canSelect = selectedLanguages.length < backgroundDetails.languages.choose;
                      
                      return (
                        <span 
                          key={index} 
                          className={`${styles.languageItem} ${isSelected ? styles.selected : ''} ${!isSelected && !canSelect ? styles.disabled : styles.clickable}`}
                          onClick={() => handleLanguageChoice(language)}
                        >
                          {language}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.noChoices}>Nenhum idioma adicional</div>
                )}
                {backgroundDetails.languages.choose > 0 && (
                  <div className={`${styles.choiceStatus} ${(backgroundChoices[backgroundKey]?.languages || []).length < backgroundDetails.languages.choose ? styles.incomplete : styles.complete}`}>
                    Selecionados: {(backgroundChoices[backgroundKey]?.languages || []).length} / {backgroundDetails.languages.choose}
                    {(backgroundChoices[backgroundKey]?.languages || []).length < backgroundDetails.languages.choose && (
                      <span className={styles.requiredIndicator}> * Obrigatório</span>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Equipamentos iniciais */}
            {backgroundDetails.equipment && backgroundDetails.equipment.length > 0 && (
              <div className={styles.backgroundSection}>
                <div className={styles.sectionTitle}>Equipamentos Iniciais</div>
                <div className={styles.equipmentList}>
                  {backgroundDetails.equipment.map((item, index) => (
                    <div key={index} className={styles.equipmentItem}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Característica especial */}
            {backgroundDetails.feature && (
              <div className={styles.backgroundSection}>
                <div className={styles.sectionTitle}>Característica Especial</div>
                <div className={styles.featureName}>{backgroundDetails.feature.name}</div>
                {backgroundDetails.feature.desc && (
                  <div className={styles.featureDescription}>
                    {backgroundDetails.feature.desc}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Fallback para quando não há detalhes completos */}
      {backgroundKey && !backgroundDetails && (
        <div className={styles.backgroundFallback} style={{ marginTop: 12 }}>
          <div className={styles.small}>
            Proficiências do Background: {(backgroundProfs || []).map(s=> s?.name || s).join(', ') || '—'}
          </div>
        </div>
      )}
    </>
  );
};

export default StepBackground;
