"use client";

import { useState } from "react";
import Input from "../UI/Input";
import Button from "../UI/Button";
import styles from "../../_styles/character/CharacterForm.module.css";

function roll4d6DropLowest() {
  const dice = [1,2,3,4].map(() => (Math.floor(Math.random() * 6) + 1));
  const sorted = [...dice].sort((a,b)=>b-a);
  const sum = sorted.slice(0,3).reduce((s,n)=>s+n,0);
  return { dice, sum };
}

const StepAbilities = ({
  abilityMethod, setAbilityMethod,
  remainingPointBuy,
  str, setStr,
  dex, setDex,
  con, setCon,
  intA, setIntA,
  wis, setWis,
  cha, setCha,
  clamp,
  applyStandardArray,
}) => {
  const [rolls, setRolls] = useState({}); // { str:{dice,sum}, ... }

  const onRoll = (key, setter) => {
    const r = roll4d6DropLowest();
    setter(r.sum);
    setRolls((prev) => ({ ...prev, [key]: r }));
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.radioGroup}>
        <label>
          <input type="radio" name="abilityMethod" value="manual" checked={abilityMethod === "manual"} onChange={() => setAbilityMethod("manual")} />
          Manual
        </label>
        <label>
          <input type="radio" name="abilityMethod" value="point_buy" checked={abilityMethod === "point_buy"} onChange={() => setAbilityMethod("point_buy")} />
          Point‑buy (27 pts)
        </label>
        <label>
          <input type="radio" name="abilityMethod" value="standard_array" checked={abilityMethod === "standard_array"} onChange={() => setAbilityMethod("standard_array")} />
          Array padrão (15,14,13,12,10,8)
        </label>
        <label>
          <input type="radio" name="abilityMethod" value="roll_4d6" checked={abilityMethod === "roll_4d6"} onChange={() => setAbilityMethod("roll_4d6")} />
          Rolar 4d6 (3 maiores)
        </label>
        {abilityMethod === "standard_array" && (
          <Button type="button" variant="secondary" onClick={applyStandardArray}>Aplicar Array Padrão</Button>
        )}
      </div>

      {abilityMethod === "point_buy" && (
        <div className={styles.small}>Pontos restantes: {Math.max(0, remainingPointBuy)}</div>
      )}

      <div className={styles.abilitiesGrid}>
        <div>
          <label>FOR</label>
          {abilityMethod === 'roll_4d6' ? (
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <Button type="button" variant="secondary" onClick={()=>onRoll('str', setStr)}>Rolar 4d6</Button>
              <div className={styles.small}>{rolls.str ? `${rolls.str.dice.join(' + ')} → ${rolls.str.sum}` : '—'}</div>
            </div>
          ) : (
            abilityMethod === 'point_buy' ? (
              <Input type="number" min={8} max={15} value={str} onChange={(e)=> setStr(clamp(e.target.value, 8, 15))} />
            ) : (
              <Input type="number" min={1} value={str} onChange={(e)=> setStr(clamp(e.target.value, 1, 999))} />
            )
          )}
        </div>
        <div>
          <label>DES</label>
          {abilityMethod === 'roll_4d6' ? (
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <Button type="button" variant="secondary" onClick={()=>onRoll('dex', setDex)}>Rolar 4d6</Button>
              <div className={styles.small}>{rolls.dex ? `${rolls.dex.dice.join(' + ')} → ${rolls.dex.sum}` : '—'}</div>
            </div>
          ) : (
            abilityMethod === 'point_buy' ? (
              <Input type="number" min={8} max={15} value={dex} onChange={(e)=> setDex(clamp(e.target.value, 8, 15))} />
            ) : (
              <Input type="number" min={1} value={dex} onChange={(e)=> setDex(clamp(e.target.value, 1, 999))} />
            )
          )}
        </div>
        <div>
          <label>CON</label>
          {abilityMethod === 'roll_4d6' ? (
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <Button type="button" variant="secondary" onClick={()=>onRoll('con', setCon)}>Rolar 4d6</Button>
              <div className={styles.small}>{rolls.con ? `${rolls.con.dice.join(' + ')} → ${rolls.con.sum}` : '—'}</div>
            </div>
          ) : (
            abilityMethod === 'point_buy' ? (
              <Input type="number" min={8} max={15} value={con} onChange={(e)=> setCon(clamp(e.target.value, 8, 15))} />
            ) : (
              <Input type="number" min={1} value={con} onChange={(e)=> setCon(clamp(e.target.value, 1, 999))} />
            )
          )}
        </div>
        <div>
          <label>INT</label>
          {abilityMethod === 'roll_4d6' ? (
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <Button type="button" variant="secondary" onClick={()=>onRoll('int', setIntA)}>Rolar 4d6</Button>
              <div className={styles.small}>{rolls.int ? `${rolls.int.dice.join(' + ')} → ${rolls.int.sum}` : '—'}</div>
            </div>
          ) : (
            abilityMethod === 'point_buy' ? (
              <Input type="number" min={8} max={15} value={intA} onChange={(e)=> setIntA(clamp(e.target.value, 8, 15))} />
            ) : (
              <Input type="number" min={1} value={intA} onChange={(e)=> setIntA(clamp(e.target.value, 1, 999))} />
            )
          )}
        </div>
        <div>
          <label>SAB</label>
          {abilityMethod === 'roll_4d6' ? (
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <Button type="button" variant="secondary" onClick={()=>onRoll('wis', setWis)}>Rolar 4d6</Button>
              <div className={styles.small}>{rolls.wis ? `${rolls.wis.dice.join(' + ')} → ${rolls.wis.sum}` : '—'}</div>
            </div>
          ) : (
            abilityMethod === 'point_buy' ? (
              <Input type="number" min={8} max={15} value={wis} onChange={(e)=> setWis(clamp(e.target.value, 8, 15))} />
            ) : (
              <Input type="number" min={1} value={wis} onChange={(e)=> setWis(clamp(e.target.value, 1, 999))} />
            )
          )}
        </div>
        <div>
          <label>CAR</label>
          {abilityMethod === 'roll_4d6' ? (
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <Button type="button" variant="secondary" onClick={()=>onRoll('cha', setCha)}>Rolar 4d6</Button>
              <div className={styles.small}>{rolls.cha ? `${rolls.cha.dice.join(' + ')} → ${rolls.cha.sum}` : '—'}</div>
            </div>
          ) : (
            abilityMethod === 'point_buy' ? (
              <Input type="number" min={8} max={15} value={cha} onChange={(e)=> setCha(clamp(e.target.value, 8, 15))} />
            ) : (
              <Input type="number" min={1} value={cha} onChange={(e)=> setCha(clamp(e.target.value, 1, 999))} />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default StepAbilities;
