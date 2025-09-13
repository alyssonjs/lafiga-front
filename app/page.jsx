"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./_context/AuthContext";
import { crudFor } from "./_services/railsApi";
import ScheduleCard from "./_components/schedule/ScheduleCard";

const HomePage = () => {
  const { role } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const schedulesApi = useMemo(
    () => crudFor("schedules", role || 'public'),
    [role]
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    schedulesApi
      .getAll()
      .then(({ schedules }) => {
        const sorted = (schedules || []).slice().sort((a, b) => {
          const da = new Date(a.date_dimension?.date || 0).getTime();
          const db = new Date(b.date_dimension?.date || 0).getTime();
          return da - db;
        });
        setSchedules(sorted.slice(0, 5));
      })
      .catch((e) => setError(e?.message || 'Falha ao carregar sessões'))
      .finally(() => setLoading(false));
  }, [schedulesApi]);

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Próximas Sessões</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {(role === 'admin' || role === 'player') && (
            <Link href="/calendar">Criar/gerenciar sessões</Link>
          )}
          <Link href="/session">Ver todas</Link>
        </div>
      </header>

      {loading && <div>Carregando…</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && schedules.length === 0 && (
        <div>Nenhuma sessão futura encontrada.</div>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {schedules.map((s) => (
          <ScheduleCard key={s.id} schedule={s} />
        ))}
      </section>
    </div>
  );
};

export default HomePage;
