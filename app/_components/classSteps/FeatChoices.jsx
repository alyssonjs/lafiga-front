"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  klasses = [],
  skillsAll = [],
  instruments = []
}) => {
  const [localChoices, setLocalChoices] = useState(() => choices || {});
  const [featCantripOptions, setFeatCantripOptions] = useState([]);
  const [featSpellOptions, setFeatSpellOptions] = useState([]);

  // Helpers to normalize JSONish strings that may come from DB
  const parseJsonish = (val) => {
    if (!val) return val;
    if (typeof val === 'object') return val;
    if (typeof val === 'string') {
      let s = val.trim();
      try { return JSON.parse(s); } catch(_) {}
      try { return JSON.parse(s.replace(/=>/g, ':')); } catch(_) {}
    }
    return val;
  };

  const feat = useMemo(() => {
    // Normalize key structures possibly coming as strings
    return {
      ...featData,
      ability_bonuses: parseJsonish(featData.ability_bonuses) || {},
      proficiency_bonuses: parseJsonish(featData.proficiency_bonuses) || {},
      cantrips: parseJsonish(featData.cantrips) || {},
      spells: parseJsonish(featData.spells) || {},
      features: parseJsonish(featData.features) || {},
      special_rules: parseJsonish(featData.special_rules) || {}
    };
  }, [featData]);

  // Debug das props recebidas
  console.log('=== FeatChoices Props Debug ===');
  console.log('featId:', featId);
  console.log('featName:', featName);
  console.log('featData (normalized):', feat);
  console.log('feat.cantrips:', feat.cantrips);
  console.log('feat.spells:', feat.spells);
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
    ability: feat.ability_bonuses?.choose ? {
      amount: feat.ability_bonuses.choose.amount,
      options: feat.ability_bonuses.choose.options
    } : null,
    saving_throws: feat.proficiency_bonuses?.saving_throws?.choose ? {
      amount: feat.proficiency_bonuses.saving_throws.choose.amount,
      options: feat.proficiency_bonuses.saving_throws.choose.options
    } : null,
    weapons: feat.proficiency_bonuses?.weapons?.choose ? {
      amount: feat.proficiency_bonuses.weapons.choose.amount,
      options: feat.proficiency_bonuses.weapons.choose.options
    } : null,
    cantrips: feat.cantrips?.choose ? {
      amount: feat.cantrips.choose.amount,
      class_options: feat.cantrips.choose.class_options
    } : null,
    spells: feat.spells?.choose ? {
      amount: feat.spells.choose.amount,
      level: feat.spells.choose.level,
      class_options: feat.spells.choose.class_options
    } : null,
    skills_or_tools: feat.proficiency_bonuses?.skills_or_tools?.choose ? {
      amount: Number(feat.proficiency_bonuses.skills_or_tools.choose.amount || feat.proficiency_bonuses.skills_or_tools.choose) || 0,
      any: true
    } : null
  };
  // Maneuvers (ex.: Adepto Marcial)
  const maneuversConf = useMemo(() => {
    try {
      const sr = feat.special_rules || {};
      const man = sr.maneuvers || sr['maneuvers'] || null;
      if (!man || !man.choose) return null;
      const choose = Number(man.choose.amount || man.choose || 0) || 0;
      if (choose <= 0) return null;
      const opts = Array.isArray(man.options) ? man.options : [];
      const norm = opts.map((o) => (typeof o === 'string' ? { id: o, name: o } : { id: o.id || o.name, name: o.name || o.id }));
      return { choose, options: norm };
    } catch (_) { return null; }
  }, [feat]);

  // Extract special rules for display
  const specialRules = feat.special_rules || {};
  // Elemental Adept — requires picking a damage type
  const elementalFocus = useMemo(() => {
    try {
      const node = specialRules?.magic_modifiers?.elemental_focus || specialRules?.magic || specialRules?.magic_modifiers;
      const ef = specialRules?.magic_modifiers?.elemental_focus;
      if (!ef) return null;
      const params = ef.parameters || {};
      const choices = params.damage_type_choice || [];
      if (!Array.isArray(choices) || choices.length === 0) return null;
      return { options: choices.map((t)=> ({ id: String(t), name: String(t).toUpperCase() })), onesTo: params.ones_count_as || 2 };
    } catch(_) { return null; }
  }, [specialRules]);

  // Debug extracted rules
  console.log('=== Extracted Rules Debug ===');
  console.log('currentRules:', currentRules);
  console.log('currentRules.cantrips:', currentRules.cantrips);
  console.log('currentRules.spells:', currentRules.spells);
  console.log('=============================');

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
    // Skills or Tools (Perito)
    if (currentRules.skills_or_tools) {
      const arr = Array.isArray(localChoices.skills_or_tools) ? localChoices.skills_or_tools : [];
      if (arr.length < currentRules.skills_or_tools.amount) return false;
    }
    // Maneuvers requirement
    if (maneuversConf) {
      const arr = Array.isArray(localChoices.maneuvers) ? localChoices.maneuvers : [];
      if (arr.length < maneuversConf.choose) return false;
    }
    if (elementalFocus) {
      const dt = localChoices.elemental_damage || localChoices.damage_type || null;
      if (!dt) return false;
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

  const getSkillsOrToolsOptions = () => {
    const skillOpts = (skillsAll || []).map((s) => ({ id: `skill:${s}`, name: `Perícia: ${s}` }));
    const instOpts = (instruments || []).map((i) => ({ id: `tool:${i}`, name: `Ferramenta: ${i}` }));
    // Fallback minimal tool list (caso não venha instruments)
    const fallbackTools = ['Ferramentas de Ladrão','Kit de Disfarce','Kit de Falsificação','Kit de Herbalismo','Ferramentas de Navegador','Veículo (Terrestre)','Veículo (Aquático)'];
    const fbOpts = instOpts.length ? [] : fallbackTools.map((t)=> ({ id: `tool:${t}`, name: `Ferramenta: ${t}` }));
    // Dedup by id
    const map = new Map();
    [...skillOpts, ...instOpts, ...fbOpts].forEach(o => { if (!map.has(o.id)) map.set(o.id, o); });
    return Array.from(map.values());
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

  // Function to render special rules
  const renderSpecialRules = () => {
    if (!specialRules || Object.keys(specialRules).length === 0) {
      return null;
    }

    const renderMovementRules = () => {
      const movement = specialRules.movement || {};
      if (Object.keys(movement).length === 0) return null;

      return (
        <div className={styles.specialRule}>
          <div className={styles.specialRuleTitle}>🏃‍♂️ Modificadores de Movimento</div>
          {movement.speed_bonus && (
            <div className={styles.specialRuleItem}>
              <strong>Velocidade:</strong> +{movement.speed_bonus}m
            </div>
          )}
          {movement.ignore_difficult_terrain && (
            <div className={styles.specialRuleItem}>
              <strong>Terreno Difícil:</strong> Ignora custo extra de movimento
            </div>
          )}
          {movement.stealth_in_light_obscurement && (
            <div className={styles.specialRuleItem}>
              <strong>Furtividade:</strong> Pode se esconder quando levemente obscurecido
            </div>
          )}
        </div>
      );
    };

    const renderCombatRules = () => {
      const combat = specialRules.combat || {};
      if (Object.keys(combat).length === 0) return null;

      return (
        <div className={styles.specialRule}>
          <div className={styles.specialRuleTitle}>⚔️ Modificadores de Combate</div>
          {combat.ignore_cover_types && (
            <div className={styles.specialRuleItem}>
              <strong>Cobertura:</strong> Ignora {combat.ignore_cover_types.join(' e ')}
            </div>
          )}
          {combat.no_long_range_disadvantage && (
            <div className={styles.specialRuleItem}>
              <strong>Alcance:</strong> Sem desvantagem à longa distância
            </div>
          )}
          {combat.power_attack_option && (
            <div className={styles.specialRuleItem}>
              <strong>Ataque Poderoso:</strong> -{Math.abs(combat.power_attack_option.attack_penalty)} ataque para +{combat.power_attack_option.damage_bonus} dano
            </div>
          )}
          {combat.double_spell_range && (
            <div className={styles.specialRuleItem}>
              <strong>Alcance de Magia:</strong> Dobra o alcance de magias de ataque
            </div>
          )}
          {combat.bonus_action_attack && (
            <div className={styles.specialRuleItem}>
              <strong>Ataque Bônus:</strong> Ataque adicional com ação bônus
            </div>
          )}
        </div>
      );
    };

    const renderDefenseRules = () => {
      const defense = specialRules.defense || {};
      if (Object.keys(defense).length === 0) return null;

      return (
        <div className={styles.specialRule}>
          <div className={styles.specialRuleTitle}>🛡️ Modificadores de Defesa</div>
          {defense.reaction_ac_bonus && (
            <div className={styles.specialRuleItem}>
              <strong>CA com Reação:</strong> +{defense.reaction_ac_bonus} CA
            </div>
          )}
          {defense.shield_master_reaction && (
            <div className={styles.specialRuleItem}>
              <strong>Escudo:</strong> Reação para reduzir dano
            </div>
          )}
          {defense.damage_resistance && (
            <div className={styles.specialRuleItem}>
              <strong>Resistência:</strong> Resistência a {defense.damage_resistance.join(', ')}
            </div>
          )}
        </div>
      );
    };

    const renderDiceRules = () => {
      const dice = specialRules.dice || {};
      if (Object.keys(dice).length === 0) return null;

      return (
        <div className={styles.specialRule}>
          <div className={styles.specialRuleTitle}>🎲 Modificadores de Dados</div>
          {dice.luck_points && (
            <div className={styles.specialRuleItem}>
              <strong>Pontos de Sorte:</strong> {dice.luck_points.points} pontos (recupera em {dice.luck_points.recovery})
            </div>
          )}
          {dice.damage_reroll && (
            <div className={styles.specialRuleItem}>
              <strong>Rerrolar Dano:</strong> {dice.damage_reroll.frequency} por turno
            </div>
          )}
          {dice.hit_points_per_level && (
            <div className={styles.specialRuleItem}>
              <strong>PV:</strong> +{dice.hit_points_per_level.bonus_per_level} PV por nível
            </div>
          )}
        </div>
      );
    };

    const renderEquipmentRules = () => {
      const equipment = specialRules.equipment || {};
      if (Object.keys(equipment).length === 0) return null;

      return (
        <div className={styles.specialRule}>
          <div className={styles.specialRuleTitle}>⚔️ Modificadores de Equipamento</div>
          {equipment.equipment_ac_bonus && (
            <div className={styles.specialRuleItem}>
              <strong>CA:</strong> +{equipment.equipment_ac_bonus.bonus} CA ({equipment.equipment_ac_bonus.condition})
            </div>
          )}
          {equipment.ignore_weapon_property && (
            <div className={styles.specialRuleItem}>
              <strong>Propriedade de Arma:</strong> Ignora {equipment.ignore_weapon_property.property}
            </div>
          )}
          {equipment.remove_weapon_restriction && (
            <div className={styles.specialRuleItem}>
              <strong>Restrição de Arma:</strong> Remove limitação de {equipment.remove_weapon_restriction}
            </div>
          )}
        </div>
      );
    };

    const renderMagicRules = () => {
      const magic = specialRules.magic || {};
      if (Object.keys(magic).length === 0) return null;

      return (
        <div className={styles.specialRule}>
          <div className={styles.specialRuleTitle}>🧙‍♂️ Modificadores de Magia</div>
          {magic.somatic_with_hands_full && (
            <div className={styles.specialRuleItem}>
              <strong>Componentes Somáticos:</strong> Pode fazer com mãos ocupadas
            </div>
          )}
          {magic.spell_as_oa && (
            <div className={styles.specialRuleItem}>
              <strong>Magia como OA:</strong> Conjura magia de {magic.spell_as_oa.spell_action} como reação
            </div>
          )}
          {magic.learn_cantrip && (
            <div className={styles.specialRuleItem}>
              <strong>Cantrip:</strong> Aprende cantrip de {magic.learn_cantrip.type}
            </div>
          )}
          {magic.ritual_book && (
            <div className={styles.specialRuleItem}>
              <strong>Livro de Rituais:</strong> {magic.ritual_book.count} rituais de {magic.ritual_book.level}º nível
            </div>
          )}
          {magic.cast_known_spell_without_slot && (
            <div className={styles.specialRuleItem}>
              <strong>Conjuração Especial:</strong> {magic.cast_known_spell_without_slot.uses}x por {magic.cast_known_spell_without_slot.recovery}
            </div>
          )}
        </div>
      );
    };

    const renderUtilityRules = () => {
      const utility = specialRules.utility || {};
      if (Object.keys(utility).length === 0) return null;

      return (
        <div className={styles.specialRule}>
          <div className={styles.specialRuleTitle}>🛠️ Modificadores de Utilidade</div>
          {utility.create_cipher && (
            <div className={styles.specialRuleItem}>
              <strong>Criptografia:</strong> Cria cifras escritas
            </div>
          )}
        </div>
      );
    };

    const renderHealingRules = () => {
      const healing = specialRules.healing || {};
      if (Object.keys(healing).length === 0) return null;

      return (
        <div className={styles.specialRule}>
          <div className={styles.specialRuleTitle}>💚 Modificadores de Cura</div>
          {healing.healers_kit_stabilize_plus_1hp && (
            <div className={styles.specialRuleItem}>
              <strong>Estabilização:</strong> Kit de primeiros socorros restaura 1 PV
            </div>
          )}
          {healing.healers_kit_restore_hp_action && (
            <div className={styles.specialRuleItem}>
              <strong>Cura de Emergência:</strong> Ação para curar com kit
            </div>
          )}
        </div>
      );
    };

    const renderTemporaryHpRules = () => {
      const tempHp = specialRules.temporary_hp || {};
      if (Object.keys(tempHp).length === 0) return null;

      return (
        <div className={styles.specialRule}>
          <div className={styles.specialRuleTitle}>💪 Modificadores de PV Temporários</div>
          {tempHp.grant_temp_hp_after_speech && (
            <div className={styles.specialRuleItem}>
              <strong>Discurso Inspirador:</strong> Concede PV temporários após discurso
            </div>
          )}
        </div>
      );
    };

    const renderExplorationRules = () => {
      const exploration = specialRules.exploration || {};
      if (Object.keys(exploration).length === 0) return null;

      return (
        <div className={styles.specialRule}>
          <div className={styles.specialRuleTitle}>🗺️ Modificadores de Exploração</div>
          {exploration.trap_search_no_slowdown && (
            <div className={styles.specialRuleItem}>
              <strong>Busca de Armadilhas:</strong> Pode procurar em ritmo normal
            </div>
          )}
        </div>
      );
    };

    const blocks = [
      renderMovementRules(),
      renderCombatRules(),
      renderDefenseRules(),
      renderDiceRules(),
      renderEquipmentRules(),
      renderMagicRules(),
      renderUtilityRules(),
      renderHealingRules(),
      renderTemporaryHpRules(),
      renderExplorationRules(),
    ].filter(Boolean);

    if (blocks.length === 0) return null;

    return (
      <div className={styles.specialRulesContainer}>
        <div className={styles.specialRulesTitle}>✨ Efeitos Especiais</div>
        <div className={styles.specialRulesGrid}>
          {blocks}
        </div>
      </div>
    );
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

      {/* Feat Description & Features moved below with normalization */}

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
                  <strong>Cantrips selecionados:</strong> {(localChoices.cantrips || []).map((c)=> (c?.name || c)).join(', ')}
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
                  <strong>Magias selecionadas:</strong> {(localChoices.spells || []).map((s)=> (s?.name || s)).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Skills or Tools Choice (Perito) */}
      {currentRules.skills_or_tools && (
        <div className={styles.choiceField}>
          <label className={styles.label}>
            Escolha {currentRules.skills_or_tools.amount} opção(ões) de perícia ou ferramenta:
          </label>
          <Select
            multiselect
            placeholder={`Escolha até ${currentRules.skills_or_tools.amount}`}
            options={getSkillsOrToolsOptions()}
            value={localChoices.skills_or_tools || []}
            onChange={(val) => handleChoiceChange('skills_or_tools', (val || []).slice(0, currentRules.skills_or_tools.amount))}
          />
          {Array.isArray(localChoices.skills_or_tools) && localChoices.skills_or_tools.length > 0 && (
            <div className={styles.choiceSummary}>
              <strong>Selecionados:</strong> {(localChoices.skills_or_tools || []).map(v => v?.name || v).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Maneuvers (ex.: Adepto Marcial) */}
      {maneuversConf && (
        <div className={styles.choiceField}>
          <label className={styles.label}>
            Escolha {maneuversConf.choose} manobra(s):
          </label>
          <Select
            multiselect
            placeholder={`Escolha até ${maneuversConf.choose} manobras`}
            options={maneuversConf.options}
            value={localChoices.maneuvers || []}
            onChange={(val) => handleChoiceChange('maneuvers', (val || []).slice(0, maneuversConf.choose))}
          />
          {Array.isArray(localChoices.maneuvers) && localChoices.maneuvers.length > 0 && (
            <div className={styles.choiceSummary}>
              <strong>Manobras selecionadas:</strong> {(localChoices.maneuvers || []).map(m => (m?.name || m?.id || m)).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Special Rules Display */}
      {renderSpecialRules()}

      {/* Description and Features */}
      {/* Normalized description text */}
      {feat.description && (
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Descrição</div>
          <div className={styles.featDescriptionText}>{feat.description}</div>
        </div>
      )}

      {/* Feature block: support string/object/array gracefully */}
      {feat.features && (() => {
        let features = feat.features;
        if (typeof features === 'string') {
          try { features = JSON.parse(features); } catch(_) {
            try { features = JSON.parse(features.replace(/=>/g, ':')); } catch(_) {}
          }
        }
        const renderFeature = (obj, idx = 0) => (
          <div key={idx} className={styles.featFeature}>
            {obj?.name && <div className={styles.featFeatureName}>{obj.name}</div>}
            {(obj?.desc || obj?.description) && (
              <div className={styles.featFeatureDesc}>{obj.desc || obj.description}</div>
            )}
          </div>
        );
        if (features && typeof features === 'object' && !Array.isArray(features)) {
          return (
            <div className={styles.panel}>
              <div className={styles.panelTitle}>Benefícios</div>
              {renderFeature(features)}
            </div>
          );
        }
        if (Array.isArray(features) && features.length > 0) {
          return (
            <div className={styles.panel}>
              <div className={styles.panelTitle}>Benefícios</div>
              {features.map((f, i) => renderFeature(f, i))}
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
};

export default FeatChoices;
