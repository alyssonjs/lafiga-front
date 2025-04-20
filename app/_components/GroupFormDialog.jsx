"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "./Dialog";
import Button from "./Button";
import Input from "./Input";
import Select from "./Select";
import TextArea from "./TextArea";
import {
  createAdminGroup,
  editAdminGroup,
} from "../_services/railsApi";
import styles from "../_styles/GroupFormDialog.module.css";

const seasons = [
  { id: "verao", name: "Verão" },
  { id: "inverno", name: "Inverno" },
  { id: "primavera", name: "Primavera" },
  { id: "outono", name: "Outono" },
];

const GroupFormDialog = ({ isOpen, onClose, onSave, group }) => {
  const isEdit = Boolean(group);

  const [name, setName] = useState("");
  const [season, setSeason] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEdit) {
      setName(group.name);
      setSeason(group.season);
      setDay(group.day);
      setYear(group.year);
      setDescription(group.description);
    } else {
      setName("");
      setSeason("");
      setDay("");
      setYear("");
      setDescription("");
    }
    setError(null);
  }, [isOpen, group]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = { name, season, day: Number(day), year: Number(year), description };

    try {
      const resp = isEdit
        ? await editAdminGroup(group.id, payload)
        : await createAdminGroup(payload);

      onSave(resp);
      onClose();
    } catch (e) {
      setError(e.errors?.join(", ") || e.message);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Editar Grupo" : "Novo Grupo"}</DialogTitle>
      </DialogHeader>

      <DialogContent>
        <form onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <label className={styles.label}>Nome:</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />

          <label className={styles.label}>Temporada:</label>
          <Select
            options={seasons}
            placeholder="Selecione temporada"
            value={season}
            onChange={(val) => setSeason(val)}
          />

          <label className={styles.label}>Dia (1–120):</label>
          <Input
            type="number"
            min={1}
            max={120}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            required
          />

          <label className={styles.label}>Ano:</label>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />

          <label className={styles.label}>Descrição:</label>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </form>
      </DialogContent>

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="highlight" onClick={handleSubmit}>
          {isEdit ? "Salvar" : "Criar"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default GroupFormDialog;
