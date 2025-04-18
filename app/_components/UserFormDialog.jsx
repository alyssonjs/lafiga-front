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
import { editAdminUser, getAdminRoles } from "../_services/railsApi";
import styles from "../_styles/CharacterForm.module.css";

const UserFormDialog = ({ user, isOpen, onClose, onSave }) => {
  const isEdit = Boolean(user);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState("");
  const [userId, setUserId] = useState("");
  const [roles, setRoles] = useState([]);

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (isEdit) {
      setName(user.name);
      setUsername(user.username);
      setEmail(user.email);
      setPhone(user.phone);
      setRoleId(user.role_id);

      async function fetchRoles() {
        try {
          const response = await getAdminRoles();
          setRoles(response.roles || response);
        } catch (err) {
          console.error("Erro ao buscar grupos:", err);
          setError("Erro ao buscar grupos");
        }
      }
      fetchRoles();
    } else {
      setName("");
      setBackground("");
      setGroupId("");
      setUserId("");
    }
    setError(null);
  }, [isOpen, user]);

  const resetForm = () => {
    setName("");
    setUsername("");
    setEmail("");
    setRoleId("");
    setPhone("");
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = { name, username, email, phone, role_id: roleId };

      const response = isEdit
        ? await editAdminUser(user.id, payload)
        : await createAdminUser(payload);

      setSuccessMessage("Personagem criado com sucesso!");
    
      onSave(response.user);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Criar Usuario</DialogTitle>
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

          <label htmlFor="username" className={styles.label}>Username:</label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.inputTextarea}
            required
          />

          <label htmlFor="phone" className={styles.label}>Telefone:</label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={styles.inputTextarea}
            required
          />

          <label htmlFor="email" className={styles.label}>E-mail:</label>
          <Input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.inputTextarea}
            required
          />

          <label htmlFor="role" className={styles.label}>Permissao:</label>
          <select
            id="role"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className={styles.selectDropdown}
          >
            <option value="">Permissao</option>
            {roles.map((g) => (
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

export default UserFormDialog;
