"use client";

import { useState, useEffect, useMemo } from "react";
import CharacterFormDialog from "../../../_components/character/CharacterFormDialog";
import CharacterInfo from "../../../_components/character/CharacterInfo";
import CharacterCard from "../../../_components/character/CharacterCard";
import Button from "../../../_components/UI/Button";
import { crudFor } from "../../../_services/railsApi";
import { useAuth } from "../../../_context/AuthContext";
import styles from "../../../_styles/characterPage/Characters.module.css";

const CharactersPage = () => {
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreationOpen, setIsCreationOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const { role } = useAuth();
  const charactersApi = useMemo(
    () => crudFor("characters", role),
    [role]
  );

  useEffect(() => {
    if (!role) return;
    charactersApi
      .getAll()
      .then(({characters}) => setCharacters(characters))
      .catch(console.error)
  }, [role]);

  const handleAddCharacter = (newChar) => {
    setCharacters((prev) => [...prev, newChar]);
    setIsCreationOpen(false);
  };

  const closeEditCharacter = () => {
    setIsEditOpen(false);
    setSelectedCharacter(null);
  }

  const editCharacter = (chrac) => {

    
    setCharacters((prev) =>
      prev.map((c) => (c.id === chrac.id ? chrac : c))
    );
    closeEditCharacter()
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
          onSave={handleAddCharacter}
          charactersApi={charactersApi}
        />
      )}

      {selectedCharacter && isEditOpen && (
        <CharacterFormDialog
          isOpen={isEditOpen}
          onClose={() => closeEditCharacter()}
          onSave={editCharacter}
          character={selectedCharacter}
          charactersApi={charactersApi}
        />
      )}

      {selectedCharacter && !isEditOpen && (
        <CharacterInfo
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          setIsEditOpen={() => setIsEditOpen(true)}
          />
      )}
    </div>
  );
};

export default CharactersPage;
