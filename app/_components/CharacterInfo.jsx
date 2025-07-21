"use client";

import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "./Dialog";
import Button from "./Button";
import styles from "../_styles/CharacterInfo.module.css";

const CharacterInfo = ({ character, onClose, setIsEditOpen }) => {
  return (
    <Dialog onClose={onClose}>
      <div className={styles.cardSize}>
        <DialogHeader>
          <DialogTitle>{character.name}</DialogTitle>
          {character.group && (
            <DialogDescription>Grupo: {character.group.name}</DialogDescription>
          )}
        </DialogHeader>

        <DialogContent>
          <div className={styles.infoPhoto}>
            {character.photo ? (
              <img src={character.photo} alt={character.name} />
            ) : (
              <div className={styles.noPhoto}></div>
            )}
          </div>
          <div className={styles.infoDetails}>
            <div className={styles.background}>
              <strong>Background:</strong>
              <div
                className={styles.backgroundText}
                dangerouslySetInnerHTML={{ __html: character.background }}
              />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="highlight" onClick={() => setIsEditOpen(true)}>Editar</Button>
        </DialogFooter>     
      </div>
    </Dialog>
  );
};

export default CharacterInfo;
