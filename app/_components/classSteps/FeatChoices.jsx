"use client";

import React, { useState, useEffect } from "react";
import Select from "../UI/Select";
import Badge from "../UI/Badge";
import styles from "../../_styles/character/CharacterForm.module.css";
import { apiClient } from "../../_lib/api/client";

const FeatChoices = ({ 
  featId, 
  featName, 
  featData = {},
  choices = {}, 
  onChoicesChange,
  cantripOptions = [],
  spellOptions = [],
  availableSpells = [],
  klasses = []
}) => {
  const [localChoices, setLocalChoices] = useState(() => choices || {});
  const [featCantripOptions, setFeatCantripOptions] = useState([]);
  const [featSpellOptions, setFeatSpellOptions] = useState([]);

  // Debug das props recebidas
  console.log('=== FeatChoices Props Debug ===');
  console.log('featId:', featId);
  console.log('featName:', featName);
  console.log('featData:', featData);
  console.log('cantripOptions length:', cantripOptions?.length || 0);
  console.log('spellOptions length:', spellOptions?.length || 0);
  console.log('cantripOptions sample:', cantripOptions?.slice(0, 2));
  console.log('spellOptions sample:', spellOptions?.slice(0, 2));
  console.log('klasses length:', klasses?.length || 0);
  console.log('klasses sample:', klasses?.slice(0, 2));
  console.log('===============================');

  // Sync local state with props when choices change
  useEffect(() => {
    setLocalChoices(choices || {});
  }, [choices]);

  // Função para carregar magias de uma classe específica
  const loadSpellsForClass = async (classId) => {
    console.log('=== loadSpellsForClass Debug ===');
    console.log('classId:', classId);
    console.log('klasses length:', klasses.length);
    console.log('klasses sample:', klasses.slice(0, 3));
    
    if (!classId || !klasses.length) {
      console.log('Missing classId or klasses, returning early');
      return;
    }
    
    try {
      const klass = klasses.find(k => {
        const classIdLower = classId.toLowerCase();
        const klassNameLower = k.name?.toLowerCase();
        const klassApiIndex = k.api_index?.toLowerCase();
        
        const matches = klassNameLower === classIdLower || 
               klassApiIndex === classIdLower ||
               (classIdLower === 'mago' && klassApiIndex === 'wizard') ||
               (classIdLower === 'bruxo' && klassApiIndex === 'warlock') ||
               (classIdLower === 'bardo' && klassApiIndex === 'bard') ||
               (classIdLower === 'clérigo' && klassApiIndex === 'cleric') ||
               (classIdLower === 'druida' && klassApiIndex === 'druid') ||
               (classIdLower === 'feiticeiro' && klassApiIndex === 'sorcerer') ||
               (classIdLower === 'paladino' && klassApiIndex === 'paladin') ||
               (classIdLower === 'patrulheiro' && klassApiIndex === 'ranger');
        
        console.log(`Checking klass ${k.name} (${k.api_index}): matches=${matches}`);
        return matches;
      });
      
      if (!klass) {
        console.log('No matching klass found');
        return;
      }
      
      console.log('Found matching klass:', klass);
      const { spells = [] } = await apiClient.get(`/api/v1/public/spells?klass_id=${klass.id}`);
      console.log('API response spells:', spells.length);
      
      const cantrips = spells
        .filter(s => (s.level || 0) === 0)
        .map(s => ({ id: s.id, name: s.name, level: s.level || 0 }));
      
      const leveled = spells
        .filter(s => (s.level || 0) > 0)
        .map(s => ({ id: s.id, name: s.name, level: s.level || 0 }));
      
      setFeatCantripOptions(cantrips);
      setFeatSpellOptions(leveled);
      
      console.log(`Loaded ${cantrips.length} cantrips and ${leveled.length} spells for class ${classId}`);
      console.log('========================');
    } catch (error) {
      console.error('Erro ao carregar magias da classe:', error);
      setFeatCantripOptions([]);
      setFeatSpellOptions([]);
    }
  };

  // Extract rules from backend data
  const currentRules = {
    ability: featData.ability_bonuses?.choose ? {
      amount: featData.ability_bonuses.choose.amount,
      options: featData.ability_bonuses.choose.options
    } : null,
    saving_throws: featData.proficiency_bonuses?.saving_throws?.choose ? {
      amount: featData.proficiency_bonuses.saving_throws.choose.amount,
      options: featData.proficiency_bonuses.saving_throws.choose.options
    } : null,
    weapons: featData.proficiency_bonuses?.weapons?.choose ? {
      amount: featData.proficiency_bonuses.weapons.choose.amount,
      options: featData.proficiency_bonuses.weapons.choose.options
    } : null,
    cantrips: featData.cantrips?.choose ? {
      amount: featData.cantrips.choose.amount,
      class_options: featData.cantrips.choose.class_options
    } : null,
    spells: featData.spells?.choose ? {
      amount: featData.spells.choose.amount,
      level: featData.spells.choose.level,
      class_options: featData.spells.choose.class_options
    } : null
  };

  useEffect(() => {
    onChoicesChange(localChoices);
  }, [localChoices]);

  // Carregar magias quando uma classe é selecionada para cantrips
  useEffect(() => {
    if (localChoices.cantrip_class && klasses.length > 0) {
      console.log('Loading spells for cantrip class:', localChoices.cantrip_class);
      loadSpellsForClass(localChoices.cantrip_class);
    }
  }, [localChoices.cantrip_class, klasses]);

  // Carregar magias quando uma classe é selecionada para spells
  useEffect(() => {
    if (localChoices.spell_class && klasses.length > 0) {
      console.log('Loading spells for spell class:', localChoices.spell_class);
      loadSpellsForClass(localChoices.spell_class);
    }
  }, [localChoices.spell_class, klasses]);

  const handleChoiceChange = (type, value) => {
    setLocalChoices(prev => ({
      ...prev,
      [type]: value
    }));
  };

  // Check if all required choices are made
  const isComplete = () => {
    if (!currentRules) return true;
    
    // Check ability choice
    if (currentRules.ability && !localChoices.ability) return false;
    
    // Check saving throw choice
    if (currentRules.saving_throws && !localChoices.saving_throws) return false;
    
    // Check weapon choices
    if (currentRules.weapons && (!localChoices.weapons || localChoices.weapons.length < currentRules.weapons.amount)) return false;
    
    // Check cantrip choices
    if (currentRules.cantrips) {
      if (!localChoices.cantrip_class) return false;
      if (!localChoices.cantrips || localChoices.cantrips.length < currentRules.cantrips.amount) return false;
    }
    
    // Check spell choices
    if (currentRules.spells) {
      if (!localChoices.spell_class) return false;
      if (!localChoices.spells || localChoices.spells.length < currentRules.spells.amount) return false;
    }
    
    return true;
  };

  const getAbilityOptions = () => {
    return [
      { id: 'str', name: 'FOR (Força)' },
      { id: 'dex', name: 'DES (Destreza)' },
      { id: 'con', name: 'CON (Constituição)' },
      { id: 'int', name: 'INT (Inteligência)' },
      { id: 'wis', name: 'SAB (Sabedoria)' },
      { id: 'cha', name: 'CAR (Carisma)' }
    ];
  };

  const getSavingThrowOptions = () => {
    return [
      { id: 'str', name: 'FOR (Força)' },
      { id: 'dex', name: 'DES (Destreza)' },
      { id: 'con', name: 'CON (Constituição)' },
      { id: 'int', name: 'INT (Inteligência)' },
      { id: 'wis', name: 'SAB (Sabedoria)' },
      { id: 'cha', name: 'CAR (Carisma)' }
    ];
  };

  const getWeaponOptions = () => {
    return [
      { id: 'arma_simples', name: 'Arma Simples' },
      { id: 'arma_marcial', name: 'Arma Marcial' }
    ];
  };

  const getClassOptions = () => {
    return [
      { id: 'mago', name: 'Mago' },
      { id: 'bruxo', name: 'Bruxo' },
      { id: 'bardo', name: 'Bardo' },
      { id: 'clérigo', name: 'Clérigo' },
      { id: 'druida', name: 'Druida' },
      { id: 'feiticeiro', name: 'Feiticeiro' },
      { id: 'paladino', name: 'Paladino' },
      { id: 'patrulheiro', name: 'Patrulheiro' },
      // Adicionar variações de nomes que podem estar nos dados
      { id: 'wizard', name: 'Mago' },
      { id: 'warlock', name: 'Bruxo' },
      { id: 'bard', name: 'Bardo' },
      { id: 'cleric', name: 'Clérigo' },
      { id: 'druid', name: 'Druida' },
      { id: 'sorcerer', name: 'Feiticeiro' },
      { id: 'paladin', name: 'Paladino' },
      { id: 'ranger', name: 'Patrulheiro' }
    ];
  };

  const getFilteredCantrips = (selectedClass) => {
    console.log('=== getFilteredCantrips Debug ===');
    console.log('selectedClass:', selectedClass);
    console.log('featCantripOptions length:', featCantripOptions?.length || 0);
    console.log('featCantripOptions sample:', featCantripOptions?.slice(0, 3));
    
    if (!selectedClass) {
      console.log('No class selected, returning empty array');
      return [];
    }
    
    // Usar as magias carregadas dinamicamente para a classe selecionada
    const filtered = featCantripOptions || [];
    
    console.log('Filtered cantrips:', filtered.length);
    console.log('========================');
    return filtered;
  };

  const getFilteredSpells = (selectedClass, level) => {
    console.log('=== getFilteredSpells Debug ===');
    console.log('selectedClass:', selectedClass);
    console.log('level:', level);
    console.log('featSpellOptions length:', featSpellOptions?.length || 0);
    console.log('featSpellOptions sample:', featSpellOptions?.slice(0, 3));
    
    if (!selectedClass || !level) {
      console.log('Missing class or level, returning empty array');
      return [];
    }
    
    // Usar as magias carregadas dinamicamente para a classe selecionada e filtrar por nível
    const filtered = (featSpellOptions || []).filter(spell => {
      const correctLevel = spell.level === level;
      console.log(`Spell ${spell.name}: level=${spell.level}, matches=${correctLevel}`);
      return correctLevel;
    });
    
    console.log('Filtered spells:', filtered.length);
    console.log('========================');
    return filtered;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          Escolhas para {featName}
        </div>
        <Badge variant={isComplete() ? 'highlight' : 'medium'}>
          {isComplete() ? '✓ Completo' : '▲ Incompleto'}
        </Badge>
      </div>

      {/* Ability Score Choice */}
      {currentRules.ability && (
        <div className={styles.choiceField}>
          <label className={styles.label}>
            Escolha {currentRules.ability.amount} atributo(s):
          </label>
          <Select
            placeholder="Selecione um atributo"
            options={getAbilityOptions().filter(o => currentRules.ability.options.includes(o.id))}
            value={localChoices.ability || null}
            onChange={(val) => handleChoiceChange('ability', val)}
          />
        </div>
      )}

      {/* Saving Throw Choice */}
      {currentRules.saving_throws && (
        <div className={styles.choiceField}>
          <label className={styles.label}>
            Escolha {currentRules.saving_throws.amount} salvaguarda(s):
          </label>
          <Select
            placeholder="Selecione uma salvaguarda"
            options={getSavingThrowOptions()}
            value={localChoices.saving_throws || null}
            onChange={(val) => handleChoiceChange('saving_throws', val)}
          />
        </div>
      )}

      {/* Weapon Choice */}
      {currentRules.weapons && (
        <div className={styles.choiceField}>
          <label className={styles.label}>
            Escolha {currentRules.weapons.amount} tipo(s) de arma:
          </label>
          <Select
            multiselect
            placeholder={`Escolha até ${currentRules.weapons.amount} tipos`}
            options={getWeaponOptions()}
            value={localChoices.weapons || []}
            onChange={(val) => handleChoiceChange('weapons', (val || []).slice(0, currentRules.weapons.amount))}
          />
        </div>
      )}

      {/* Cantrips Choice */}
      {currentRules.cantrips && (
        <div className={styles.choiceField}>
          <label className={styles.label}>
            Escolha {currentRules.cantrips.amount} cantrip(s):
          </label>
          <Select
            placeholder="Selecione uma classe para ver cantrips"
            options={getClassOptions()}
            value={localChoices.cantrip_class || null}
            onChange={(val) => handleChoiceChange('cantrip_class', val)}
          />
          {localChoices.cantrip_class && (
            <div className={styles.nestedChoice}>
              <Select
                multiselect
                placeholder={`Escolha até ${currentRules.cantrips.amount} cantrips`}
                options={getFilteredCantrips(localChoices.cantrip_class)}
                value={localChoices.cantrips || []}
                onChange={(val) => handleChoiceChange('cantrips', (val || []).slice(0, currentRules.cantrips.amount))}
              />
              {localChoices.cantrips && localChoices.cantrips.length > 0 && (
                <div className={styles.choiceSummary}>
                  <strong>Cantrips selecionados:</strong> {localChoices.cantrips.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Spells Choice */}
      {currentRules.spells && (
        <div className={styles.choiceField}>
          <label className={styles.label}>
            Escolha {currentRules.spells.amount} magia(s) de {currentRules.spells.level}º nível:
          </label>
          <Select
            placeholder="Selecione uma classe para ver magias"
            options={getClassOptions()}
            value={localChoices.spell_class || null}
            onChange={(val) => handleChoiceChange('spell_class', val)}
          />
          {localChoices.spell_class && (
            <div className={styles.nestedChoice}>
              <Select
                multiselect
                placeholder={`Escolha até ${currentRules.spells.amount} magias`}
                options={getFilteredSpells(localChoices.spell_class, currentRules.spells.level)}
                value={localChoices.spells || []}
                onChange={(val) => handleChoiceChange('spells', (val || []).slice(0, currentRules.spells.amount))}
              />
              {localChoices.spells && localChoices.spells.length > 0 && (
                <div className={styles.choiceSummary}>
                  <strong>Magias selecionadas:</strong> {localChoices.spells.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeatChoices;
