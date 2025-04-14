"use client";

import { useState, useEffect } from "react";
import CharacterFormDialog from "../../_components/CharacterFormDialog";
import CharacterInfo from "../../_components/CharacterInfo";
import CharacterCard from "../../_components/CharacterCard";
import Button from "../../_components/Button";
import { getAdminCharacters } from "../../_services/railsApi";
import styles from "../../_styles/Characters.module.css";

const CharactersPage = () => {
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState(null);
  const [isCreationOpen, setIsCreationOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  useEffect(() => {
    async function fetchCharacters() {
      try {
        const data = await getAdminCharacters();
        setCharacters(data.characters);
      } catch (err) {
        console.error("Erro ao buscar personagens:", err);
        setError(err.message);
      }
    }
    fetchCharacters();
  }, []);

  const handleAddCharacter = (newChar) => {
    setCharacters((prev) => [...prev, newChar]);
    setIsCreationOpen(false);
  };

  const handleCardClick = (char) => {
    setSelectedCharacter((prev) =>
      prev?.id === char.id ? null : char
    );
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <Button size="lg" onClick={() => setIsCreationOpen(true)}>
          Criar Personagem
        </Button>
      </div>

      {error && <div className={styles.error}>Erro: {error}</div>}

      <div className={styles.cardsContainer}>
        {characters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            onClick={() => handleCardClick(char)}
          />
        ))}
      </div>

      {isCreationOpen && (
        <CharacterFormDialog
          isOpen={open}
          onClose={() => setIsCreationOpen(false)}
          onCreated={handleAddCharacter}
        />
      )}

      {selectedCharacter && (
        <CharacterInfo
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
    </div>
  );
};

export default CharactersPage;
