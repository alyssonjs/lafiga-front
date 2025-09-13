"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import CharacterSheet from "../../_components/CharacterSheet";
import CharacterCard from "../../_components/character/CharacterCard";
import Button from "../../_components/UI/Button";
import { useAuth } from "../../_context/AuthContext";
import { crudFor } from "../../_services/railsApi";
import styles from "../../_styles/characterPage/Characters.module.css";

const CharactersPage = () => {
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const router = useRouter();
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

  const handleCardClick = async (char) => {
    console.log('Clicou no personagem:', char.name, char.id);
    console.log('Dados do personagem:', char);
    
    try {
      // Verificar se o personagem tem sheet e classe
      // if (!char.sheet_id || !char.main_class) {
      //   console.log('Sem sheet ou classe - abrindo modal');
      //   setSelectedCharacter(char);
      //   return;
      // }
      
      const api = String(char.main_class?.api_index || '').toLowerCase();
      const namePT = String(char.main_class?.name || '');
      const map = {
        barbarian: 'barbaro',
        bard: 'bardo',
        warlock: 'bruxo',
        cleric: 'clerigo',
        druid: 'druida',
        sorcerer: 'feiticeiro',
        fighter: 'guerreiro',
        rogue: 'ladino',
        wizard: 'mago',
        monk: 'monge',
        paladin: 'paladino',
        ranger: 'patrulheiro',
      };
      let finalSlug = map[api];
      
      // Verificar subclasse especiais com ficha própria
      const subName = char.main_class?.subclass?.name || '';
      const subNorm = subName.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
      if (subNorm.includes('cavaleiro arcano')) finalSlug = 'guerreirocavaleiroarcano';
      if (subNorm.includes('trapaceiro arcano')) finalSlug = 'ladinotrapaceiroarcano';
      
      // Fallback: slug do nome PT
      if (!finalSlug) {
        finalSlug = namePT
          .normalize('NFD').replace(/\p{Diacritic}/gu, '')
          .toLowerCase().replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      if (!finalSlug) finalSlug = 'barbaro';
      
      console.log('Navegando para:', `/classes/${finalSlug}?cid=${char.id}`);
      // Abrir ficha específica na rota unificada /classes/:slug com o id do personagem
      router.push(`/classes/${finalSlug}?cid=${char.id}`);
    } catch (e) {
      console.error('Falha ao abrir ficha por classe:', e);
      // fallback: abrir modal
      // setSelectedCharacter(char);
    }
  };
  
  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <Button size="lg" onClick={() => router.push("/my_characters/new") }>
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
      {/* {selectedCharacter && isEditOpen && (
        <PlayerCharacterFormDialog
          isOpen={isEditOpen}
          onClose={() => closeEditCharacter()}
          onSave={editCharacter}
          character={selectedCharacter}
        />
      )} */}

      {selectedCharacter && !isEditOpen && (
        <CharacterSheet
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          setIsEditOpen={() => setIsEditOpen(true)}
        />
      )}
    </div>
  );
};

export default CharactersPage;
