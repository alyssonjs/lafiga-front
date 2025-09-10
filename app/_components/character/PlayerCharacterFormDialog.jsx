"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "../UI/Dialog";
import TextArea from "../UI/TextArea";
import Button from "../UI/Button";
import Input from "../UI/Input";
import { crudFor } from "../../_services/railsApi";
import { useAuth } from "../../_context/AuthContext";
import styles from "../../_styles/character/CharacterForm.module.css";

const PlayerCharacterFormDialog = ({ character, isOpen, onClose, onSave }) => {
  const isEdit = Boolean(character);

  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { role } = useAuth();
  const charactersApi = useMemo(
    () => crudFor("characters", role),
    [role]
  );

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
        ? await charactersApi.update(character.id, payload) 
        : await charactersApi.create(payload);

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
