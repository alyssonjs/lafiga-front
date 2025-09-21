import { useMemo } from "react";
import { useAuth } from "../../_context/AuthContext";
import Tooltip from "../UI/Tooltip";
import Input from "../UI/Input";
import Select from "../UI/Select";
// styles are injected by parent to avoid path issues across contexts
const noopStyles = {};

const mod = (v) => Math.floor((Number(v || 10) - 10) / 2);
const fmtMod = (m) => {
  const v = Number(m);
  if (!Number.isFinite(v)) return '+0';
  return v >= 0 ? `+${v}` : `${v}`;
};
const abilityKey = { FOR: 'str', DES: 'dex', CON: 'con', INT: 'int', SAB: 'wis', CAR: 'cha' };

const profBonusFor = (lvl) => {
  const n = Number(lvl) || 1;
  if (n >= 17) return 6; if (n >= 13) return 5; if (n >= 9) return 4; if (n >= 5) return 3; return 2;
};

const SKILLS = [
  { id: 'athletics',       name: 'Atletismo',          ability: 'str' },
  { id: 'acrobatics',      name: 'Acrobacia',          ability: 'dex' },
  { id: 'stealth',         name: 'Furtividade',        ability: 'dex' },
  { id: 'arcana',          name: 'Arcanismo',          ability: 'int' },
  { id: 'history',         name: 'História',           ability: 'int' },
  { id: 'investigation',   name: 'Investigação',       ability: 'int' },
  { id: 'nature',          name: 'Natureza',           ability: 'int' },
  { id: 'religion',        name: 'Religião',           ability: 'int' },
  { id: 'animal-handling', name: 'Lidar com Animais',  ability: 'wis' },
  { id: 'insight',         name: 'Intuição',           ability: 'wis' },
  { id: 'medicine',        name: 'Medicina',           ability: 'wis' },
  { id: 'perception',      name: 'Percepção',          ability: 'wis' },
  { id: 'survival',        name: 'Sobrevivência',      ability: 'wis' },
  { id: 'deception',       name: 'Enganação',          ability: 'cha' },
  { id: 'intimidation',    name: 'Intimidação',        ability: 'cha' },
  { id: 'performance',     name: 'Atuação',            ability: 'cha' },
  { id: 'persuasion',      name: 'Persuasão',          ability: 'cha' },
];

const SKILL_NAME_TO_ID = {
  'Atletismo': 'athletics',
  'Acrobacia': 'acrobatics',
  'Furtividade': 'stealth',
  'Arcanismo': 'arcana',
  'História': 'history',
  'Investigação': 'investigation',
  'Natureza': 'nature',
  'Religião': 'religion',
  'Lidar com Animais': 'animal-handling',
  'Intuição': 'insight',
  'Medicina': 'medicine',
  'Percepção': 'perception',
  'Sobrevivência': 'survival',
  'Enganação': 'deception',
  'Intimidação': 'intimidation',
  'Atuação': 'performance',
  'Persuasão': 'persuasion',
};

const AbilityBlock = ({
  label,
  abbr,
  score,
  modVal,
  bonus,
  method,
  value,
  onChange,
  options = [],
  saveProf = false,
  saveTotal = 0,
  skills = [], // [{id,name,total,isProf}]
  readOnly = false,
  userName = 'Jogador',
  styles = noopStyles,
  // Tooltip/breakdown extras
  abilityTip = '',
  skillTips = {}, // { [skillId]: string }
}) => {
  const fmtSigned = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return "+0";
    return v >= 0 ? `+${v}` : `${v}`;
  };
  const sendRoll = (who, profName, total) => {
    try {
      const sign = total >= 0 ? '+ ' : '- ';
      const abs = Math.abs(Number(total) || 0);
      const text = `${who} (Teste de ${profName}: !d20 ${sign}${abs})`;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chat:roll', { detail: { text, modifier: Number(total) || 0 } }));
      }
    } catch (e) { /* noop */ }
  };
  return (
  <div className={styles.abilityBlock}>
    <div className={styles.abilityLeft}>
      <div className={styles.abilityLabelSm}>{label}</div>
      <Tooltip content={abilityTip} placement="right">
        <div className={styles.abilityScoreBig}>{score}</div>
      </Tooltip>
      <Tooltip content={abilityTip} placement="right">
        <div className={styles.abilityModCircle}>{fmtMod(modVal)}</div>
      </Tooltip>
    </div>
    <div className={styles.abilityRight}>
      <div className={styles.abilityHeaderRow}>
        {readOnly ? (
          <div style={{ height: 0 }}></div>
        ) : method === 'point_buy' ? (
          <Input
            type="number"
            min={8}
            max={15}
            value={value}
            onChange={(e)=> onChange(Math.max(8, Math.min(15, Number(e.target.value) || 8)))}
            style={{ width: 70 }}
          />
        ) : (
          <div style={{ width: 100 }}>
            <Select
              placeholder="Selecione"
              options={(options||[]).map((n)=>({id:n,name:String(n)}))}
              value={value || null}
              onChange={(val)=> onChange(Number(val)||0)}
              clearable
              size="sm"
            />
          </div>
        )}
        <span className={styles.small}>Bônus racial/ASI: {fmtSigned(bonus)}</span>
      </div>
      <div className={styles.svRow}>
        <span className={`${styles.dot} ${saveProf ? styles.dotFilled : ''}`}></span>
        <strong>{fmtMod(saveTotal)}</strong>
        <span className={styles.muted}>Teste de Resistência</span>
        <span>
          <button
            type="button"
            onClick={() => sendRoll(userName, `Resistência de ${label}`, saveTotal)}
            title="Rolar d20 para Resistência"
            aria-label={`Rolar para Resistência de ${label}`}
            style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:14, lineHeight:1 }}
          >🎲</button>
        </span>
      </div>
      <div className={styles.skillList}>
        {skills.map(sk => (
          <div key={sk.id} className={styles.skRow}>
            <span className={`${styles.dot} ${sk.isProf ? styles.dotFilled : ''}`}></span>
            <Tooltip content={skillTips[sk.id] || ''}>
              <strong>{fmtMod(sk.total)}</strong>
            </Tooltip>
            <Tooltip content={skillTips[sk.id] || ''}>
              <span>{sk.name}</span>
            </Tooltip>
            <span>
              <button
                type="button"
                onClick={() => sendRoll(userName, sk.name, sk.total)}
                title={`Rolar d20 para ${sk.name}`}
                aria-label={`Rolar para ${sk.name}`}
                style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:14, lineHeight:1 }}
              >🎲</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
)};

const AttributesSidePanel = ({
  str, setStr,
  dex, setDex,
  con, setCon,
  intA, setIntA,
  wis, setWis,
  cha, setCha,
  raceBonuses = {},
  asiBonuses = {},
  // optional detailed sources for ability tooltips: { str: [{label, val}], ... }
  abilitySources = null,
  // base ability scores before race/ASI (for tooltip fallback)
  baseScores = null,
  remainingPoints = 0,
  // new props
  abilityMethod = 'point_buy',
  level = 1,
  classSavingThrows = [], // e.g., ['STR','CON']
  classSkillPicks = [],
  backgroundProfs = [],
  raceSkillProfs = [],
  featSkillProfs = [], // extra skill proficiencies granted by feats (names or ids)
  expertiseSkills = [], // skills with expertise (names or ids)
  halfProfOnUntrained = false, // Jack of All Trades
  rolledScores = [], // e.g., [15,14,13,12,10,8]
  readOnly = false,
  embedded = false, // when true, adapts layout to be inside a Card
  styles = noopStyles,
}) => {
  const { user } = useAuth();
  const userName = (user && (user.name || user.username || user.email)) || 'Jogador';
  // Safe numeric coercion: treat non-numeric like '—' as 0 to avoid NaN in UI
  const asNumber = (n) => {
    const v = Number(n);
    return Number.isFinite(v) ? v : 0;
  };
  const abilityScores = useMemo(() => ({
    str: asNumber(str) + asNumber(raceBonuses.str) + asNumber(asiBonuses.str),
    dex: asNumber(dex) + asNumber(raceBonuses.dex) + asNumber(asiBonuses.dex),
    con: asNumber(con) + asNumber(raceBonuses.con) + asNumber(asiBonuses.con),
    int: asNumber(intA) + asNumber(raceBonuses.int) + asNumber(asiBonuses.int),
    wis: asNumber(wis) + asNumber(raceBonuses.wis) + asNumber(asiBonuses.wis),
    cha: asNumber(cha) + asNumber(raceBonuses.cha) + asNumber(asiBonuses.cha),
  }), [str,dex,con,intA,wis,cha,raceBonuses,asiBonuses]);

  const profBonus = profBonusFor(level);
  // Normalize saving throw ids from backend (EN) to UI (PT-BR)
  const ST_MAP = { STR:'FOR', DEX:'DES', CON:'CON', INT:'INT', WIS:'SAB', CHA:'CAR', FOR:'FOR', DES:'DES', SAB:'SAB', CAR:'CAR' };
  const savingThrowProfs = new Set((classSavingThrows||[])
    .map((s)=> ST_MAP[String(s).toUpperCase()] || String(s).toUpperCase())
  );

  const proficientSkillIds = useMemo(() => {
    const normalize = (x) => {
      if (!x) return '';
      const id = typeof x === 'string' ? x : (x.id || x.name || '');
      // Se vier como nome PT-BR, converte
      if (SKILL_NAME_TO_ID[id]) return SKILL_NAME_TO_ID[id];
      // normaliza caixa
      const lower = String(id).toLowerCase();
      // normaliza variantes com espaço/underscore para hífen
      return lower
        .replace(/[^a-z\- ]/g, '')
        .replace(/\s+/g, '-')
        .replace(/_/g, '-')
        .trim();
    };
    const cls = (classSkillPicks || []).map(normalize);
    const bkg = (backgroundProfs || []).map(normalize);
    const race = (raceSkillProfs || []).map(normalize);
    const feat = (featSkillProfs || []).map(normalize);
    return new Set([...cls, ...bkg, ...race, ...feat].filter(Boolean));
  }, [classSkillPicks, backgroundProfs, raceSkillProfs, featSkillProfs]);

  const expertiseSkillSet = useMemo(() => {
    const normalize = (x) => {
      if (!x) return '';
      const id = typeof x === 'string' ? x : (x.id || x.name || '');
      if (SKILL_NAME_TO_ID[id]) return SKILL_NAME_TO_ID[id];
      const lower = String(id).toLowerCase();
      return lower.replace(/[^a-z\- ]/g, '').replace(/\s+/g, '-').replace(/_/g, '-').trim();
    };
    return new Set((expertiseSkills || []).map(normalize).filter(Boolean));
  }, [expertiseSkills]);

  const skillsByAbility = useMemo(() => {
    const by = { str: [], dex: [], con: [], int: [], wis: [], cha: [] };
    const half = halfProfOnUntrained ? Math.floor(profBonus / 2) : 0;
    SKILLS.forEach(sk => {
      const abScore = abilityScores[sk.ability];
      const isProf = proficientSkillIds.has(sk.id);
      const isExpert = expertiseSkillSet.has(sk.id);
      const profMult = isExpert ? 2 : (isProf ? 1 : 0);
      const total = mod(abScore) + (profBonus * profMult) + (!isProf ? half : 0);
      by[sk.ability].push({ ...sk, total, isProf, isExpert });
    });
    return by;
  }, [proficientSkillIds, expertiseSkillSet, abilityScores, profBonus, halfProfOnUntrained]);

  // Assignment helpers when using rolled pool
  const pool = Array.isArray(rolledScores) ? rolledScores : [];
  const countMap = (arr) => arr.reduce((m, n) => { const k = String(n); m[k] = (m[k]||0) + 1; return m; }, {});
  const poolCount = useMemo(() => countMap(pool), [rolledScores]);
  const currentBase = { str, dex, con, int: intA, wis, cha };
  const assignedCount = (excludeKey = null) => {
    const vals = Object.entries(currentBase)
      .filter(([k]) => k !== excludeKey)
      .map(([,v]) => v)
      .filter((v) => pool.includes(Number(v)));
    return countMap(vals);
  };
  const optionsFor = (key) => {
    const used = assignedCount(key);
    const opts = Object.entries(poolCount)
      .filter(([val,count]) => (count - (used[val]||0)) > 0 || Number(val) === Number(currentBase[key]))
      .map(([val]) => Number(val))
      .sort((a,b)=>b-a);
    return opts;
  };

  // Build tooltips
  const abilityTipFor = (key, label) => {
    try {
      const k = { str:'str', dex:'dex', con:'con', int:'int', wis:'wis', cha:'cha' }[key] || key;
      const total = abilityScores[k];
      const parts = [];
      if (abilitySources && abilitySources[k]) {
        abilitySources[k].forEach(it => { if (it && (it.val ?? it.value) != null) parts.push(`${it.label}: ${it.val ?? it.value}`); });
      } else {
        const base = baseScores?.[k] ?? (method === 'point_buy' ? value : undefined);
        if (base != null) parts.push(`Dado/Base: ${base}`);
        const r = Number(raceBonuses[k] || 0); if (r) parts.push(`Raça: +${r}`);
        const a = Number(asiBonuses[k] || 0); if (a) parts.push(`Incrementos/ASIs: +${a}`);
      }
      return `Total ${label}: ${total}\n` + parts.join('\n');
    } catch (_) { return ''; }
  };

  const skillTipsForAbility = (abilityId) => {
    const list = skillsByAbility[abilityId] || [];
    const map = {};
    list.forEach(sk => {
      const parts = [];
      const m = mod(abilityScores[abilityId]);
      const abLabel = abilityId === 'str' ? 'FOR' : abilityId === 'dex' ? 'DES' : abilityId.toUpperCase();
      parts.push(`Mod ${abLabel}: ${fmtMod(m)}`);
      if (sk.isExpert) parts.push(`Proficiência (Perícia): +${profBonus} x 2`);
      else if (sk.isProf) parts.push(`Proficiência: +${profBonus}`);
      map[sk.id] = parts.join('\n');
    });
    return map;
  };

  return (
    <div className={`${styles.sidePanel} ${embedded ? styles.sidePanelEmbedded : ''}`}>
      {!embedded && <div className={styles.panelTitle}>Atributos</div>}
      {!readOnly && abilityMethod === 'point_buy' && (
        <div className={styles.small}>Pontos restantes: {Math.max(0, remainingPoints)}</div>
      )}
      {!readOnly && abilityMethod === 'roll_4d6' && (
        <div className={styles.small}>Valores rolados: {pool.length ? pool.join(', ') : '—'}</div>
      )}

      {/* Proficiency bonus moved to the top */}
      <div className={styles.profBox} style={{ marginTop: 6, marginBottom: 6 }}>
        <div className={styles.profCircle}>{`+${profBonus}`}</div>
        <div className={styles.panelTitle}>Bônus de Proficiência</div>
      </div>

      <div className={styles.abilityList}>
        <AbilityBlock label="FORÇA" abbr="FOR" score={abilityScores.str} modVal={mod(abilityScores.str)} userName={userName} styles={styles}
          bonus={(raceBonuses.str||0)+(asiBonuses.str||0)} method={abilityMethod}
          value={abilityMethod==='roll_4d6' ? (pool.includes(Number(str))? Number(str): null) : str}
          onChange={setStr} options={abilityMethod==='roll_4d6' ? optionsFor('str') : []}
          saveProf={savingThrowProfs.has('FOR')} saveTotal={mod(abilityScores.str)+(savingThrowProfs.has('FOR')?profBonus:0)}
          skills={skillsByAbility.str}
          abilityTip={abilityTipFor('str', 'FORÇA')}
          skillTips={skillTipsForAbility('str')}
          readOnly={readOnly}
        />
        <AbilityBlock label="DESTREZA" abbr="DES" score={abilityScores.dex} modVal={mod(abilityScores.dex)} userName={userName} styles={styles}
          bonus={(raceBonuses.dex||0)+(asiBonuses.dex||0)} method={abilityMethod}
          value={abilityMethod==='roll_4d6' ? (pool.includes(Number(dex))? Number(dex): null) : dex}
          onChange={setDex} options={abilityMethod==='roll_4d6' ? optionsFor('dex') : []}
          saveProf={savingThrowProfs.has('DES')} saveTotal={mod(abilityScores.dex)+(savingThrowProfs.has('DES')?profBonus:0)}
          skills={skillsByAbility.dex}
          abilityTip={abilityTipFor('dex', 'DESTREZA')}
          skillTips={skillTipsForAbility('dex')}
          readOnly={readOnly}
        />
        <AbilityBlock label="CONSTITUIÇÃO" abbr="CON" score={abilityScores.con} modVal={mod(abilityScores.con)} userName={userName} styles={styles}
          bonus={(raceBonuses.con||0)+(asiBonuses.con||0)} method={abilityMethod}
          value={abilityMethod==='roll_4d6' ? (pool.includes(Number(con))? Number(con): null) : con}
          onChange={setCon} options={abilityMethod==='roll_4d6' ? optionsFor('con') : []}
          saveProf={savingThrowProfs.has('CON')} saveTotal={mod(abilityScores.con)+(savingThrowProfs.has('CON')?profBonus:0)}
          skills={skillsByAbility.con}
          abilityTip={abilityTipFor('con', 'CONSTITUIÇÃO')}
          skillTips={skillTipsForAbility('con')}
          readOnly={readOnly}
        />
        <AbilityBlock label="INTELIGÊNCIA" abbr="INT" score={abilityScores.int} modVal={mod(abilityScores.int)} userName={userName} styles={styles}
          bonus={(raceBonuses.int||0)+(asiBonuses.int||0)} method={abilityMethod}
          value={abilityMethod==='roll_4d6' ? (pool.includes(Number(intA))? Number(intA): null) : intA}
          onChange={setIntA} options={abilityMethod==='roll_4d6' ? optionsFor('int') : []}
          saveProf={savingThrowProfs.has('INT')} saveTotal={mod(abilityScores.int)+(savingThrowProfs.has('INT')?profBonus:0)}
          skills={skillsByAbility.int}
          abilityTip={abilityTipFor('int', 'INTELIGÊNCIA')}
          skillTips={skillTipsForAbility('int')}
          readOnly={readOnly}
        />
        <AbilityBlock label="SABEDORIA" abbr="SAB" score={abilityScores.wis} modVal={mod(abilityScores.wis)} userName={userName} styles={styles}
          bonus={(raceBonuses.wis||0)+(asiBonuses.wis||0)} method={abilityMethod}
          value={abilityMethod==='roll_4d6' ? (pool.includes(Number(wis))? Number(wis): null) : wis}
          onChange={setWis} options={abilityMethod==='roll_4d6' ? optionsFor('wis') : []}
          saveProf={savingThrowProfs.has('SAB')} saveTotal={mod(abilityScores.wis)+(savingThrowProfs.has('SAB')?profBonus:0)}
          skills={skillsByAbility.wis}
          abilityTip={abilityTipFor('wis', 'SABEDORIA')}
          skillTips={skillTipsForAbility('wis')}
          readOnly={readOnly}
        />
        <AbilityBlock label="CARISMA" abbr="CAR" score={abilityScores.cha} modVal={mod(abilityScores.cha)} userName={userName} styles={styles}
          bonus={(raceBonuses.cha||0)+(asiBonuses.cha||0)} method={abilityMethod}
          value={abilityMethod==='roll_4d6' ? (pool.includes(Number(cha))? Number(cha): null) : cha}
          onChange={setCha} options={abilityMethod==='roll_4d6' ? optionsFor('cha') : []}
          saveProf={savingThrowProfs.has('CAR')} saveTotal={mod(abilityScores.cha)+(savingThrowProfs.has('CAR')?profBonus:0)}
          skills={skillsByAbility.cha}
          abilityTip={abilityTipFor('cha', 'CARISMA')}
          skillTips={skillTipsForAbility('cha')}
          readOnly={readOnly}
        />
      </div>

      

      {/* Removido: Salvaguardas/Perícias globais — agora em cada bloco de atributo */}
    </div>
  );
};

export default AttributesSidePanel;
