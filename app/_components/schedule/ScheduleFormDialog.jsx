"use client";

import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "../UI/Dialog";
import Input from "../UI/Input";
import Button from "../UI/Button";
import DatePicker from "../UI/DatePicker";
import Select from "../UI/Select";
import styles from "../../_styles/schedule/ScheduleFormDialog.module.css";
import { useAuth } from "../../_context/AuthContext";
import { crudFor } from "../../_services/railsApi";

export default function ScheduleFormDialog({
  userRole,
  isOpen,
  onClose,
  onSave,
  changeDateAvailability,
  initialData = {},
  disabledDates = [],
}) {
  const formatDate = (iso) => (iso ? dayjs(iso).format("DD/MM/YYYY") : "");
  const { role } = useAuth();
  const [date, setDate] = useState(formatDate(initialData.date));
  const [groups, setGroups] = useState([]);
  const [dateDimensionId, setDateDimensionId] = useState(
    initialData.date_dimension_id || null
  );
  const [title, setTitle] = useState(initialData.title || "");
  const [groupId, setGroupId] = useState(initialData.group_id || "");
  const [status, setStatus] = useState(
    typeof initialData.status !== 'undefined'
      ? initialData.status
      : (role === 'admin' ? 'reserved' : 'waiting')
  );
  const [disableDate, setDisableDate] = useState(false);
  const [error, setError] = useState(null);
  const groupsApi = useMemo(
    () => crudFor("groups", role),
    [role]
  );

  useEffect(() => {
    groupsApi
      .getAll()
      .then(({ groups }) => setGroups(groups))
      .catch(console.error)
  }, [groupsApi]);
  
  useEffect(() => {
    setDate(formatDate(initialData.date));
    setDateDimensionId(initialData.date_dimension_id || null);
    setTitle(initialData.title || "");
    setGroupId(initialData.group_id || "");
    setStatus(
      typeof initialData.status !== 'undefined'
        ? initialData.status
        : (role === 'admin' ? 'reserved' : 'waiting')
    );
    setDisableDate(false);
    setError(null);
  }, [initialData, isOpen, role]);

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
      date,
      title: title.trim(),
      group_id: groupId,
      status,
      disable_date: disableDate,
    });
  };

  // Mostrar botão habilitar/desabilitar apenas se Admin e data ≥ hoje
  const today = dayjs().startOf("day");
  const targetDay = initialData.date
    ? dayjs(initialData.date).startOf("day")
    : null;
  const canToggleAvailability =
    userRole === "admin" &&
    targetDay &&
    (targetDay.isSame(today) || targetDay.isAfter(today));

  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      {error && <div className={styles.error}>{error}</div>}
      <DialogHeader>
        <DialogTitle>
          {!initialData.available && "Habilite a data para marcar uma sessão"}
          {initialData.id ? "Editar Sessão" : "Nova Sessão"}
        </DialogTitle>
        <DialogDescription>
          {initialData.id
            ? "Atualize os dados da sessão."
            : "Preencha os dados para criar uma nova sessão."}
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>Data:</label>
          <DatePicker
            date={date}
            onChange={() => {}}
            disabledDates={disabledDates}
            isDisabled={true}
          />

          <label className={styles.label}>Título:</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da sessão"
            required
            disabled={!initialData.available}
          />

          <label className={styles.label}>Grupo:</label>
          { 
            groups && 
            <Select
            options={groups.map((g) => ({ id: g.id.toString(), name: g.name }))}
            placeholder="Selecione um grupo"
            value={groupId?.toString() || null}
            onChange={(val) => setGroupId(Number(val))}
            required
            disabled={!initialData.available}
            />
          }

        </form>
      </DialogContent>
      <DialogFooter>
        {canToggleAvailability && (
          <Button
            variant="primary"
            onClick={() =>
              changeDateAvailability(
                dateDimensionId,
                !initialData.available
              )
            }
            type="button"
          >
            {initialData.available ? "Desabilitar data" : "Habilitar data"}
          </Button>
        )}

        <Button variant="secondary" onClick={onClose} type="button">
          Cancelar
        </Button>
        <Button variant="highlight" onClick={handleSubmit} type="submit">
          {initialData.id ? "Salvar" : "Criar"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
