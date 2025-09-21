"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../../_styles/character/CharacterForm.module.css";
import Button from "../UI/Button";
import Select from "../UI/Select";
import { apiClient } from "../../_lib/api/client";

// Minimal equipment step: lets user pick 1 armor (if allowed), optional shield, 1 main weapon and optional extras.
export default function StepEquipment({
  allowedArmorCats = [],
  allowedWeaponCats = [],
  allowShortsword = false,
  picks = [],
  setPicks = () => {},
  onBack = () => {},
  onNext = () => {},
}) {
  // Category caches
  const [cats, setCats] = useState({});
  const catIndexMap = {
    light: 'light-armor',
    medium: 'medium-armor',
    heavy: 'heavy-armor',
    shields: 'shields',
    simple: 'simple-weapons',
    martial: 'martial-weapons',
    gear: 'adventuring-gear',
    packs: 'equipment-packs',
  };

  const needCats = useMemo(() => {
    const set = new Set();
    allowedArmorCats.forEach((c) => { if (c === 'light' || c === 'medium' || c === 'heavy' || c === 'shields') set.add(c); });
    allowedWeaponCats.forEach((w) => { if (w === 'simple' || w === 'martial') set.add(w); });
    if (allowShortsword && !allowedWeaponCats.includes('martial')) set.add('martial');
    set.add('gear'); set.add('packs');
    return Array.from(set);
  }, [allowedArmorCats, allowedWeaponCats]);

  useEffect(() => {
    (async () => {
      const out = {};
      for (const key of needCats) {
        const idx = catIndexMap[key];
        try {
          const res = await apiClient.get(`/api/v1/public/equipment_categories/${idx}`);
          const results = res.results || res.equipment || [];
          out[key] = results.map((r) => ({ index: r.index || r.url?.split('/').pop(), name: r.name }));
        } catch (_) {
          out[key] = [];
        }
      }
      setCats(out);
    })();
  }, [needCats.join('|')]);

  const [armorPick, setArmorPick] = useState(null);
  const [shieldPick, setShieldPick] = useState(false);
  const [weaponPick, setWeaponPick] = useState(null);
  const [extras, setExtras] = useState([]);
  const [itemDetails, setItemDetails] = useState({});

  const addExtra = (key, idx) => {
    if (!idx) return;
    const item = (cats[key] || []).find((x) => x.index === idx);
    if (!item) return;
    setExtras((prev) => [...prev, { index: item.index, name: item.name, category: key }]);
  };

  const removeExtra = (i) => setExtras((prev) => prev.filter((_, n) => n !== i));

  const mergePicks = () => {
    const items = [];
    if (armorPick) {
      const found = (cats.light||[]).concat(cats.medium||[], cats.heavy||[]).find(x => x.index === armorPick);
      if (found) {
        const det = itemDetails[found.index] || {};
        const acInfo = det.armor_class || {};
        const props = {
          base: (acInfo.base != null) ? Number(acInfo.base) : null,
          dex_bonus: !!acInfo.dex_bonus,
          max_bonus: (acInfo.max_bonus != null) ? Number(acInfo.max_bonus) : null,
          stealth_disadvantage: !!det.stealth_disadvantage,
          str_minimum: det.str_minimum || det.strength || null,
        };
        items.push({ item_index: found.index, item_name: found.name, category: 'armor', equipped: true, slot: 'armor', quantity: 1, source: 'class', props });
      }
    }
    if (shieldPick) {
      const found = (cats.shields || [])[0];
      // allow choosing first shield (there's typically one)
      if (found) items.push({ item_index: found.index, item_name: found.name, category: 'shield', equipped: true, slot: 'shield', quantity: 1, source: 'class', props: { ac_bonus: 2 } });
    }
    if (weaponPick) {
      const found = (cats.simple||[]).concat(cats.martial||[]).find(x => x.index === weaponPick);
      if (found) {
        const det = itemDetails[found.index] || {};
        const props = (() => {
          try {
            // Map from 5e API equipment details
            const weapon_category = (det.weapon_category || '').toLowerCase();
            const dmg = det.damage?.damage_dice || det.damage?.dice || det.damage?.damage_dice_2014 || '';
            const range = (() => {
              if (det.range && (det.range.normal || det.range.long)) return `${det.range.normal || 0}/${det.range.long || 0}`;
              if (det.throw_range && (det.throw_range.normal || det.throw_range.long)) return `${det.throw_range.normal || 0}/${det.throw_range.long || 0}`;
              return undefined;
            })();
            const propSet = new Set((det.properties || []).map((p)=> (p.index || p.name || '').toLowerCase()));
            const versatile_die = det.two_handed_damage?.damage_dice || undefined;
            const type = weapon_category.includes('ranged') ? 'ranged' : 'melee';
            const category = weapon_category.includes('simple') ? 'simple' : (weapon_category.includes('martial') ? 'martial' : undefined);
            return {
              damage_die: dmg,
              range,
              versatile: propSet.has('versatile'),
              finesse: propSet.has('finesse'),
              light: propSet.has('light'),
              loading: propSet.has('loading'),
              reach: propSet.has('reach'),
              heavy: propSet.has('heavy'),
              special: propSet.has('special'),
              thrown: propSet.has('thrown'),
              versatile_die,
              type,
              category,
            };
          } catch (_) { return {}; }
        })();
        items.push({ item_index: found.index, item_name: found.name, category: 'weapon', equipped: true, slot: 'main_hand', quantity: 1, source: 'class', props });
      }
    }
    extras.forEach((e) => items.push({ item_index: e.index, item_name: e.name, category: e.category, quantity: 1, source: 'background' }));
    return items;
  };

  useEffect(() => {
    const items = mergePicks();
    setPicks(items);
  }, [armorPick, shieldPick, weaponPick, JSON.stringify(extras), JSON.stringify(itemDetails)]);

  const canWearArmor = allowedArmorCats.some(c => ['light','medium','heavy'].includes(c));
  const canUseShield = allowedArmorCats.includes('shields');
  const canUseSimple = allowedWeaponCats.includes('simple');
  const canUseMartial = allowedWeaponCats.includes('martial');

  // Enrich weaponPick with equipment details (damage/range/properties)
  useEffect(() => {
    (async () => {
      if (!weaponPick) return;
      if (itemDetails[weaponPick]) return; // cached
      try {
        const res = await apiClient.get(`/api/v1/public/equipment/${weaponPick}`);
        const data = res || {};
        setItemDetails(prev => ({ ...prev, [weaponPick]: data }));
      } catch (_) { /* noop */ }
    })();
  }, [weaponPick]);

  // Enrich armorPick with equipment details (AC/stealth/STR req)
  useEffect(() => {
    (async () => {
      if (!armorPick) return;
      if (itemDetails[armorPick]) return; // cached
      try {
        const res = await apiClient.get(`/api/v1/public/equipment/${armorPick}`);
        const data = res || {};
        setItemDetails(prev => ({ ...prev, [armorPick]: data }));
      } catch (_) { /* noop */ }
    })();
  }, [armorPick]);

  const ArmorDetailsBox = () => {
    if (!armorPick) return null;
    const det = itemDetails[armorPick] || {};
    const acInfo = det.armor_class || {};
    const base = (acInfo.base != null) ? Number(acInfo.base) : null;
    const dexBonus = !!acInfo.dex_bonus;
    const maxBonus = (acInfo.max_bonus != null) ? Number(acInfo.max_bonus) : null;
    const stealthDis = !!det.stealth_disadvantage;
    const strReq = det.str_minimum || det.strength || null;
    return (
      <div className={styles.small} style={{ marginTop: 6 }}>
        {base != null && (
          <div>
            CA base {base}
            {dexBonus && (maxBonus != null ? ` + DEX (máx ${maxBonus})` : ' + DEX')}
            {!dexBonus && ' (sem DEX)'}
          </div>
        )}
        {stealthDis && <div>Desvantagem em Furtividade</div>}
        {strReq ? <div>Requisito de FOR: {strReq}</div> : null}
      </div>
    );
  };

  const WeaponDetailsBox = () => {
    if (!weaponPick) return null;
    const det = itemDetails[weaponPick] || {};
    const dmg = det?.damage?.damage_dice || det?.damage?.dice || det?.damage_dice || det?.damage_2014 || null;
    const twoH = det?.two_handed_damage?.damage_dice || null;
    const props = Array.isArray(det?.properties) ? det.properties.map(p => (p.name || p.index)).filter(Boolean) : [];
    const range = (() => {
      const r = det.range || {};
      const tr = det.throw_range || {};
      if (r.normal || r.long) return `${r.normal || 0}/${r.long || 0}`;
      if (tr.normal || tr.long) return `${tr.normal || 0}/${tr.long || 0}`;
      return null;
    })();
    return (
      <div className={styles.small} style={{ marginTop: 6 }}>
        {dmg && <div>Dano: {String(dmg).toUpperCase()}{twoH ? ` (2 mãos: ${String(twoH).toUpperCase()})` : ''}</div>}
        {range && <div>Alcance: {range}</div>}
        {props.length > 0 && <div>Propriedades: {props.join(', ')}</div>}
      </div>
    );
  };

  return (
    <div className={styles.equipmentContainer}>
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Escolher Equipamentos</div>
        {(() => {
          const disArmor = ['light','medium','heavy','shields'].filter(k => !allowedArmorCats.includes(k));
          const disWeapons = ['simple','martial'].filter(k => !allowedWeaponCats.includes(k));
          if (disArmor.length === 0 && disWeapons.length === 0) return null;
          const labelMap = { light: 'armaduras leves', medium: 'armaduras médias', heavy: 'armaduras pesadas', shields: 'escudos', simple: 'armas simples', martial: 'armas marciais' };
          const txt = [...disArmor, ...disWeapons].map(k => labelMap[k]).filter(Boolean).join(', ');
          return (
            <div className={styles.small} style={{ marginBottom: 8, color: 'var(--muted)' }} title="Sua classe não possui proficiência nestas categorias">
              Categorias indisponíveis para sua classe: {txt}
            </div>
          );
        })()}
        
        <div className={styles.equipmentGrid}>
          {/* Armadura */}
          {canWearArmor && (
            <div className={styles.equipmentSection}>
              <div className={styles.equipmentSectionTitle}>
                <span className={styles.equipmentIcon}>🛡️</span>
                Armadura
              </div>
              <Select
                placeholder="Selecione uma armadura"
                options={[
                  ...(['light','medium','heavy'].filter(k=>allowedArmorCats.includes(k))).flatMap((k)=> (cats[k]||[]).map((x)=>({ id: x.index, name: `${x.name}` })))
                ]}
                value={armorPick}
                onChange={setArmorPick}
              />
              {armorPick && (
                <div className={styles.selectedItem}>
                  ✓ {(['light','medium','heavy'].filter(k=>allowedArmorCats.includes(k))).flatMap((k)=> (cats[k]||[])).find(x => x.index === armorPick)?.name}
                </div>
              )}
              {armorPick && <ArmorDetailsBox />}
            </div>
          )}

          {/* Escudo */}
          {canUseShield ? (
            <div className={styles.equipmentSection}>
              <div className={styles.equipmentSectionTitle}>
                <span className={styles.equipmentIcon}>🛡️</span>
                Escudo
              </div>
              <label className={styles.equipmentCheckbox}>
                <input 
                  type="checkbox" 
                  checked={shieldPick} 
                  onChange={(e)=>setShieldPick(e.target.checked)} 
                />
                <span className={styles.checkboxLabel}>Incluir escudo</span>
              </label>
              {shieldPick && (
                <div className={styles.selectedItem}>
                  ✓ Escudo selecionado
                </div>
              )}
            </div>
          ) : (
            <div className={styles.equipmentSection} title="Sua classe não é proficiente com escudos">
              <div className={styles.equipmentSectionTitle}>
                <span className={styles.equipmentIcon}>🛡️</span>
                Escudo
              </div>
              <div className={styles.small} style={{ color: 'var(--muted)' }}>Não permitido para sua classe</div>
            </div>
          )}

          {/* Arma Principal */}
          {(canUseSimple || canUseMartial) && (
            <div className={styles.equipmentSection}>
              <div className={styles.equipmentSectionTitle}>
                <span className={styles.equipmentIcon}>⚔️</span>
                Arma Principal
              </div>
              <Select
                placeholder="Selecione uma arma"
                options={[
                  ...(canUseSimple ? (cats.simple||[]) : []),
                  ...((canUseMartial ? (cats.martial||[]) : (allowShortsword ? (cats.martial||[]).filter(x => /shortsword|espada curta/i.test(String(x.name||''))) : []))),
                ].map((x)=>({ id: x.index, name: x.name }))}
                value={weaponPick}
                onChange={setWeaponPick}
              />
              {weaponPick && (
                <div className={styles.selectedItem}>
                  ✓ {[...(canUseSimple ? (cats.simple||[]) : []), ...((canUseMartial ? (cats.martial||[]) : (allowShortsword ? (cats.martial||[]).filter(x => /shortsword|espada curta/i.test(String(x.name||''))) : [])))].find(x => x.index === weaponPick)?.name}
                </div>
              )}
              {weaponPick && <WeaponDetailsBox />}
            </div>
          )}

          {/* Extras */}
          <div className={styles.equipmentSection}>
            <div className={styles.equipmentSectionTitle}>
              <span className={styles.equipmentIcon}>🎒</span>
              Extras (pacotes/itens)
            </div>
            <div className={styles.extrasControls}>
              <Select 
                placeholder="Pacotes" 
                options={(cats.packs||[]).map((x)=>({ id:x.index, name:x.name }))} 
                value={''} 
                onChange={(v)=>addExtra('packs', v)} 
              />
              <Select 
                placeholder="Itens" 
                options={(cats.gear||[]).map((x)=>({ id:x.index, name:x.name }))} 
                value={''} 
                onChange={(v)=>addExtra('gear', v)} 
              />
            </div>
          </div>
        </div>

        {/* Itens Escolhidos */}
        {extras.length > 0 && (
          <div className={styles.chosenItemsSection}>
            <div className={styles.chosenItemsTitle}>Itens Escolhidos</div>
            <div className={styles.chosenItemsGrid}>
              {extras.map((e, i)=>(
                <div key={`${e.index}-${i}`} className={styles.chosenItem}>
                  <span className={styles.chosenItemName}>{e.name}</span>
                  <button 
                    type="button" 
                    className={styles.removeItemButton}
                    onClick={()=>removeExtra(i)}
                    title="Remover item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.equipmentNavigation}>
        <Button variant="secondary" onClick={onBack}>Voltar</Button>
        <Button variant="highlight" onClick={onNext}>Próximo</Button>
      </div>
    </div>
  );
}
