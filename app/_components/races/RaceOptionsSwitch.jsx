"use client";

import RaceDwarf from "./RaceDwarf";
import RaceElf from "./RaceElf";
import RaceHuman from "./RaceHuman";
import RaceHalfElf from "./RaceHalfElf";
import RaceDragonborn from "./RaceDragonborn";
import RaceGnome from "./RaceGnome";
import RaceHalfling from "./RaceHalfling";
import RaceHalfOrc from "./RaceHalfOrc";
import RaceTiefling from "./RaceTiefling";

// Exige: ruleId (ex.: 'elf'), subRuleId (ex.: 'high'), picks, setPicks
// Opcional: wizardCantripOptions, cantripOptions, skillOptions
const RaceOptionsSwitch = ({
  ruleId,
  subRuleId,
  picks,
  setPicks,
  wizardCantripOptions,
  cantripOptions,
  skillOptions,
  klasses = [],
}) => {
  switch (ruleId) {
    case 'dwarf':
      return <RaceDwarf picks={picks} setPicks={setPicks} />;
    case 'elf':
      return (
        <RaceElf
          subRuleId={subRuleId}
          picks={picks}
          setPicks={setPicks}
          wizardCantripOptions={wizardCantripOptions}
          cantripOptions={cantripOptions}
        />
      );
    case 'human':
      return (
        <RaceHuman
          subRuleId={subRuleId}
          picks={picks}
          setPicks={setPicks}
          skillOptions={skillOptions}
          klasses={klasses}
        />
      );
    case 'half_elf':
      return <RaceHalfElf picks={picks} setPicks={setPicks} skillOptions={skillOptions} />;
    case 'dragonborn':
      return <RaceDragonborn picks={picks} setPicks={setPicks} />;
    case 'gnome':
      return <RaceGnome />;
    case 'halfling':
      return <RaceHalfling />;
    case 'half_orc':
      return <RaceHalfOrc />;
    case 'tiefling':
      return <RaceTiefling />;
    default:
      return null;
  }
};

export default RaceOptionsSwitch;
