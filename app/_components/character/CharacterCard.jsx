"use client";

import React from "react";
import Card, { CardContent } from "../UI/Card";
import Badge from "../UI/Badge";
import Button from "../UI/Button";
import styles from "../../_styles/character/CharacterCard.module.css";

const CharacterCard = ({ character, onClick, onEdit }) => {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={styles.name}>{character.name}</span>
            {String(character.status) === 'draft' && (
              <Badge variant="medium" style={{ textTransform: 'uppercase', fontSize: 10 }}>Rascunho</Badge>
            )}
          </div>
          {character.group && (
            <p className={styles.group}>{character.group.name}</p>
          )}
          {onEdit && (
            <div style={{ marginTop: 8 }}>
              <Button
                type="button"
                variant="secondary"
                onClick={(e) => { e.stopPropagation(); onEdit(character); }}
              >
                Editar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CharacterCard;
