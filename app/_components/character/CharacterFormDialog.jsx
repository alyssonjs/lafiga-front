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
import Select from "../UI/Select";
import Input from "../UI/Input";
import { useAuth } from "../../_context/AuthContext";
import { crudFor } from "../../_services/railsApi";
import styles from "../../_styles/character/CharacterForm.module.css";

const CharacterFormDialog = ({ 
  character,
  isOpen,
  onClose,
  onSave, 
  charactersApi
 }) => {
  const isEdit = Boolean(character);

  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { role } = useAuth();
  const groupsApi = useMemo(
    () => crudFor("groups", role),
    [role]
  );
  const usersApi = useMemo(
    () => crudFor("users", role),
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

  useEffect(() => {
    if (!role) return;

    (async () => {
      try {
        const [{ groups }, { users }] = await Promise.all([
          groupsApi.getAll(),
          usersApi.getAll(),
        ]);

        setGroups(groups);
        setUsers(users);
      } catch (err) {
        console.error("Falha ao carregar dados:", err);
        setError("Não foi possível carregar grupos ou usuários.");
      }
    })();
  }, [role]);


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
      console.log()
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
            required
          />

          <label htmlFor="background" className={styles.label}>Background:</label>
          <TextArea
            id="background"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            required
          />

          <label htmlFor="group" className={styles.label}>Grupo:</label>
          <Select
            placeholder="Selecione um grupo"
            options={groups}
            value={groupId}
            onChange={(val) => setGroupId(val)}
          />
          <label htmlFor="user" className={styles.label}>User:</label>
          <Select
            placeholder="Selecione o usuario"
            options={users}
            value={userId}
            onChange={(val) => setUserId(val)}
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

export default CharacterFormDialog;
