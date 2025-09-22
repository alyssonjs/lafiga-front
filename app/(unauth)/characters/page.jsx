"use client";

import React from "react";
import Image from "next/image";
import styles from "../../_styles/charactersPage/CharactersPage.module.css";
import Card, { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../_components/UI/Card";
import Badge from "../../_components/UI/Badge";
import Button from "../../_components/UI/Button";

const mockCharacters = [
  {
    id: 1,
    name: "Sabrino",
    image: "/sabrino.png",
    class: "Mago",
    level: 5,
    race: "Elfo",
  },
  {
    id: 2,
    name: "Morgano",
    image: "/sabrino.png",
    class: "Guerreiro",
    level: 4,
    race: "Humano",
  },
  {
    id: 3,
    name: "Ilahim",
    image: "/Ilahim.jpeg",
    class: "Clérigo",
    level: 3,
    race: "Anão",
  },
  {
    id: 4,
    name: "Naali",
    image: "/Naali.jpeg",
    class: "Druida",
    level: 6,
    race: "Elfa",
  },
  {
    id: 5,
    name: "Oorun",
    image: "/Oorun.jpeg",
    class: "Bardo",
    level: 2,
    race: "Tiefling",
  },
  {
    id: 6,
    name: "Rhaaz",
    image: "/Rhaaz.jpeg",
    class: "Barbaro",
    level: 7,
    race: "Orc",
  },
  {
    id: 7,
    name: "Vaëham",
    image: "/Vaëham.jpeg",
    class: "Feiticeiro",
    level: 5,
    race: "Humano",
  },
  {
    id: 8,
    name: "Arendal",
    image: "/Arendal.jpeg",
    class: "Paladino",
    level: 4,
    race: "Meio-Elfo",
  },
  {
    id: 9,
    name: "Kaländriz",
    image: "/Kaländriz.jpeg",
    class: "Ladino",
    level: 3,
    race: "Halfling",
  },
  {
    id: 10,
    name: "Aëlar",
    image: "/Aëlar.jpeg",
    class: "Monge",
    level: 6,
    race: "Elfo",
  },
];

const CharactersPage = () => {
  return (
    <section className={styles.charactersSection}>
      <h1 className={styles.charactersTitle}>Personagens</h1>
      <div className={styles.charactersGrid}>
        {mockCharacters.map((char) => (

        <Card key={char.id} className={styles.characterCardWithFab} disableHover={true}>
          <div className={styles.characterImageContainer}>
            <Image
              src={char.image}
              alt={char.name}
              width={80}
              height={80}
              className={styles.characterImage}
            />
          </div>
          <CardContent>
            <h2 className={styles.characterName}>{char.name}</h2>
            <ul className={styles.characterInfo}>
              <li>{char.class}</li>
              <li>{char.race}</li>
              <li>Level: {char.level}</li>
            </ul>
          </CardContent>
          <Button className={styles.fabButton} variant="primary">
            ...
          </Button>
        </Card>

          // <div key={char.id} className={styles.characterCard}>
          //   <Image
          //     src={char.image}
          //     alt={char.name}
          //     width={80}
          //     height={80}
          //     className={styles.characterImage}
          //   />
          //   <div className={styles.characterName}>{char.name}</div>
          //   <div className={styles.characterClass}>{char.class} • Nível {char.level}</div>
          //   <div className={styles.characterRace}>{char.race}</div>
          // </div>
        ))}
      </div>
    </section>
  );
}

export default CharactersPage;