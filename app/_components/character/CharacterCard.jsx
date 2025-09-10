"use client";

import React from "react";
import Card, { CardContent } from "../UI/Card";
import styles from "../../_styles/character/CharacterCard.module.css";

const CharacterCard = ({ character, onClick }) => {
  return (
    <Card onClick={() => onClick(character)} style={{width: "350px"}}>
      <CardContent className={styles.cardContent}>
        <div className={styles.photo}>
          {character.photo ? (
            <img
              src={character.photo}
              alt={`${character.name} photo`}
              className={styles.image}
            />
          ) : (
            <div className={styles.noPhoto}></div>
          )}
        </div>
        <div className={styles.details}>
          <span className={styles.name}>{character.name}</span>
          {character.group && (
            <p className={styles.group}>{character.group.name}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CharacterCard;
