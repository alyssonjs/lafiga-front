"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import Button from "../../_components/UI/Button";
import ScheduleCard from "../../_components/schedule/ScheduleCard";
import { useAuth } from "../../_context/AuthContext";
import { crudFor } from "../../_services/railsApi";
import styles from "../../_styles/home/Session.module.css";

export default function SessionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filterGroupId, setFilterGroupId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { role } = useAuth();
  const schedulesApi = useMemo(
    () => crudFor("schedules", 'public'),
    [role]
  );
  const groupsApi = useMemo(() => crudFor("groups", 'public'), []);

  useEffect(() => {
    schedulesApi
      .getAll()
      .then(({ schedules }) => setSchedules(schedules))
      .catch(console.error)
  }, [role]);

  useEffect(() => {
    groupsApi.getAll().then(({ groups }) => setGroups(groups || [])).catch(console.error);
  }, [groupsApi]);

  const filtered = schedules.filter((s) => {
    const groupOk = filterGroupId ? String(s.group_id) === String(filterGroupId) : true;
    const statusOk = filterStatus ? s.status === filterStatus : true;
    return groupOk && statusOk;
  });

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
        <div className={styles.filtersBar}>
          <select value={filterGroupId} onChange={(e) => setFilterGroupId(e.target.value)}>
            <option value="">Todos os grupos</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="waiting">Pendente</option>
            <option value="reserved">Confirmada</option>
          </select>
        </div>
        {filtered.map((schedule) => (
          <ScheduleCard key={schedule.id} schedule={schedule} />
        ))}
      </section>
    </div>
  );
}
