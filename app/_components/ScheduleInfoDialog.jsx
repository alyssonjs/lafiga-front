// app/_components/ScheduleInfoDialog.jsx
"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "./Dialog";
import Button from "./Button";
import { useAuth } from "../_context/AuthContext";
import styles from "../_styles/ScheduleInfoDialog.module.css";

dayjs.locale("pt-br");

export default function ScheduleInfoDialog({ isOpen, onClose, schedule, dateDimension, openEditModal }) {
  const [formattedDate, setFormattedDate] = useState("");
  const { role } = useAuth();

  useEffect(() => {
    if (dateDimension?.date) {
      const dt = dayjs(dateDimension.date);
      setFormattedDate(
        `${dt.format("DD/MM/YYYY")} (${dt.format("dddd")})`
      );
    }
  }, [dateDimension]);

  if (!isOpen || !schedule) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{schedule.group.name}</DialogTitle>
        <DialogDescription>
          {schedule.title}
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        <div className={styles.content}>
          <p>
            <strong>Data:</strong> {formattedDate}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {schedule.status === 'waiting'
              ? "Pendente"
              : schedule.status === 'reserved'
              ? "Confirmada"
              : "Cancelada"}
          </p>
          {schedule.group.characters && (
            <div>
              <strong>Participantes:</strong>{" "}
              <div>
                {schedule.group.characters.map((m) => m.name).join(", ")}
              </div>
            </div>
          )}
          {schedule.time && (
            <p>
              <strong>Horário:</strong> {schedule.time}
            </p>
          )}
          {schedule.location && (
            <p>
              <strong>Local:</strong> {schedule.location}
            </p>
          )}
          {schedule.description && (
            <p className={styles.description}>
              <strong>Descrição:</strong><br/>
              {schedule.description}
            </p>
          )}
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
        {
          role === 'admin' && 
          <Button variant="highlight" onClick={() => openEditModal(schedule, dateDimension)}>
            Ajustar
          </Button>
        }
      </DialogFooter>
    </Dialog>
  );
}
