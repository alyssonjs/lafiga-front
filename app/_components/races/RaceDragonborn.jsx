"use client";

import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";

const ANCESTRY_OPTIONS = [
  {id:'black',name:'Preto (Ácido)'},{id:'blue',name:'Azul (Relâmpago)'},{id:'brass',name:'Latão (Fogo)'},
  {id:'bronze',name:'Bronze (Relâmpago)'},{id:'copper',name:'Cobre (Ácido)'},{id:'gold',name:'Ouro (Fogo)'},
  {id:'green',name:'Verde (Veneno)'},{id:'red',name:'Vermelho (Fogo)'},{id:'silver',name:'Prata (Frio)'},{id:'white',name:'Branco (Frio)'}
];

const RaceDragonborn = ({ picks, setPicks }) => (
  <div>
    <label className={styles.label}>Ancestralidade Dracônica (Draconato)</label>
    <Select
      placeholder="Escolha 1"
      options={ANCESTRY_OPTIONS}
      value={picks?.draconicAncestry || null}
      onChange={(val)=>setPicks({ ...(picks||{}), draconicAncestry: val })}
    />
  </div>
);

export default RaceDragonborn;
