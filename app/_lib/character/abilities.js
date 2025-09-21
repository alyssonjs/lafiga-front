export const RULE_NAME_MAP = {
  'Anão': 'dwarf',
  'Elfo': 'elf',
  'Halfling': 'halfling',
  'Humano': 'human',
  'Draconato': 'dragonborn',
  'Gnomo': 'gnome',
  'Meio-Elfo': 'half_elf',
  'Meio-Orc': 'half_orc',
  'Tiefling': 'tiefling',
  'Aarakocra': 'aarakocra',
  'Centauro': 'centaur',
};

const abilityKey = { STR: 'str', DEX: 'dex', CON: 'con', INT: 'int', WIS: 'wis', CHA: 'cha' };
const normalizeAbility = (ab) => {
  if (typeof ab === 'string') return ab;
  if (ab && typeof ab === 'object') {
    if (ab.id) return String(ab.id);
    if (ab.ability) return String(ab.ability);
  }
  return String(ab || '');
};
const toAbilityKey = (ab) => {
  const token = normalizeAbility(ab).toUpperCase();
  return abilityKey[token] || token.toLowerCase();
};

export function computeAbilityBonuses(rule, subRuleId, picks, raceName, subRaceName) {
  const addBonus = (map, ab, amt) => {
    const k = toAbilityKey(ab);
    if (!k) return;
    map[k] = (map[k] || 0) + amt;
  };
  const b = {};
  if (!rule) return b;
  const sub = subRuleId ? (rule.subraces || {})[subRuleId] : null;
  const collect = (node) => {
    if (node?.type === 'fixed') {
      (node.increases || []).forEach((ai) => addBonus(b, ai.ability, ai.amount));
    }
  };
  const isHumanVariant = rule.id === 'human' && subRuleId === 'variant';
  if (!isHumanVariant) {
    collect(rule.ability);
  }
  if (sub?.ability) collect(sub.ability);
  if (rule.id === 'half_elf' && Array.isArray(picks?.halfElfAbilityPicks)) {
    picks.halfElfAbilityPicks.forEach((a) => addBonus(b, a, 1));
  }
  if (rule.id === 'human' && subRuleId === 'variant') {
    const hv = picks?.variantHumanASI || null;
    try {
      if (hv && hv.mode === 'attributes') {
        const attrs = Array.isArray(hv.attributes) ? hv.attributes : [];
        const uniq = Array.from(new Set(attrs)).slice(0, 2);
        uniq.forEach((a) => addBonus(b, a, 1));
      }
    } catch (_) {}
  }
  const rn = (raceName || '').toLowerCase();
  const srn = (subRaceName || '').toLowerCase();
  if (!rule || !rule.id) {
    if (rn === 'meio-orc') {
      addBonus(b, 'STR', 2);
      addBonus(b, 'CON', 1);
    }
    if (rn === 'gnomo') {
      addBonus(b, 'INT', 2);
      if (srn.includes('rocha')) addBonus(b, 'CON', 1);
      if (srn.includes('floresta')) addBonus(b, 'DEX', 1);
    }
  }
  return b;
}
