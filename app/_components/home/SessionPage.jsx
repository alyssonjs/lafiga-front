"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../_context/AuthContext";
import { crudFor } from "../../_services/railsApi";

import Button from "../UI/Button";
import ScheduleCard from "../schedule/ScheduleCard";
import CharacterCard from "../character/CharacterCard";
import GroupCard from "../group/GroupCard";

import styles from "../../_styles/home/Session.module.css";
import CalendarIcon from "../../../public/assets/icons/Calendar.svg";
import CharacterIcon from "../../../public/assets/icons/Profile-Male.svg";
import GroupIcon from "../../../public/assets/icons/Multiple-User.svg";


export default function SessionPage() {
  const [error, setError] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [groups, setGroups] = useState([])
  const { role } = useAuth();
  const schedulesApi = useMemo(
    () => crudFor("schedules", 'public'),
    [role]
  );
  const charactersApi = useMemo(
    () => crudFor("characters", 'public'),
    [role]
  );
  const groupsApi = useMemo(
    () => crudFor("groups", 'public'),
    [role]
  );


  useEffect(() => {
    schedulesApi
      .getAll()
      .then((schedule) => setSchedules(schedule))
      .catch(console.error);

    charactersApi
      .getAll()
      .then((characters) => setCharacters(characters.characters))
      .catch(console.error);

    groupsApi
      .getAll()
      .then((groups) => setGroups(groups))
      .catch(console.error);
  }, [role]);

  return (
    <div>
      <div className={styles.pageContainer}>
        <header className={styles.sessionHeader}>
          <h1 className={styles.pageTitle}>Sessões Marcadas</h1>
            <Link href="/calendar">
              <Button size="md" className={styles.linkButton}>
                <Image
                  src={CalendarIcon}
                  alt="Menu"
                  width={20}
                  height={20}
                />
                <span className={styles.buttnoText}>
                  Ver todas
                </span>
              </Button>
            </Link>
        </header>

        {error && <div className={styles.error}>Erro: {error}</div>}

        <section className={styles.sessionContainer}>
          {schedules.slice(0, 6).map((schedule) => (
            <ScheduleCard key={schedule.id} schedule={schedule} />
          ))}
        </section>
      </div>

      <div className={styles.pageContainer}>
        <header className={styles.sessionHeader}>
          <h1 className={styles.pageTitle}>Grupos</h1>
            <Link href="/characters">
              <Button size="md" className={styles.linkButton}>
                <Image
                  src={GroupIcon}
                  alt="Menu"
                  width={20}
                  height={20}
                />
                <span className={styles.buttnoText}>
                  Ver todos
                </span>
              </Button>
            </Link>
        </header>

        {error && <div className={styles.error}>Erro: {error}</div>}

        <section className={styles.characterContainer}>
          {groups.map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
        </section>
      </div>

      <div className={styles.pageContainer}>
        <header className={styles.sessionHeader}>
          <h1 className={styles.pageTitle}>Personagens</h1>
            <Link href="/characters">
              <Button size="md" className={styles.linkButton}>
                <Image
                  src={CharacterIcon}
                  alt="Menu"
                  width={20}
                  height={20}
                />
                <span className={styles.buttnoText}>
                  Ver todos
                </span>
              </Button>
            </Link>
        </header>

        {error && <div className={styles.error}>Erro: {error}</div>}

        <section className={styles.characterContainer}>
          {characters.slice(0, 6).map((char) => (
            <CharacterCard key={char.id} character={char} />
          ))}
        </section>
      </div>
    </div>
  );
}
