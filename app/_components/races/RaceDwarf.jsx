"use client";

import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";

const TOOL_OPTIONS = [
  { id: 'Ferramentas de ferreiro', name: 'Ferramentas de ferreiro' },
  { id: 'Suprimentos de cervejeiro', name: 'Suprimentos de cervejeiro' },
  { id: 'Ferramentas de pedreiro', name: 'Ferramentas de pedreiro' },
];

const RaceDwarf = ({ picks, setPicks }) => (
  <div>
    <label className={styles.label}>Ferramenta de ofício (Anão):</label>
    <Select
      placeholder="Escolha 1"
      options={TOOL_OPTIONS}
      value={picks?.dwarfTool || null}
      onChange={(val) => setPicks({ ...(picks || {}), dwarfTool: val })}
    />
  </div>
);

export default RaceDwarf;

