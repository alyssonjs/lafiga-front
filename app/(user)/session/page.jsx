"use client";

import { useState, useEffect, useMemo } from "react";
import Card from "../../_components/Card";
import Modal from "../../_components/Modal";
import SessionForm from "../../_components/SessionForm";
import Button from "../../_components/Button";
import ScheduleCard from "../../_components/ScheduleCard";
import { useAuth } from "../../_context/AuthContext";
import { crudFor } from "../../_services/railsApi";
import styles from "../../_styles/Session.module.css";

export default function SessionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const { role } = useAuth();
  const schedulesApi = useMemo(
    () => crudFor("schedules", 'public'),
    [role]
  );

  const handleAddSchedule = (newSchedule) => {
    setSchedules((prev) => [...prev, newSchedule]);
    setIsModalOpen(false);
  };

  useEffect(() => {
    schedulesApi
      .getAll()
      .then((schedule) => setSchedules(schedule))
      .catch(console.error)
  }, [role]);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.sessionHeader}>
        <h2 className={styles.pageTitle}>Quadro de Sessões</h2>
        {(role === "admin" || role === "player") && (
          <Button size="lg" onClick={() => setIsModalOpen(true)}>
            Nova Sessão
          </Button>
        )}
      </header>

      {error && <div className={styles.error}>Erro: {error}</div>}

      <section className={styles.cardsContainer}>
        {schedules.map((schedule) => (
          <ScheduleCard key={schedule.id} schedule={schedule} />
        ))}
      </section>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Criar Nova Sessão</h2>
        <SessionForm onSubmit={handleAddSchedule} />
      </Modal>
    </div>
  );
}
