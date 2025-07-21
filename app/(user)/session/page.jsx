"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
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

  useEffect(() => {
    schedulesApi
      .getAll()
      .then((schedule) => setSchedules(schedule))
      .catch(console.error)
  }, [role]);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.sessionHeader}>
        <h1 className={styles.pageTitle}>Quadro de Sessões</h1>
        {(role === "admin" || role === "player") && (
          <Link href="/calendar">
            <Button size="lg">
              Nova Sessão
            </Button>
          </Link>
        )}
      </header>

      {error && <div className={styles.error}>Erro: {error}</div>}

      <section className={styles.cardsContainer}>
        {schedules.map((schedule) => (
          <ScheduleCard key={schedule.id} schedule={schedule} />
        ))}
      </section>
    </div>
  );
}
