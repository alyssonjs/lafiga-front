"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "./Dialog";
import Input from "./Input";
import Button from "./Button";
import DatePicker from "./DatePicker";
import Select from "./Select";
import styles from "../_styles/ScheduleFormDialog.module.css";

export default function ScheduleFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData = {},
  groups = [],
}) {

  const formatDate = (iso) => (iso ? dayjs(iso).format("DD/MM/YYYY") : "");

  const [date, setDate] = useState(formatDate(initialData.date));
  const [dateDimensionId, setDateDimensionId] = useState(
    initialData.date_dimension_id || null
  );
  const [title, setTitle] = useState(initialData.title || "");
  const [groupId, setGroupId] = useState(initialData.group_id || "");
  const [status, setStatus] = useState(initialData.status ?? 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDate(formatDate(initialData.date));
    setDateDimensionId(initialData.date_dimension_id || null);
    setTitle(initialData.title || "");
    setGroupId(initialData.group_id || "");
    setStatus(initialData.status ?? 0);
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!dateDimensionId) {
      setError("Selecione uma data válida.");
      return;
    }
    if (!title.trim()) {
      setError("Título é obrigatório.");
      return;
    }
    if (!groupId) {
      setError("Selecione um grupo.");
      return;
    }

    onSave({
      ...initialData,
      date_dimension_id: dateDimensionId,
      date,        // envia no formato DD/MM/YYYY
      title: title.trim(),
      group_id: groupId,
      status,
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      {error && <div className={styles.error}>{error}</div>}
      <DialogHeader>
        <DialogTitle>
          {initialData.id ? "Editar Sessão" : "Nova Sessão"}
        </DialogTitle>
        <DialogDescription>
          {initialData.id
            ? "Atualize os dados da sessão."
            : "Preencha os dados para criar uma nova sessão."}
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <label className={styles.label}>Data:</label>
          <DatePicker
            date={date}
            onChange={(newDate, dimId) => {
              setDate(newDate);
              setDateDimensionId(dimId);
            }}
          />

          <label className={styles.label}>Título:</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da sessão"
            required
          />

          <label className={styles.label}>Grupo:</label>
          <Select
            options={groups.map((g) => ({
              id: g.id.toString(),
              name: g.name,
            }))}
            placeholder="Selecione um grupo"
            value={groupId?.toString() || null}
            onChange={(val) => setGroupId(Number(val))}
            required
          />

          <label className={styles.label}>Status:</label>
          <Select
            options={[
              { id: "0", name: "Pendente" },
              { id: "1", name: "Confirmada" },
              { id: "2", name: "Cancelada" },
            ]}
            placeholder="Selecione o status"
            value={status.toString()}
            onChange={(val) => setStatus(Number(val))}
            required
          />
        </form>
      </DialogContent>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="highlight" onClick={handleSubmit}>
          {initialData.id ? "Salvar" : "Criar"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
