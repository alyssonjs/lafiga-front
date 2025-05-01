"use client";

import { useState, useEffect, useMemo } from "react";
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
import { editAdminUser, getAdminRoles } from "../_services/railsApi";
import { useAuth } from "../_context/AuthContext";
import { crudFor } from "../_services/railsApi";

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
  const { role } = useAuth();

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const usersApi = useMemo(
    () => crudFor("users", role),
    [role]
  );
  const rolesApi = useMemo(
    () => crudFor("roles", role),
    [role]
  );

  
  useEffect(() => {
    if (isEdit) {
      setName(user.name);
      setUsername(user.username);
      setEmail(user.email);
      setPhone(user.phone);
      setRoleId(user.role_id);

      async function fetchRoles() {
        try {
          rolesApi
            .getAll()
            .then(({ roles }) => setRoles(roles))
            .catch(console.error)

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
  }, [isOpen, user, role]);

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
  
      const data = isEdit
        ? await usersApi.update(user.id, payload)
        : await usersApi.create(payload);
      
      console.log(data)
      const savedUser = data.user ?? data;
  
      setSuccessMessage(
        isEdit ? "Usuário atualizado com sucesso!" : "Usuário criado com sucesso!"
      );
  
      onSave(savedUser);
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
            required
          />

          <label htmlFor="username" className={styles.label}>Username:</label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label htmlFor="phone" className={styles.label}>Telefone:</label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <label htmlFor="email" className={styles.label}>E-mail:</label>
          <Input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="role" className={styles.label}>Permissao:</label>

          <Select
            placeholder="Permissao"
            options={roles}
            value={roleId}
            onChange={(val) => setRoleId(val)}
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

export default UserFormDialog;
