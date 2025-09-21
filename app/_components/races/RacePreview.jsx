"use client";

import styles from "../../_styles/character/CharacterForm.module.css";

const ftToMeters = (ft) => Math.round(ft * 0.3048);

function mergeProf(a,b){
  if(!a && !b) return {};
  const uniq = (arr=[]) => Array.from(new Set(arr.map((x)=> (x && x.name) ? x.name : x)));
  const toArr = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'object') {
      if (Array.isArray(v.fixed)) return v.fixed;
      if (Array.isArray(v.choices)) return v.choices;
    }
    return [v];
  };
  const out = { };
  if(a?.weapons || b?.weapons) out.weapons = uniq([ ...toArr(a?.weapons), ...toArr(b?.weapons) ]);
  if(a?.armor || b?.armor) out.armor = uniq([ ...toArr(a?.armor), ...toArr(b?.armor) ]);
  if(a?.tools || b?.tools) out.tools = uniq([ ...toArr(a?.tools), ...toArr(b?.tools) ]);
  if(a?.instruments || b?.instruments) out.instruments = uniq([ ...toArr(a?.instruments), ...toArr(b?.instruments) ]);
  if(a?.skills || b?.skills) out.skills = uniq([ ...toArr(a?.skills), ...toArr(b?.skills) ]);
  return out;
}

export default function RacePreview({ rule, subRuleId, picks, traitDefinitions = {} }) {
  if (!rule) return null;
  const sub = subRuleId ? (rule.subraces || {})[subRuleId] : null;
  const merged = {
    ability: rule.ability,
    speed: (sub && sub.speed) || rule.speed,
    darkvision: (sub && sub.darkvision) || rule.darkvision,
    languages: rule.languages,
    proficiencies: mergeProf(rule.proficiencies, sub?.proficiencies),
    traits: [...(rule.traits||[]), ...((sub&&sub.traits)||[])],
    innateSpells: [...(rule.innateSpells||[]), ...((sub&&sub.innateSpells)||[])],
  };

  const description = sub?.description || rule.description;
  const size = sub?.size || rule.size;

  const abilityIncreases = [];
  const collectFixed = (node) => {
    if (node && node.type === 'fixed' && Array.isArray(node.increases)) abilityIncreases.push(...node.increases);
  };
  collectFixed(rule.ability);
  if (sub && sub.ability) collectFixed(sub.ability);

  const always = (merged.languages?.always || []);
  const extra = Array.isArray(picks?.extraLanguages) ? picks.extraLanguages.map(x=>x.name||x) : [];
  const highExtra = picks?.highElfExtraLanguage ? [picks.highElfExtraLanguage.name || picks.highElfExtraLanguage] : [];
  const languages = Array.from(new Set([...always, ...extra, ...highExtra]));

  const prof = merged.proficiencies || {};

  const traitItems = (merged.traits || [])
    .map((entry) => {
      if (!entry) return null;
      const key = typeof entry === 'string' ? entry : entry.key;
      if (!key) return null;
      const def = traitDefinitions?.[key] || traitDefinitions?.[key?.toLowerCase?.() || ''];
      const metadata = (typeof entry === 'object' && entry.key)
        ? (({ key: _ignored, ...rest }) => rest)(entry)
        : {};
      const metaParts = Object.entries(metadata || {})
        .filter(([prop]) => prop)
        .map(([prop, value]) => `${prop}: ${value}`);
      return {
        key,
        name: def?.name || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        description: def?.description,
        impact: def?.sheet_impact,
        metadata: metaParts.filter(Boolean).join(', ')
      };
    })
    .filter(Boolean);

  return (
    <div className={styles.racePreview}>
      {description && <div className={styles.previewDescription}>{description}</div>}
      <div><strong>Tamanho:</strong> {size || 'Médio'}</div>
      <div><strong>Velocidade:</strong> {merged.speed || 30} ft ({ftToMeters(merged.speed || 30)} m)</div>
      {merged.darkvision && <div><strong>Visão no Escuro:</strong> {merged.darkvision.range} ft</div>}
      {!!abilityIncreases.length && (
        <div><strong>Incrementos de Atributo:</strong> {abilityIncreases.map(ai=>`${ai.ability}+${ai.amount}`).join(', ')}</div>
      )}
      {!!languages.length && <div><strong>Idiomas:</strong> {languages.join(', ')}</div>}
      <div className={styles.previewColumns}>
        <div>
          <div className={styles.previewTitle}>Profic. Armas</div>
          <div>{(prof.weapons||[]).join(', ') || '-'}</div>
        </div>
        <div>
          <div className={styles.previewTitle}>Profic. Armaduras</div>
          <div>{(prof.armor||[]).join(', ') || '-'}</div>
        </div>
        <div>
          <div className={styles.previewTitle}>Ferramentas</div>
          <div>{Array.isArray(prof.tools?.fixed)? prof.tools.fixed.join(', '): (prof.tools?.choices ? `Escolha ${prof.tools.choiceCount}` : '-')}</div>
        </div>
        <div>
          <div className={styles.previewTitle}>Perícias</div>
          <div>{Array.isArray(prof.skills?.fixed)? prof.skills.fixed.join(', '): (prof.skills?.choiceCount ? `Escolha ${prof.skills.choiceCount}` : '-')}</div>
        </div>
      </div>
      {!!traitItems.length && (
        <div>
          <strong>Traços:</strong>
          <ul className={styles.traitsList}>
            {traitItems.map((trait) => (
              <li key={trait.key}>
                <span className={styles.traitName}>{trait.name}</span>
                {trait.metadata && <span className={styles.traitMeta}> ({trait.metadata})</span>}
                {trait.description && <div className={styles.traitDescription}>{trait.description}</div>}
                {trait.impact && <div className={styles.traitImpact}><em>{trait.impact}</em></div>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!!merged.innateSpells?.length && (
        <div><strong>Magias Inatas:</strong> {merged.innateSpells.map(s=>`${s.spells.join(', ')} (nv ${s.level})`).join('; ')}</div>
      )}
    </div>
  );
}

