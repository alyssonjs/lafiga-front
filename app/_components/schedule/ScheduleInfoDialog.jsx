// app/_components/ScheduleInfoDialog.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "../UI/Dialog";
import Button from "../UI/Button";
import { useAuth } from "../../_context/AuthContext";
import { crudFor } from "../../_services/railsApi";
import styles from "../../_styles/schedule/ScheduleInfoDialog.module.css";

dayjs.locale("pt-br");

export default function ScheduleInfoDialog({ isOpen, onClose, schedule, dateDimension, openEditModal }) {
  const [formattedDate, setFormattedDate] = useState("");
  const [myRsvps, setMyRsvps] = useState([]);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState(null);
  const { role, user } = useAuth();
  const rsvpApi = useMemo(() => (role ? crudFor("schedule_characters", role) : null), [role]);

  useEffect(() => {
    if (dateDimension?.date) {
      const dt = dayjs(dateDimension.date);
      setFormattedDate(
        `${dt.format("DD/MM/YYYY")} (${dt.format("dddd")})`
      );
    }
  }, [dateDimension]);

  // Busca RSVPs do usuário atual para esta sessão (player)
  useEffect(() => {
    if (!isOpen || !schedule || role !== 'player' || !rsvpApi) return;
    setRsvpLoading(true);
    setRsvpError(null);
    rsvpApi
      .getAll({ schedule_id: schedule.id })
      .then(({ schedule_characters }) => setMyRsvps(schedule_characters || []))
      .catch((e) => setRsvpError(e?.message || 'Falha ao carregar RSVP'))
      .finally(() => setRsvpLoading(false));
  }, [isOpen, schedule, role, rsvpApi]);

  const myCharacterIds = (schedule?.group?.characters || [])
    .filter((c) => user && c.user_id === user.id)
    .map((c) => c.id);

  const myRsvp = myRsvps.find((sc) => myCharacterIds.includes(sc.character_id));

  const confirmPresence = async () => {
    if (!myRsvp || !rsvpApi) return;
    try {
      const { schedule_character } = await rsvpApi.update(myRsvp.id, { status: 'confirmed' });
      setMyRsvps((prev) => prev.map((r) => (r.id === schedule_character.id ? schedule_character : r)));
    } catch (e) {
      setRsvpError('Não foi possível confirmar presença.');
    }
  };

  const togglePresence = async () => {
    if (!myRsvp || !rsvpApi) return;
    const next = myRsvp.status === 'confirmed' ? 'pending' : 'confirmed';
    try {
      const { schedule_character } = await rsvpApi.update(myRsvp.id, { status: next });
      setMyRsvps((prev) => prev.map((r) => (r.id === schedule_character.id ? schedule_character : r)));
    } catch (e) {
      setRsvpError('Não foi possível atualizar presença.');
    }
  };

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
              {role === 'player' && (
                <div style={{ marginTop: 8 }}>
                  <em>Meu RSVP:</em>{" "}
                  {rsvpLoading ? 'Carregando…' : myRsvp ? (myRsvp.status === 'confirmed' ? 'Confirmado' : 'Pendente') : '—'}
                  {rsvpError && <div style={{ color: 'red' }}>{rsvpError}</div>}
                </div>
              )}
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
        {role === 'player' && myRsvp && (
          <Button variant="primary" onClick={togglePresence}>
            {myRsvp.status === 'confirmed' ? 'Cancelar presença' : 'Confirmar presença'}
          </Button>
        )}
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
