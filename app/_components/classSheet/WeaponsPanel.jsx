"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../UI/Card";
import Select from "../UI/Select";
import Badge from "../UI/Badge";
import Tooltip from "../UI/Tooltip";
import Popover from "../UI/Popover";
import { Dialog, DialogHeader, DialogTitle, DialogContent } from "../UI/Dialog";
import styles from "../../_styles/character/CharacterForm.module.css";
import { apiClient } from "../../_lib/api/client";
import { useToast } from "../../_context/ToastContext";

function abilityMod(abilities = [], abbr = 'DES') {
  const row = abilities.find((x) => String(x.a).toUpperCase() === String(abbr).toUpperCase());
  return Number(row?.m || 0);
}

function formatSigned(n) { return (n >= 0 ? `+${n}` : `${n}`); }

export default function WeaponsPanel({ summary = {}, abilities = [], sheetItemsApi = null, sheetId = null, onChanged = null }) {
  const toast = useToast();
  const [availableWeapons, setAvailableWeapons] = useState([]);
  const [availableArmors, setAvailableArmors] = useState([]);
  const [availableShields, setAvailableShields] = useState([]);
  const [availableAmmunition, setAvailableAmmunition] = useState([]);
  const [availableMagicItems, setAvailableMagicItems] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('weapons');
  const [activeTab, setActiveTab] = useState('equipped');
  const [invFilter, setInvFilter] = useState('all');
  const [detailItem, setDetailItem] = useState(null); // legado (não usado)
  const [showDetailModal, setShowDetailModal] = useState(false); // legado (não usado)
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [popoverItem, setPopoverItem] = useState(null);
  const equipDetailCacheRef = useRef({});

  const equip = summary?.equipment?.equipped || {};
  const mh = equip?.main_hand || null;
  const oh = equip?.off_hand || null;
  const armor = equip?.armor || null;
  const shield = equip?.shield || null;
  const mods = summary?.equipment?.mods || {};
  const profBonus = Number(summary?.prof_bonus || 0);
  const profs = (summary?.proficiencies?.weapons || []).map((w) => String(w).toLowerCase());
  const armorProfs = (summary?.proficiencies?.armor || []).map((a) => String(a).toLowerCase());

  // Normalização canônica de proficiências
  const weaponProfs = useMemo(() => {
    const map = (s) => {
      const t = String(s || '').toLowerCase();
      if (t.includes('simples') || t.includes('simple')) return 'simple';
      if (t.includes('marciais') || t.includes('martial')) return 'martial';
      return t;
    };
    return new Set((summary?.proficiencies?.weapons || []).map(map));
  }, [summary]);

  const armorProfsSet = useMemo(() => {
    const map = (s) => {
      const t = String(s || '').toLowerCase();
      if (t.includes('leve') || t.includes('light')) return 'light';
      if (t.includes('média') || t.includes('media') || t.includes('medium')) return 'medium';
      if (t.includes('pesad') || t.includes('heavy')) return 'heavy';
      if (t.includes('escudo') || t.includes('shield')) return 'shields';
      return t;
    };
    return new Set((summary?.proficiencies?.armor || []).map(map));
  }, [summary]);
  const inventory = Array.isArray(summary?.equipment?.inventory) ? summary.equipment.inventory : [];
  const inventoryWeapons = inventory.filter((it) => String(it?.category || '').toLowerCase().includes('weapon'));
  const inventoryArmors = inventory.filter((it) => String(it?.category || '').toLowerCase().includes('armor'));
  const inventoryShields = inventory.filter((it) => String(it?.category || '').toLowerCase().includes('shield'));
  const inventoryAmmunition = inventory.filter((it) => String(it?.category || '').toLowerCase().includes('ammunition'));
  const classNameLower = String(summary?.class_summary?.name || '').toLowerCase();

  // Helper para buscar detalhes de um item de equipamento com cache simples
  const fetchEquipDetail = useCallback(async (idx) => {
    const key = String(idx || '').toLowerCase();
    if (equipDetailCacheRef.current[key]) return equipDetailCacheRef.current[key];
    const res = await apiClient.get(`/api/v1/public/equipment/${key}`);
    const row = res || res;
    equipDetailCacheRef.current[key] = row;
    return row;
  }, []);

  // Função otimizada para carregar equipamentos com paginação
  const loadEquipmentByCategory = useCallback(async (category, page = 1) => {
    try {
      const response = await apiClient.get(`/api/v1/public/equipment_list/${category}?page=${page}`);
      const { equipment, pagination: paginationData } = response;
      
      // Mapear os dados para o formato esperado
      const mappedEquipment = equipment.map(item => {
        // Definir categoria correta baseada no tipo de equipamento
        let category = 'Equipment';
        if (item.weapon_category) {
          category = 'weapon';
        } else if (item.armor_category === 'Shield') {
          category = 'shield';
        } else if (item.armor_category) {
          category = 'armor';
        } else if (item.gear_category?.name === 'Ammunition') {
          category = 'ammunition';
        }

        return {
          index: item.index,
          name: item.name,
          category: category,
          weapon_category: item.weapon_category || null,
          armor_category: item.armor_category || null,
          damage: item.damage?.damage_dice || item.damage_dice || '1d6',
          damage_type: item.damage?.damage_type?.name || 'slashing',
          armor_class: item.armor_class?.base || item.armor_class || '11',
          properties: Array.isArray(item.properties) ? item.properties.map(p => p.name || p.index || p) : [],
          weight: item.weight || '1 lb',
          cost: item.cost || '1 gp',
          rarity: item.rarity,
          requires_attunement: item.requires_attunement,
          description: item.description
        };
      });
      
      return { equipment: mappedEquipment, pagination: paginationData };
    } catch (error) {
      console.error(`Erro ao carregar equipamentos da categoria ${category}:`, error);
      return { equipment: [], pagination: {} };
    }
  }, []);

  // Carregar equipamentos disponíveis do banco de dados local
  const loadAvailableEquipment = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar armas (simples + marciais)
      const [simpleWeapons, martialWeapons] = await Promise.all([
        loadEquipmentByCategory('simple-weapons'),
        loadEquipmentByCategory('martial-weapons')
      ]);
      
      const allWeapons = [...simpleWeapons.equipment, ...martialWeapons.equipment];
      setAvailableWeapons(allWeapons);

      // Carregar armaduras
      const armorsData = await loadEquipmentByCategory('armor');
      setAvailableArmors(armorsData.equipment);

      // Carregar escudos
      const shieldsData = await loadEquipmentByCategory('shields');
      setAvailableShields(shieldsData.equipment);

      // Carregar munições
      const ammoData = await loadEquipmentByCategory('ammunition');
      setAvailableAmmunition(ammoData.equipment);

      // Carregar itens mágicos do banco de dados local
      try {
        const magicItemsResponse = await apiClient.get('/api/v1/public/magic_items');
        const magicItems = magicItemsResponse?.magic_items || [];
        
        const magicItemDetails = magicItems.map(item => ({
          index: item.slug || item.id,
          name: item.name,
          category: item.category || 'Magic Item',
          rarity: item.rarity || 'common',
          requires_attunement: item.requires_attunement || false,
          cost: item.value_gp ? `${item.value_gp} gp` : 'Varies',
          weight: item.weight_kg ? `${item.weight_kg} kg` : 'Varies',
          description: item.description || '',
          properties: item.properties || {}
        }));
        
        setAvailableMagicItems(magicItemDetails);
      } catch (error) {
        console.error('Erro ao carregar itens mágicos do banco de dados:', error);
        setAvailableMagicItems([]);
      }

    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailableEquipment();
  }, [loadAvailableEquipment]);

  // Função para carregar equipamentos com paginação
  const loadEquipmentWithPagination = useCallback(async (category, page = 1) => {
    setLoading(true);
    try {
      const data = await loadEquipmentByCategory(category, page);
      setPagination(data.pagination);
      setCurrentPage(page);
      
      // Atualizar o estado baseado na categoria
      switch (category) {
        case 'simple-weapons':
        case 'martial-weapons':
          setAvailableWeapons(data.equipment);
          break;
        case 'armor':
          setAvailableArmors(data.equipment);
          break;
        case 'shields':
          setAvailableShields(data.equipment);
          break;
        case 'ammunition':
          setAvailableAmmunition(data.equipment);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos com paginação:', error);
    } finally {
      setLoading(false);
    }
  }, [loadEquipmentByCategory]);

  // Garante carregar catálogos quando abrir o modal (e ao trocar de aba)
  useEffect(() => {
    if (showAddModal) {
      loadAvailableEquipment();
    }
  }, [showAddModal, selectedCategory, loadAvailableEquipment]);

  // Categorizar itens do inventário
  const categorizeItem = useCallback((it) => {
    const cat = String(it?.category || '').toLowerCase();
    const name = String(it?.item_name || it?.name || '').toLowerCase();
    if (cat.includes('weapon')) return 'weapons';
    if (cat.includes('shield')) return 'shields';
    if (cat.includes('armor')) return 'armor';
    if (cat.includes('ammunition') || name.includes('flecha') || name.includes('muni')) return 'ammunition';
    if (name.includes('poção') || name.includes('pocao') || cat.includes('potion')) return 'potions';
    if (name.includes('pergaminho') || cat.includes('scroll')) return 'scrolls';
    if (name.includes('livro') || cat.includes('book')) return 'books';
    if (cat.includes('tool') || name.includes('ferramenta')) return 'tools';
    return 'other';
  }, []);

  const invCategories = ['all','weapons','armor','shields','ammunition','potions','scrolls','books','tools','other'];

  // Função para adicionar item ao inventário
  const addItemToInventory = useCallback(async (itemIndex, itemName, category, properties = null, quantity = 1, detail = null) => {
    if (!sheetItemsApi || !sheetId) return;

    try {
      // Mapear lista de propriedades (strings) para props_json com flags conhecidas
      const props_json = Array.isArray(properties) ? (() => {
        const set = new Set(properties.map((p) => String(p).toLowerCase()));
        return {
          light: set.has('light') || set.has('leve'),
          finesse: set.has('finesse') || set.has('finese'),
          versatile: set.has('versatile') || set.has('versátil') || set.has('versatil'),
          two_handed: set.has('two-handed') || set.has('duas-mãos') || set.has('duas maos'),
          thrown: set.has('thrown') || set.has('arremesso'),
          ammunition: set.has('ammunition') || set.has('munição') || set.has('municao'),
          loading: set.has('loading'),
          reach: set.has('reach') || set.has('alongada'),
          special: set.has('special')
        };
      })() : null;

      // Enriquecer com peso (lb) quando disponível
      const withWeight = { ...(props_json || {}) };
      const weightVal = detail?.weight ?? detail?.props?.weight ?? null;
      if (weightVal !== null && weightVal !== undefined) {
        if (typeof weightVal === 'number') {
          // DnD 5e API reports weight in lb when numeric
          withWeight.weight_kg = (Number(weightVal) * 0.45359237);
          withWeight.weight = `${weightVal} lb`;
        } else {
          const s = String(weightVal);
          const mk = s.match(/([0-9]+(?:\.[0-9]+)?)\s*kg/i);
          const mlb = s.match(/([0-9]+(?:\.[0-9]+)?)\s*lb/i);
          if (mk) withWeight.weight_kg = parseFloat(mk[1]);
          else if (mlb) withWeight.weight_kg = (parseFloat(mlb[1]) * 0.45359237);
          withWeight.weight = s;
        }
      }

      await sheetItemsApi.create({
        sheet_id: sheetId,
        item_index: itemIndex,
        item_name: itemName,
        category: category,
        props_json: withWeight,
        quantity: quantity
      });
      
      if (onChanged) onChanged();
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    }
  }, [sheetItemsApi, sheetId, onChanged]);

  const showApiError = (err, fallback = 'Operação falhou') => {
    try {
      const msg = err?.response?.data?.errors?.join?.(', ') || err?.response?.data?.error || err?.message || fallback;
      toast.error(msg);
    } catch (_) {
      toast.error(fallback);
    }
  };

  // Função para remover item do inventário
  const removeItemFromInventory = useCallback(async (itemId) => {
    if (!sheetItemsApi) return;

    try {
      await sheetItemsApi.destroy(itemId);
      if (onChanged) onChanged();
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  }, [sheetItemsApi, onChanged]);

  // Consumir item: reduz quantidade e apaga se chegar a zero
  const consumeItem = useCallback(async (item, qty = 1) => {
    if (!sheetItemsApi || !item?.id) return;
    const q = Math.max(1, Math.min(Number(qty)||1, Number(item.quantity||1)));
    try {
      const next = Math.max(0, Number(item.quantity || 1) - q);
      if (next === 0) {
        await sheetItemsApi.destroy(item.id);
      } else {
        await sheetItemsApi.update(item.id, { quantity: next });
      }
      if (onChanged) onChanged();
      toast.success(`Consumiu ${q}x ${item.item_name || item.name}`);
    } catch (e) {
      showApiError(e, 'Falha ao consumir item');
    }
  }, [sheetItemsApi, onChanged]);

  // Função para equipar item
  const equipItem = useCallback(async (itemId, slot, props = null) => {
    try {
      await apiClient.post(`/api/v1/player/sheet_items/${itemId}/equip`, { slot, props_json: props });
      if (onChanged) onChanged();
    } catch (error) {
      console.error('Erro ao equipar item:', error);
    }
  }, [onChanged]);

  // Função para desequipar item
  const unequipItem = useCallback(async (itemId) => {
    try {
      await apiClient.post(`/api/v1/player/sheet_items/${itemId}/unequip`);
      if (onChanged) onChanged();
    } catch (error) {
      console.error('Erro ao desequipar item:', error);
    }
  }, [onChanged]);

  // Helpers de propriedades e regras
  const hasProp = (item, key) => {
    const k = String(key).toLowerCase();
    const fromList = (item?.properties || []).map((p) => String(p).toLowerCase()).includes(k);
    const wp = item?.weapon_props || {};
    // map supported flags to weapon_props keys
    const map = {
      'two-handed': 'hands',
      'light': 'light',
      'finesse': 'finesse',
      'versatile': 'versatile',
      'thrown': 'thrown',
      'ammunition': 'ammunition',
      'loading': 'loading',
      'reach': 'reach',
      'special': 'special'
    };
    const keyWP = map[k];
    const fromWP = keyWP ? (keyWP === 'hands' ? (Number(wp?.hands) === 2) : !!wp?.[keyWP]) : false;
    return fromList || fromWP;
  };

  const isTwoHanded = (weapon) => {
    const wp = weapon?.weapon_props || {};
    return (Number(wp?.hands) === 2) || hasProp(weapon, 'two-handed') || weapon?.two_handed;
  };
  const isLight = (weapon) => {
    const wp = weapon?.weapon_props || {};
    return !!wp?.light || hasProp(weapon, 'light') || weapon?.light;
  };

  const isWeaponProficient = (weapon) => {
    const cat = String(weapon?.weapon_category || weapon?.weapon_props?.category || '').toLowerCase();
    if (cat && weaponProfs.has(cat)) return true;
    // opcional: proficiência por arma específica (nome)
    const nm = String(weapon?.item_name || weapon?.name || '').toLowerCase();
    return weaponProfs.has(nm);
  };

  const isArmorProficient = (armorItem) => {
    const isShield = String(armorItem?.category || '').toLowerCase().includes('shield');
    if (isShield) return armorProfsSet.has('shields');
    const cat = String(armorItem?.armor_category || '').toLowerCase(); // 'light'|'medium'|'heavy'
    return armorProfsSet.has(cat);
  };

  // Ajuda de propriedades para tooltips
  const propertyHelp = useCallback((key) => {
    const k = String(key || '').toLowerCase();
    const map = {
      'light': 'Arma leve; adequada para combate com duas armas.',
      'finesse': 'Você pode usar FOR ou DES para ataques e dano, escolhendo o maior modificador.',
      'versatile': 'Pode ser usada com duas mãos para um dado de dano maior.',
      'thrown': 'Pode ser arremessada; usa DES para ataques à distância.',
      'ammunition': 'Requer munição apropriada para disparar.',
      'loading': 'Você só pode disparar 1 munição quando usá-la em uma ação/ação bônus/reação.',
      'reach': 'Aumenta o alcance de ataques corpo-a-corpo para 10 pés.',
      'special': 'Possui regras especiais; consulte a descrição da arma.',
      'two-handed': 'Requer duas mãos para atacar.',
      'heavy': 'Criaturas pequenas têm desvantagem em ataques com armas pesadas.'
    };
    return map[k] || '—';
  }, []);

  const canEquipToOffHand = (weapon) => {
    if (!weapon) return false;
    if (!isLight(weapon)) return false; // regra básica: arma de mão secundária deve ser leve
    if (mh && isTwoHanded(mh)) return false; // não pode off-hand com arma 2mão na principal
    return true;
  };

  const canEquipShield = () => {
    if (mh && isTwoHanded(mh)) return false;
    return true;
  };

  // Equip logic com regras simples e desarmes automáticos
  const handleEquipWeapon = useCallback(async (weaponItem, slot, opts = {}) => {

    console.log('handleEquipWeapon', weaponItem, slot, opts);
    if (!weaponItem?.id) return;
    const prof = isWeaponProficient(weaponItem);
    // Permitir equipar sem proficiência: sem bônus de proficiência ao atacar
    console.log('handleEquipWeapon', weaponItem, slot, opts);
    if (slot === 'off_hand' && !canEquipToOffHand(weaponItem)) {
      toast.warning('Não é possível equipar na mão secundária (requer arma leve e mão principal não pode ser de duas mãos).');
      return;
    }

    // Se arma de duas mãos na principal, desequipa off_hand e escudo
    const wantsTwoHands = !!opts.using_two_hands;
    if (slot === 'main_hand' && (isTwoHanded(weaponItem) || wantsTwoHands)) {
      try {
        if (oh?.id) await apiClient.post(`/api/v1/player/sheet_items/${oh.id}/unequip`);
        if (shield?.id) await apiClient.post(`/api/v1/player/sheet_items/${shield.id}/unequip`);
      } catch (e) { console.warn(e); }
    }

    try {
      // Se equipando na off_hand, garante que não haja escudo no slot
      if (slot === 'off_hand' && shield?.id) {
        await apiClient.post(`/api/v1/player/sheet_items/${shield.id}/unequip`);
      }
      // Se equipando na principal e escolhendo usar 2 mãos numa arma versátil, persiste flag no props_json
      if (slot === 'main_hand' && wantsTwoHands) {
        const currentProps = weaponItem.props || {};
        await equipItem(weaponItem.id, slot, { ...currentProps, using_two_hands: true });
      } else {
        await equipItem(weaponItem.id, slot);
      }
    } catch (e) {
      console.error(e);
      showApiError(e, 'Não foi possível equipar a arma');
    }
  }, [equipItem, isWeaponProficient, canEquipToOffHand, isTwoHanded, oh, shield, sheetItemsApi]);

  const handleEquipArmor = useCallback(async (armorItem) => {
    if (!armorItem?.id) return;
    const prof = isArmorProficient(armorItem);
    if (!prof) { toast.warning('Sem proficiência com esta armadura.'); return; }
    // Avisos de classes com defesa sem armadura
    if (classNameLower.includes('barbar') || classNameLower.includes('monge') || classNameLower.includes('monk')) {
      console.info('Aviso: Armadura pode substituir a Defesa Sem Armadura do Bárbaro/Monge.');
    }
    try {
      if (armor?.id && armor?.id !== armorItem.id) {
        await apiClient.post(`/api/v1/player/sheet_items/${armor.id}/unequip`);
      }
      await equipItem(armorItem.id, 'armor');
    } catch (e) { console.error(e); showApiError(e, 'Não foi possível equipar a armadura'); }
  }, [armor, classNameLower, equipItem, isArmorProficient]);

  const handleEquipShield = useCallback(async (shieldItem) => {
    if (!shieldItem?.id) return;
    if (!canEquipShield()) { toast.warning('Não é possível equipar escudo com arma de duas mãos equipada.'); return; }
    const prof = armorProfs.some((p) => p.includes('shield') || p.includes('escudo'));
    if (!prof) { toast.warning('Sem proficiência em escudos.'); return; }
    try {
      // Deseat off-hand se estiver usando como escudo
      if (oh?.id && oh?.slot === 'off_hand') {
        await apiClient.post(`/api/v1/player/sheet_items/${oh.id}/unequip`);
      }
      if (shield?.id && shield?.id !== shieldItem.id) {
        await apiClient.post(`/api/v1/player/sheet_items/${shield.id}/unequip`);
      }
      await equipItem(shieldItem.id, 'shield');
    } catch (e) { console.error(e); showApiError(e, 'Não foi possível equipar o escudo'); }
  }, [armorProfs, canEquipShield, equipItem, oh, shield]);

  // Função para renderizar arma
  const renderWeapon = useCallback((weapon, slot) => {
    if (!weapon) return null;

    const isMainHand = slot === 'main_hand';
    const isOffHand = slot === 'off_hand';
    const isTwoHanded = weapon.properties?.includes('two-handed') || weapon.two_handed;
    const isLight = weapon.properties?.includes('light') || weapon.light;
    const isFinesse = weapon.properties?.includes('finesse') || weapon.finesse;
    const isThrown = weapon.properties?.includes('thrown') || weapon.thrown;
    const isVersatile = weapon.properties?.includes('versatile') || weapon.versatile || weapon?.weapon_props?.versatile;
    const isAmmunition = weapon.properties?.includes('ammunition') || weapon.ammunition;
    const isLoading = weapon.properties?.includes('loading') || weapon.loading;
    const isReach = weapon.properties?.includes('reach') || weapon.reach;
    const isSpecial = weapon.properties?.includes('special') || weapon.special;
    const isHeavy = weapon?.weapon_props?.heavy || weapon.properties?.includes('heavy') || weapon.heavy;

    const weaponName = weapon.name || weapon.item_name || 'Arma Desconhecida';
    const weaponDamage = weapon?.weapon_props?.damage_die || weapon.damage || '1d4';
    const versatileDie = weapon?.weapon_props?.versatile ? (weapon?.weapon_props?.versatile_die || weapon.versatile_die) : null;
    const weaponDamageType = weapon.damage_type || 'bludgeoning';
    const weaponRange = weapon.range || '5 ft.';
    const weaponLongRange = weapon.long_range || null;
    const weaponCost = weapon.cost || '1 gp';
    const weaponWeight = weapon.weight || '1 lb';
    const usingTwoHands = !!(weapon?.props?.using_two_hands);
    const propList = (() => {
      const wp = weapon?.weapon_props || {};
      const acc = [];
      if (Number(wp?.hands) === 2) acc.push('two-handed');
      ['light','finesse','versatile','thrown','ammunition','loading','reach','special'].forEach((k)=>{ if (wp?.[k]) acc.push(k); });
      return acc;
    })();

    // Calcular modificador de ataque
    let attackMod = 0;
    if (isFinesse) {
      attackMod = Math.max(abilityMod(abilities, 'FOR'), abilityMod(abilities, 'DES'));
    } else if (isAmmunition) {
      attackMod = abilityMod(abilities, 'DES');
    } else {
      attackMod = abilityMod(abilities, 'FOR');
    }
    console.log('profs', profs)
    console.log('weapon.category', weapon.category)
    console.log('weaponName', weaponName)
    const isProficient = profs.some(prof => (
      (weapon.category || '').toLowerCase().includes(prof) ||
      (weaponName || '').toLowerCase().includes(prof)
    ));
    if (isProficient) attackMod += profBonus;

    // Calcular modificador de dano
    let damageMod = 0;
    if (isFinesse) {
      damageMod = Math.max(abilityMod(abilities, 'FOR'), abilityMod(abilities, 'DES'));
    } else if (isAmmunition) {
      damageMod = abilityMod(abilities, 'DES');
    } else {
      damageMod = abilityMod(abilities, 'FOR');
    }

    // Verificar proficiência (já calculado acima)

    // Race size heurística: pequeno => halfling/gnome/pequen
    const raceName = String(summary?.sheet?.race?.name || '').toLowerCase();
    const isSmallRace = /(halfling|gnome|gnomo|pequen)/.test(raceName);

    return (
      <div className={styles.panel} style={{ marginBottom: 12 }}>
        <div className={styles.panelHeader} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6, marginBottom: 4 }}>
          <div className={styles.panelTitle} style={{ marginBottom: 0 }}>{weaponName}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {!isProficient && (
                <Tooltip content="Você pode usar a arma, mas não adiciona o bônus de proficiência aos ataques."><Badge data-variant="warning" style={{ borderWidth: 1, padding: '2px 8px', fontSize: 11 }}>Sem proficiência (sem bônus)</Badge></Tooltip>
              )}
              {isHeavy && isSmallRace && (
                <Tooltip content="Criaturas Pequenas têm desvantagem em jogadas de ataque com armas Pesadas."><Badge data-variant="warning" style={{ borderWidth: 1, padding: '2px 8px', fontSize: 11 }}>Desvantagem (Arma pesada)</Badge></Tooltip>
              )}
            </div>
            <div>
              <button 
                type="button" 
                className={styles.stepTab} 
                onClick={() => unequipItem(weapon.id)}
                style={{ fontSize: '12px', padding: '4px 8px', minWidth: 'auto' }}
              >
                ❌ Desequipar
              </button>
            </div>
          </div>
        </div>

        {/* Ações: Ataque, Dano e 2 mãos */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={styles.stepTab}
            title="Enviar rolagem de ataque para o chat"
            onClick={() => {
              try {
                const detail = {
                  modifier: Number(attackMod) || 0,
                  apply_fighting_style: true,
                  weapon_side: isOffHand ? 'off' : 'main',
                  kind: 'attack',
                  text: `${weaponName}: Ataque ${formatSigned(attackMod)}`
                };
                window?.dispatchEvent && window.dispatchEvent(new CustomEvent('chat:roll', { detail }));
              } catch (e) { console.warn(e); }
            }}
            style={{ fontSize: '12px', padding: '4px 8px', minWidth: 'auto' }}
          >🎲 Ataque</button>
          <button
            type="button"
            className={styles.stepTab}
            title="Enviar rolagem de dano para o chat"
            onClick={() => {
              try {
                const die = (usingTwoHands && versatileDie) ? versatileDie : (weaponDamage || '1d4');
                const dstr = String(die).toLowerCase();
                const base = dstr.startsWith('1d') ? dstr.slice(2) : dstr.replace('d','');
                const cmd = `!d${base}${damageMod ? `${damageMod>=0?'+':''}${damageMod}` : ''}`;
                const detail = {
                  command: cmd,
                  apply_fighting_style: true,
                  weapon_side: isOffHand ? 'off' : 'main',
                  kind: 'damage',
                  text: `${weaponName}: Dano ${die}${damageMod?` ${formatSigned(damageMod)}`:''}`
                };
                window?.dispatchEvent && window.dispatchEvent(new CustomEvent('chat:roll', { detail }));
              } catch (e) { console.warn(e); }
            }}
            style={{ fontSize: '12px', padding: '4px 8px', minWidth: 'auto' }}
          >💥 Dano</button>
          {isMainHand && isVersatile && (
            <label className={styles.small} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={usingTwoHands}
                onChange={async (e) => {
                  try {
                    const cur = weapon.props || {};
                    const next = { ...cur };
                    if (e.target.checked) {
                      next.using_two_hands = true;
                      if (shield?.id) await apiClient.post(`/api/v1/player/sheet_items/${shield.id}/unequip`);
                      if (oh?.id) await apiClient.post(`/api/v1/player/sheet_items/${oh.id}/unequip`);
                    } else {
                      delete next.using_two_hands;
                    }
                    await apiClient.post(`/api/v1/player/sheet_items/${weapon.id}/equip`, { slot: 'main_hand', props_json: next });
                    if (onChanged) onChanged();
                  } catch (err) { console.error(err); }
                }}
                style={{ marginRight: 6 }}
              />
              Usar com 2 mãos
            </label>
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
          <div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Ataque:</strong> {formatSigned(attackMod)} ({weaponDamage} + {formatSigned(damageMod)})
            </div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Alcance:</strong> {weaponRange}{weaponLongRange ? `/${weaponLongRange}` : ''}
            </div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Dano:</strong> {weaponDamage} {weaponDamageType}
            </div>
          </div>
          
          <div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Custo:</strong> {weaponCost}
            </div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Peso:</strong> {weaponWeight}
            </div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Propriedades:</strong> 
            </div>
            {propList.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {propList.map((p) => (
                  <Tooltip key={p} content={propertyHelp(p)}>
                    <Badge data-variant="secondary" style={{ borderWidth: 1, padding: '2px 8px', fontSize: 11, textTransform: 'lowercase' }}>{p}</Badge>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [abilities, profBonus, profs, unequipItem]);

  // Função para renderizar armadura
  const renderArmor = useCallback((armorItem) => {
    if (!armorItem) return null;

    const armorName = armorItem.name || armorItem.item_name || 'Armadura Desconhecida';
    const armorClass = armorItem.armor_class || '10';
    const armorCost = armorItem.cost || '1 gp';
    const armorWeight = armorItem.weight || '1 lb';
    const armorCategory = armorItem.category || '';

    // Verificar proficiência
    const isProficient = armorProfs.some(prof => 
      armorCategory.toLowerCase().includes(prof) || 
      armorName.toLowerCase().includes(prof)
    );

    // Calcular CA baseada no tipo de armadura
    let calculatedAC = 10;
    if (armorClass.includes('+')) {
      const baseAC = parseInt(armorClass.split('+')[0]);
      const dexMod = abilityMod(abilities, 'DES');
      const maxDex = armorClass.includes('max') ? parseInt(armorClass.split('max')[1].split(')')[0]) : null;
      
      if (maxDex) {
        calculatedAC = baseAC + Math.min(dexMod, maxDex);
      } else {
        calculatedAC = baseAC + dexMod;
      }
    } else {
      calculatedAC = parseInt(armorClass);
    }

    const acInfo = summary?.equipment?.ac || {};
    return (
      <div className={styles.panel} style={{ marginBottom: 12 }}>
        <div className={styles.panelHeader} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6, marginBottom: 4 }}>
          <div className={styles.panelTitle} style={{ marginBottom: 0 }}>{armorName}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {!isProficient && (
                <Tooltip content="Você pode vestir, mas não tem proficiência com esta armadura."><Badge data-variant="warning" style={{ borderWidth: 1, padding: '2px 8px', fontSize: 11 }}>Sem proficiência</Badge></Tooltip>
              )}
              {!!acInfo.stealth_disadvantage && <Badge data-variant="warning" style={{ borderWidth: 1, padding: '2px 8px', fontSize: 11 }}>Desvantagem (Furtividade)</Badge>}
              {!!acInfo.speed_penalty && <Badge data-variant="warning" style={{ borderWidth: 1, padding: '2px 8px', fontSize: 11 }}>Penalidade de Deslocamento</Badge>}
            </div>
            <div>
              <button 
                type="button" 
                className={styles.stepTab} 
                onClick={() => unequipItem(armorItem.id)}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                ❌ Desequipar
              </button>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
          <div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Classe de Armadura:</strong> {calculatedAC}
            </div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Categoria:</strong> {armorCategory}
            </div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>CA Base:</strong> {armorClass}
            </div>
          </div>
          
          <div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Custo:</strong> {armorCost}
            </div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Peso:</strong> {armorWeight}
            </div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Propriedades:</strong> {armorItem.properties?.join(', ') || 'Nenhuma'}
            </div>
          </div>
        </div>
      </div>
    );
  }, [abilities, armorProfs, unequipItem]);

  // Função para renderizar escudo
  const renderShield = useCallback((shieldItem) => {
    if (!shieldItem) return null;

    const shieldName = shieldItem.name || shieldItem.item_name || 'Escudo Desconhecido';
    const shieldAC = shieldItem.armor_class || '+2';
    const shieldCost = shieldItem.cost || '10 gp';
    const shieldWeight = shieldItem.weight || '6 lb';

    // Verificar proficiência
    const isProficient = armorProfs.some(prof => 
      prof.includes('shield') || prof.includes('escudo')
    );

    return (
      <div className={styles.panel} style={{ marginBottom: 12 }}>
        <div className={styles.panelHeader} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6, marginBottom: 4 }}>
          <div className={styles.panelTitle} style={{ marginBottom: 0 }}>{shieldName}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {!isProficient && (
                <Tooltip content="Você pode usar, mas não tem proficiência com escudos."><Badge data-variant="warning" style={{ borderWidth: 1, padding: '2px 8px', fontSize: 11 }}>Sem proficiência</Badge></Tooltip>
              )}
            </div>
            <div>
              <button 
                type="button" 
                className={styles.stepTab} 
                onClick={() => unequipItem(shieldItem.id)}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                ❌ Desequipar
              </button>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
          <div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Bônus de CA:</strong> {shieldAC}
            </div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Custo:</strong> {shieldCost}
            </div>
          </div>
          
          <div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Peso:</strong> {shieldWeight}
            </div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Propriedades:</strong> {shieldItem.properties?.join(', ') || 'Nenhuma'}
            </div>
          </div>
        </div>
      </div>
    );
  }, [armorProfs, unequipItem]);

  // Função para renderizar item do inventário
  const renderInventoryItem = useCallback((item) => {
    const itemName = item.item_name || item.name || 'Item Desconhecido';
    const itemCategory = item.category || '';
    const itemQuantity = item.quantity || 1;
    const itemCost = item.cost || '1 gp';
    const itemWeight = item.weight || '1 lb';
    const toPropList = (it) => {
      if (Array.isArray(it?.properties) && it.properties.length > 0) return it.properties;
      const wp = it?.weapon_props || {};
      const list = [];
      if (Number(wp?.hands) === 2) list.push('two-handed');
      ['light','finesse','versatile','thrown','ammunition','loading','reach','special'].forEach((k) => { if (wp?.[k]) list.push(k); });
      return list;
    };
    const propList = toPropList(item);

    return (
      <div className={styles.panel} style={{ marginBottom: 8 }}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>{itemName} {itemQuantity > 1 ? `(x${itemQuantity})` : ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button 
              type="button" 
              className={styles.stepTab} 
              onClick={() => removeItemFromInventory(item.id)}
              style={{ fontSize: '12px', padding: '4px 8px', minWidth: 'auto' }}
            >
              ❌ Remover
            </button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
          <div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Categoria:</strong> {itemCategory}
            </div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Custo:</strong> {itemCost}
            </div>
          </div>
          
          <div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Peso:</strong> {itemWeight}
            </div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>Propriedades:</strong> {propList.length > 0 ? propList.join(', ') : 'Nenhuma'}
            </div>
          </div>
        </div>
      </div>
    );
  }, [removeItemFromInventory]);

  return (
    <>
    <Card disableHover bgVar="medium-hover" style={{ marginTop: 12}}>
      <CardHeader style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <CardTitle style={{ fontSize: 16, margin: 0 }}>Equipamentos</CardTitle>
        <button 
          type="button" 
          className={styles.stepTab} 
          onClick={() => setShowAddModal(true)}
          style={{ fontSize: '12px', padding: '4px 8px' }}
        >
          Adicionar Item
        </button>
              {/* Tabs de navegação (apenas duas abas) */}
      <div className={styles.stepTabs} style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={`${styles.stepTab} ${activeTab === 'equipped' ? styles.stepTabActive : ''}`}
          onClick={() => setActiveTab('equipped')}
        >Equipados</button>
        <button
          type="button"
          className={`${styles.stepTab} ${activeTab === 'inventory' ? styles.stepTabActive : ''}`}
          onClick={() => setActiveTab('inventory')}
        >Inventário</button>
      </div>
      </CardHeader>
      <CardContent style={{ maxHeight: 560, overflowY: 'auto' }}>



      {/* Conteúdo das tabs */}
      {activeTab === 'equipped' && (
        <div>
          {/* Carry/encumbrance summary */}
          {summary?.equipment?.carry && (
            <div className={styles.panel} style={{ marginBottom: 12 }}>
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle} style={{ marginBottom: 0 }}>Carga</div>
                <div>
                  <Badge data-variant={summary.equipment.carry.status === 'normal' ? 'highlight' : 'warning'} style={{ borderWidth: 1, padding: '2px 8px', fontSize: 11 }}>
                    {String(summary.equipment.carry.status).replace('_',' ')}
                  </Badge>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className={styles.small} style={{ color: 'var(--text-secondary)' }}>
                  <strong>Total:</strong> {summary.equipment.carry.total_kg ?? (summary.equipment.carry.total_lb * 0.45359237).toFixed(2)} kg (equipado: {(summary.equipment.carry.equipped_kg ?? (summary.equipment.carry.equipped_lb * 0.45359237)).toFixed(2)} kg)
                </div>
                <div className={styles.small} style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>
                  <strong>Capacidade:</strong> {(summary.equipment.carry.capacity_kg ?? (summary.equipment.carry.capacity_lb * 0.45359237)).toFixed(2)} kg
                </div>
                {summary.equipment.carry.speed_penalty_ft > 0 && (
                  <div className={styles.small} style={{ gridColumn: '1 / span 2', color: 'var(--text-secondary)' }}>
                    <strong>Penalidade de deslocamento:</strong> -{summary.equipment.carry.speed_penalty_ft} ft
                  </div>
                )}
              </div>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: 'var(--highlight)', marginBottom: 8 }}>Mão Principal</h4>
            {mh ? renderWeapon(mh, 'main_hand') : (
              <div className={styles.small} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhuma arma equipada</div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: 'var(--highlight)', marginBottom: 8 }}>Mão Secundária</h4>
            {oh ? renderWeapon(oh, 'off_hand') : (
              <div className={styles.small} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhuma arma equipada</div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: 'var(--highlight)', marginBottom: 8 }}>Armadura</h4>
            {armor ? renderArmor(armor) : (
              <div className={styles.small} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhuma armadura equipada</div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: 'var(--highlight)', marginBottom: 8 }}>Escudo</h4>
            {shield ? renderShield(shield) : (
              <div className={styles.small} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhum escudo equipado</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'armor' && (
        <div>
          <h4 style={{ color: 'var(--highlight)', marginBottom: 8 }}>Armadura Equipada</h4>
          {armor ? renderArmor(armor) : (
            <div className={styles.small} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Nenhuma armadura equipada
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <h4 style={{ color: 'var(--highlight)', marginBottom: 8 }}>Armaduras no Inventário</h4>
            {inventoryArmors.length === 0 && (
              <div className={styles.small} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhuma armadura no inventário</div>
            )}
            {inventoryArmors.map((item) => {
              const prof = isArmorProficient(item);
              return (
                <div key={item.id} className={styles.panel} style={{ marginBottom: 8 }}>
                  <div className={styles.panelHeader}>
                    <div className={styles.panelTitle}>
                      {item.item_name || item.name}
                      {!prof && (
                        <span className={styles.small} style={{ marginLeft: 8, color: 'var(--warning)' }}>
                          (sem proficiência: não pode equipar)
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className={styles.stepTab}
                        onClick={() => handleEquipArmor(item)}
                        disabled={!prof}
                        title={prof ? '' : 'Sem proficiência'}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        🧥 Equipar Armadura
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'shield' && (
        <div>
          <h4 style={{ color: 'var(--highlight)', marginBottom: 8 }}>Escudo Equipado</h4>
          {shield ? renderShield(shield) : (
            <div className={styles.small} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Nenhum escudo equipado
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <h4 style={{ color: 'var(--highlight)', marginBottom: 8 }}>Escudos no Inventário</h4>
            {inventoryShields.length === 0 && (
              <div className={styles.small} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhum escudo no inventário</div>
            )}
            {inventoryShields.map((item) => {
              const canShield = canEquipShield();
              const prof = armorProfs.some((p) => p.includes('shield') || p.includes('escudo'));
              return (
                <div key={item.id} className={styles.panel} style={{ marginBottom: 8 }}>
                  <div className={styles.panelHeader}>
                    <div className={styles.panelTitle}>
                      {item.item_name || item.name}
                      {!prof && (
                        <span className={styles.small} style={{ marginLeft: 8, color: 'var(--warning)' }}>
                          (sem proficiência: não pode equipar)
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className={styles.stepTab}
                        onClick={() => handleEquipShield(item)}
                        disabled={!prof || !canShield}
                        title={!prof ? 'Sem proficiência' : (!canShield ? 'Não é possível com arma de duas mãos equipada' : '')}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        🛡️ Equipar Escudo
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div>
          <h4 style={{ color: 'var(--highlight)', marginBottom: 8 }}>Inventário</h4>
          {/* Categorias com scroll horizontal */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 8 }}>
            {invCategories.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.stepTab} ${invFilter === c ? styles.stepTabActive : ''}`}
                onClick={() => setInvFilter(c)}
                style={{ whiteSpace: 'nowrap' }}
              >{c === 'all' ? 'Todos' : c.charAt(0).toUpperCase() + c.slice(1)}</button>
            ))}
          </div>

          {inventory.length > 0 ? (
            <div>
              {/* Cabeçalho tipo tabela (duas colunas) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 4 }}>
                {[0,1].map((i) => (
                  <div key={`head-${i}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 40px 50px', gap: 8, padding: '0 10px' }}>
                    <div className={styles.small} style={{ color: 'var(--text-secondary)' }}>Nome</div>
                    <div className={styles.small} style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Qtd</div>
                    <div className={styles.small} style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>Dano</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                {inventory
                  .filter((it) => invFilter === 'all' ? true : (categorizeItem(it) === invFilter))
                  .map((item) => {
                    const cat = String(item.category || '').toLowerCase();
                    const isWeapon = cat.includes('weapon');
                  const dmg = isWeapon ? (item?.weapon_props?.damage_die || item?.damage || '') : '';
                  return (
                    <div
                      key={item.id}
                      className={styles.panel}
                      style={{ cursor: 'pointer', padding: 10 }}
                      onClick={(e) => { setPopoverItem(item); setPopoverAnchor(e.currentTarget); }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 40px 50px', gap: 8, alignItems: 'center' }}>
                        <div className={styles.small} style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.item_name || item.name}</div>
                        <div className={styles.small} style={{ textAlign: 'center' }}>x{item.quantity || 1}</div>
                        <div className={styles.small} style={{ textAlign: 'right' }}>{dmg}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.small} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Inventário vazio</div>
          )}
        </div>
      )}
      </CardContent>
    </Card>
    {/* Popover de inventário */}
    <Popover
      anchorEl={popoverAnchor}
      open={!!popoverAnchor}
      onClose={() => { setPopoverAnchor(null); setPopoverItem(null); }}
      placement="bottom"
      width={320}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      marginThreshold={8}
    >
      {popoverItem && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 6 }}>
            <div style={{ fontWeight: 700 }}>{popoverItem.item_name || popoverItem.name}</div>
            <div className={styles.small} style={{ color: 'var(--text-secondary)' }}>x{popoverItem.quantity || 1}</div>
          </div>
          <div className={styles.small} style={{ color: 'var(--text-secondary)' }}>{popoverItem.category || 'Item'}</div>

          {/* Ações condicionais */}
          {/* Equipar se arma/armadura/escudo */}
          {(() => {
            const cat = String(popoverItem.category || '').toLowerCase();
            if (cat.includes('weapon')) {
              return (
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <button className={styles.stepTab} onClick={async ()=>{ await handleEquipWeapon(popoverItem,'main_hand'); setPopoverAnchor(null); }}>⚔️ Principal</button>
                  <button className={styles.stepTab} title={canEquipToOffHand(popoverItem)?'':'Requer arma leve / principal sem 2 mãos'} onClick={async ()=>{ await handleEquipWeapon(popoverItem,'off_hand'); setPopoverAnchor(null); }}>🤜 Secundária</button>
                </div>
              );
            }
            if (cat.includes('armor')) {
              return (<div style={{ marginTop:8 }}><button className={styles.stepTab} onClick={async ()=>{ await handleEquipArmor(popoverItem); setPopoverAnchor(null); }}>🧥 Equipar</button></div>);
            }
            if (cat.includes('shield')) {
              return (<div style={{ marginTop:8 }}><button className={styles.stepTab} onClick={async ()=>{ await handleEquipShield(popoverItem); setPopoverAnchor(null); }}>🛡️ Equipar</button></div>);
            }
            return null;
          })()}

          {/* Consumíveis: poções, pergaminhos, munições */}
          {(() => {
            const name = String(popoverItem.item_name || popoverItem.name || '').toLowerCase();
            const cat = String(popoverItem.category || '').toLowerCase();
            const consumable = cat.includes('ammunition') || cat.includes('potion') || name.includes('poção') || name.includes('pocao') || cat.includes('scroll') || name.includes('pergaminho');
            if (!consumable) return null;
            const max = Math.max(1, Number(popoverItem.quantity || 1));
            return (
              <div style={{ display:'flex', gap:8, alignItems:'center', marginTop: 10 }}>
                <input type="number" min={1} max={max} defaultValue={1} id={`consume-${popoverItem.id}`} style={{ width: 70, padding:'4px 6px', background:'var(--dark)', color:'var(--default)', border:'1px solid var(--secondary)', borderRadius: 6 }} />
                <button className={styles.stepTab} onClick={async ()=>{ const v = document.getElementById(`consume-${popoverItem.id}`).value; await consumeItem(popoverItem, parseInt(v,10)||1); setPopoverAnchor(null); }}>🍷 Consumir</button>
              </div>
            );
          })()}
        </div>
      )}
    </Popover>

      {/* Dialog para adicionar itens */}
      <Dialog isOpen={showAddModal} onClose={() => setShowAddModal(false)} size="md">
        <DialogHeader>
          <DialogTitle>Adicionar Item</DialogTitle>
        </DialogHeader>
        <DialogContent>
            {/* Tabs de categoria */}
            <div className={styles.stepTabs} style={{ marginBottom: 16 }}>
              <button 
                type="button" 
                className={`${styles.stepTab} ${selectedCategory === 'weapons' ? styles.stepTabActive : ''}`}
                onClick={() => setSelectedCategory('weapons')}
              >
                Armas
              </button>
              <button 
                type="button" 
                className={`${styles.stepTab} ${selectedCategory === 'armors' ? styles.stepTabActive : ''}`}
                onClick={() => setSelectedCategory('armors')}
              >
                Armaduras
              </button>
              <button 
                type="button" 
                className={`${styles.stepTab} ${selectedCategory === 'shields' ? styles.stepTabActive : ''}`}
                onClick={() => setSelectedCategory('shields')}
              >
                Escudos
              </button>
              <button 
                type="button" 
                className={`${styles.stepTab} ${selectedCategory === 'ammunition' ? styles.stepTabActive : ''}`}
                onClick={() => setSelectedCategory('ammunition')}
              >
                Munições
              </button>
              <button 
                type="button" 
                className={`${styles.stepTab} ${selectedCategory === 'magic-items' ? styles.stepTabActive : ''}`}
                onClick={() => setSelectedCategory('magic-items')}
              >
                Itens Mágicos
              </button>
            </div>

            {/* Conteúdo da categoria selecionada */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div className={styles.small} style={{ color: 'var(--text-secondary)' }}>
                  Carregando equipamentos...
                </div>
              </div>
            ) : (
              <div>
                {selectedCategory === 'weapons' && (
                  <div>
                    <div className={styles.small} style={{ marginBottom: 8 }}>Selecione uma arma para adicionar:</div>
                    {availableWeapons.map((weapon) => {
                      const isProficient = (() => {
                        const cat = String(weapon.weapon_category || '').toLowerCase();
                        if (cat && weaponProfs.has(cat)) return true;
                        return weaponProfs.has(String(weapon.name || '').toLowerCase());
                      })();
                      
                      return (
                        <div key={weapon.index} className={styles.panel} style={{ marginBottom: 8 }}>
                          <div className={styles.panelHeader}>
                            <div className={styles.panelTitle}>{weapon.name}</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              {isProficient && <Badge data-variant="highlight">Proficiente</Badge>}
                              <button 
                                type="button" 
                                className={styles.stepTab} 
                                onClick={() => {
                                  addItemToInventory(weapon.index, weapon.name, weapon.category, weapon.properties, 1, weapon);
                                  setShowAddModal(false);
                                }}
                                disabled={false}
                                title="Adicionar ao inventário"
                                style={{ fontSize: '12px', padding: '4px 8px' }}
                              >
                                Adicionar
                              </button>
                            </div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                            <div>
                              <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                <strong>Dano:</strong> {weapon.damage} {weapon.damage_type}
                              </div>
                              <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                <strong>Alcance:</strong> {weapon.range || '5 ft.'}
                              </div>
                            </div>
                            
                            <div>
                              <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                <strong>Custo:</strong> {weapon.cost}
                              </div>
                              <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                <strong>Peso:</strong> {weapon.weight}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Controles de paginação para armas */}
                    {pagination.total_pages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
                        <button 
                          type="button"
                          className={styles.stepTab}
                          onClick={() => loadEquipmentWithPagination('simple-weapons', currentPage - 1)}
                          disabled={!pagination.has_prev}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          Anterior
                        </button>
                        <span className={styles.small} style={{ color: 'var(--text-secondary)' }}>
                          Página {pagination.current_page} de {pagination.total_pages}
                        </span>
                        <button 
                          type="button"
                          className={styles.stepTab}
                          onClick={() => loadEquipmentWithPagination('simple-weapons', currentPage + 1)}
                          disabled={!pagination.has_next}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          Próxima
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedCategory === 'armors' && (
                  <div>
                    <div className={styles.small} style={{ marginBottom: 8 }}>Selecione uma armadura para adicionar:</div>
                    {availableArmors.map((armor) => {
                      const isProficient = (() => {
                        const isShield = String(armor.category || '').toLowerCase().includes('shield');
                        if (isShield) return armorProfsSet.has('shields');
                        const cat = String(armor.armor_category || '').toLowerCase();
                        return armorProfsSet.has(cat);
                      })();
                      
                      return (
                        <div key={armor.index} className={styles.panel} style={{ marginBottom: 8 }}>
                          <div className={styles.panelHeader}>
                            <div className={styles.panelTitle}>{armor.name}</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              {isProficient && <Badge data-variant="highlight">Proficiente</Badge>}
                              <button 
                                type="button" 
                                className={styles.stepTab} 
                                onClick={() => {
                                  addItemToInventory(armor.index, armor.name, armor.category, armor.properties, 1, armor);
                                  setShowAddModal(false);
                                }}
                                disabled={false}
                                title="Adicionar ao inventário"
                                style={{ fontSize: '12px', padding: '4px 8px' }}
                              >
                                Adicionar
                              </button>
                            </div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                            <div>
                              <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                <strong>CA:</strong> {armor.armor_class}
                              </div>
                              <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                <strong>Categoria:</strong> {armor.category}
                              </div>
                            </div>
                            
                            <div>
                              <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                <strong>Custo:</strong> {armor.cost}
                              </div>
                              <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                <strong>Peso:</strong> {armor.weight}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedCategory === 'shields' && (
                  <div>
                    <div className={styles.small} style={{ marginBottom: 8 }}>Selecione um escudo para adicionar:</div>
                    {availableShields.map((shield) => {
                      const isProficient = armorProfsSet.has('shields');
                      
                      return (
                        <div key={shield.index} className={styles.panel} style={{ marginBottom: 8 }}>
                          <div className={styles.panelHeader}>
                            <div className={styles.panelTitle}>{shield.name}</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              {isProficient && <Badge data-variant="highlight">Proficiente</Badge>}
                              <button 
                                type="button" 
                                className={styles.stepTab} 
                                onClick={() => {
                                  addItemToInventory(shield.index, shield.name, shield.category, shield.properties, 1, shield);
                                  setShowAddModal(false);
                                }}
                                disabled={false}
                                title="Adicionar ao inventário"
                                style={{ fontSize: '12px', padding: '4px 8px' }}
                              >
                                Adicionar
                              </button>
                            </div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                            <div>
                              <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                <strong>Bônus de CA:</strong> {shield.armor_class}
                              </div>
                              <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                <strong>Custo:</strong> {shield.cost}
                              </div>
                            </div>
                            
                            <div>
                              <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                <strong>Peso:</strong> {shield.weight}
                              </div>
                              <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                <strong>Propriedades:</strong> {shield.properties?.join(', ') || 'Nenhuma'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedCategory === 'ammunition' && (
                  <div>
                    <div className={styles.small} style={{ marginBottom: 8 }}>Selecione uma munição para adicionar:</div>
                    {availableAmmunition.map((ammo) => (
                      <div key={ammo.index} className={styles.panel} style={{ marginBottom: 8 }}>
                        <div className={styles.panelHeader}>
                          <div className={styles.panelTitle}>{ammo.name}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input 
                              type="number" 
                              min="1" 
                              max="1000" 
                              defaultValue="20" 
                              style={{
                                padding: '6px 8px',
                                border: '1px solid var(--secondary)',
                                borderRadius: '4px',
                                width: '80px',
                                backgroundColor: 'var(--dark)',
                                color: 'var(--text-secondary)'
                              }}
                              id={`qty-${ammo.index}`}
                            />
                            <button 
                              type="button" 
                              className={styles.stepTab} 
                              onClick={() => {
                                const qty = document.getElementById(`qty-${ammo.index}`).value;
                                addItemToInventory(ammo.index, ammo.name, ammo.category, ammo.properties, parseInt(qty), ammo);
                                setShowAddModal(false);
                              }}
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                          <div>
                            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                              <strong>Custo:</strong> {ammo.cost}
                            </div>
                            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                              <strong>Peso:</strong> {ammo.weight}
                            </div>
                          </div>
                          
                          <div>
                            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                              <strong>Propriedades:</strong> {ammo.properties?.join(', ') || 'Nenhuma'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCategory === 'magic-items' && (
                  <div>
                    <div className={styles.small} style={{ marginBottom: 8 }}>Selecione um item mágico para adicionar:</div>
                    {availableMagicItems.map((item) => (
                      <div key={item.index} className={styles.panel} style={{ marginBottom: 8 }}>
                        <div className={styles.panelHeader}>
                          <div className={styles.panelTitle}>{item.name}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button 
                              type="button" 
                              className={styles.stepTab} 
                              onClick={() => {
                                addItemToInventory(item.index, item.name, item.category, item.properties, 1, item);
                                setShowAddModal(false);
                              }}
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                          <div>
                            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                              <strong>Raridade:</strong> {item.rarity}
                            </div>
                            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                              <strong>Custo:</strong> {item.cost}
                            </div>
                            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                              <strong>Peso:</strong> {item.weight}
                            </div>
                          </div>
                          
                          <div>
                            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                              <strong>Categoria:</strong> {item.category}
                            </div>
                            <div className={styles.small} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                              <strong>Requer Sintonia:</strong> {item.requires_attunement ? 'Sim' : 'Não'}
                            </div>
                          </div>
                        </div>
                        
                        {item.description && (
                          <div style={{ marginTop: 8 }}>
                            <div className={styles.small} style={{ color: 'var(--text-secondary)' }}>
                              <strong>Descrição:</strong> {item.description}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
        </DialogContent>
      </Dialog>

    </>
  );
}
