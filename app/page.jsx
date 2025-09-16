"use client";

import GroupSession from "./_components/home/GroupSession";
import CharacterSession from "./_components/home/CharacterSession";
import ScheduleSession from "./_components/home/ScheduleSession";

const HomePage = () => {

  return (
    <div style={{ padding: 16 }}>
      <ScheduleSession />       
      <GroupSession />
      <CharacterSession />  
    </div>
  );
};

export default HomePage;
