export function areClassChoicesComplete(params) {
  const {
    klassId,
    classRules,
    klasses,
    level,
    classSubclassId,
    classPicksByLevel,
    classFightingStyle,
    subclassesForKlass,
  } = params || {};

  if (!klassId || !classRules) return false;
  const klass = (klasses || []).find((k) => String(k.id) === String(klassId));
  if (!klass) return false;
  const klassApiIndex = klass.api_index || (klass.name || '').toLowerCase();
  const rule = classRules[klassApiIndex];
  if (!rule) return false;

  // Subclasse obrigatória
  const subclassLevel = rule.subclass?.choose_level;
  if (subclassLevel && Number(level) >= Number(subclassLevel) && !classSubclassId) return false;

  // Escolhas obrigatórias por nível (genérico)
  const requiredChoices = rule.required_choices_at_level || {};
  for (let lvl = 1; lvl <= Number(level || 1); lvl++) {
    const levelChoices = requiredChoices[lvl];
    if (!levelChoices) continue;
    const row = (classPicksByLevel || {})[lvl] || {};
    for (const [choiceKey, config] of Object.entries(levelChoices)) {
      if (choiceKey === 'fighting_style') {
        const fs = row.fighting_style || classFightingStyle;
        if (!fs) return false;
        continue;
      }
      const need = Number(config?.choose || 1);
      const val = row?.[choiceKey];
      const arr = Array.isArray(val) ? val : (val ? [val] : []);
      if (arr.length < need) return false;
    }
  }

  // Subclasse: escolhas adicionais obrigatórias por nível
  try {
    if (classSubclassId) {
      const sc = (subclassesForKlass || []).find((s) => String(s.id) === String(classSubclassId));
      const addReq = (sc && sc.additional_choices_by_level) || {};
      for (let lvl = 1; lvl <= Number(level || 1); lvl++) {
        const cfg = addReq[String(lvl)] || addReq[lvl];
        if (!cfg) continue;
        const row = (classPicksByLevel || {})[lvl] || {};
        for (const [choiceKey, conf] of Object.entries(cfg)) {
          const need = Number(conf?.choose || 1);
          const v = row?.[choiceKey];
          const arr = Array.isArray(v) ? v : (v ? [v] : []);
          if (arr.length < need) return false;
        }
      }
    }
  } catch (_) {}
  return true;
}

export function getLevelUpErrors(params) {
  const {
    klassId,
    classRules,
    klasses,
    level,
    classSubclassId,
    classPicksByLevel,
    classFightingStyle,
    subclassesForKlass,
  } = params || {};

  const errors = [];
  if (!klassId || !classRules) {
    errors.push('Selecione uma classe');
    return errors;
  }
  const klass = (klasses || []).find((k) => String(k.id) === String(klassId));
  if (!klass) {
    errors.push('Classe não encontrada');
    return errors;
  }
  const klassApiIndex = klass.api_index || (klass.name || '').toLowerCase();
  const rule = classRules[klassApiIndex];
  if (!rule) {
    errors.push('Regras da classe não encontradas');
    return errors;
  }

  const subclassLevel = rule.subclass?.choose_level;
  const currentLevel = Number(level || 1);
  if (subclassLevel && currentLevel >= subclassLevel && !classSubclassId) {
    errors.push(`Subclasse obrigatória a partir do nível ${subclassLevel}`);
  }

  const requiredChoices = rule.required_choices_at_level || {};
  for (let lvl = 1; lvl <= currentLevel; lvl++) {
    const levelChoices = requiredChoices[lvl];
    if (!levelChoices) continue;
    const row = (classPicksByLevel || {})[lvl] || {};
    for (const [choiceKey, config] of Object.entries(levelChoices)) {
      const need = Number(config?.choose || 1);
      if (choiceKey === 'fighting_style') {
        const fs = row.fighting_style || classFightingStyle;
        if (!fs) errors.push(`Estilo de luta obrigatório no nível ${lvl}`);
        continue;
      }
      const val = row?.[choiceKey];
      const arr = Array.isArray(val) ? val : (val ? [val] : []);
      if (arr.length < need) {
        const label = choiceKey.replace('_', ' ');
        errors.push(`${label}: faltam ${need - arr.length} no nível ${lvl}`);
      }
      if (choiceKey === 'favored_enemy') {
        const v = Array.isArray(val) ? val[0] : val;
        const nm = (v && typeof v === 'object') ? (v.name || v.id) : v;
        if (String(nm || '').toLowerCase().includes('humanoide')) {
          const det = row?.favored_enemy_details || [];
          const count = Array.isArray(det) ? det.length : 0;
          if (count < 2) errors.push(`Inimigo Favorito (Humanoides): selecione 2 raças no nível ${lvl}`);
        }
      }
    }
  }

  try {
    if (classSubclassId) {
      const sc = (subclassesForKlass || []).find((s) => String(s.id) === String(classSubclassId));
      const addReq = (sc && sc.additional_choices_by_level) || {};
      for (let lvl = 1; lvl <= currentLevel; lvl++) {
        const cfg = addReq[String(lvl)] || addReq[lvl];
        if (!cfg) continue;
        const row = (classPicksByLevel || {})[lvl] || {};
        for (const [choiceKey, conf] of Object.entries(cfg)) {
          const need = Number(conf?.choose || 1);
          const v = row?.[choiceKey];
          const arr = Array.isArray(v) ? v : (v ? [v] : []);
          if (arr.length < need) {
            const label = choiceKey.replace('_', ' ');
            errors.push(`${label}: faltam ${need - arr.length} no nível ${lvl}`);
          }
        }
      }
    }
  } catch (_) {}

  return errors;
}

