"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "./Dialog";
import TextArea from "./TextArea";
import Button from "./Button";
import Input from "./Input";
import { createPlayerCharacter, editPlayerCharacter } from "../_services/railsApi";
import styles from "../_styles/CharacterForm.module.css";

const PlayerCharacterFormDialog = ({ character, isOpen, onClose, onSave }) => {
  const isEdit = Boolean(character);

  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (isEdit) {
      setName(character.name);
      setBackground(character.background);
      setGroupId(character.group_id);
      setUserId(character.user_id);
    } else {
      setName("");
      setBackground("");
      setGroupId("");
      setUserId("");
    }
    setError(null);
  }, [isOpen, character]);


  const resetForm = () => {
    setName("");
    setBackground("");
    setGroupId("");
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = { name, background, group_id: groupId ? +groupId : null, user_id: userId };
      
      const response = isEdit 
        ? await editPlayerCharacter(character.id, payload) 
        : await createPlayerCharacter(payload);

      setSuccessMessage("Personagem criado com sucesso!");
      onSave(response.character);  
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Criar Personagem</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          {successMessage && <div className={styles.success}>{successMessage}</div>}

          <label htmlFor="name" className={styles.label}>Nome:</label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.inputText}
            required
          />

          <label htmlFor="background" className={styles.label}>Background:</label>
          <TextArea
            id="background"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className={styles.inputTextarea}
            required
          />
        </form>
      </DialogContent>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="highlight" onClick={handleSubmit}>Salvar</Button>
      </DialogFooter>
    </Dialog>
  );
};

export default PlayerCharacterFormDialog;
