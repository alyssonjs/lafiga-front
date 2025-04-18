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
import Select from "./Select";
import Button from "./Button";
import Input from "./Input";
import { createPlayerCharacter, getPublicGroups } from "../_services/railsApi";
import styles from "../_styles/CharacterForm.module.css";

const CharacterFormDialog = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await getPublicGroups();
        setGroups(response.groups || response);
      } catch (err) {
        console.error("Erro ao buscar grupos:", err);
        setError("Erro ao buscar grupos");
      }
    }
    fetchGroups();
  }, []);

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
      const character = { name, background, group_id: groupId ? +groupId : null };
      const response = await createPlayerCharacter(character);
      setSuccessMessage("Personagem criado com sucesso!");
      onCreated(response.character);  
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
          <textarea
            id="background"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className={styles.inputTextarea}
            required
          />

          <label htmlFor="group" className={styles.label}>Grupo:</label>
          <select
            id="group"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className={styles.selectDropdown}
          >
            <option value="">Selecione um grupo</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </form>
      </DialogContent>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="highlight" onClick={handleSubmit}>Salvar</Button>
      </DialogFooter>
    </Dialog>
  );
};

export default CharacterFormDialog;
