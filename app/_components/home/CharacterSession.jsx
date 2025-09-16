"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../_context/AuthContext";
import { crudFor } from "../../_services/railsApi";
import CharacterCard from "../character/CharacterCard";
import Link from "next/link";
import Image from "next/image";
import Button from "../UI/Button";
import CharacterIcon from "../../../public/assets/icons/Profile-Male.svg";

import styles from "../../_styles/home/Session.module.css";

const CharacterSession = () => {
  const [error, setError] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const charactersApi = useMemo(
    () => crudFor("characters", 'public'),
    [role]
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    charactersApi
      .getAll()
      .then((characters) => setCharacters(characters.characters))
      .catch((e) => setError(e?.message || 'Falha ao carregar personagens'))
      .finally(() => setLoading(false));
  }, [role]);

  return (
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
                style={{ filter: "brightness(0) invert(1)" }}
                />
                <span className={styles.buttnoText}>
                Ver todos
                </span>
            </Button>
            </Link>
        </header>

        {error && <div className={styles.error}>Erro: {error}</div>}
        {loading && <div>Carregando…</div>}
        {!loading && !error && characters.length === 0 && (
            <div>Nenhum personagem encontrado.</div>
        )}
        <section className={styles.characterContainer}>
            {characters.slice(0, 6).map((char) => (
                <CharacterCard key={char.id} character={char} />
            ))}
        </section>
    </div>
  )
}

export default CharacterSession;