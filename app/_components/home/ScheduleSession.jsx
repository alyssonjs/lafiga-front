"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../_context/AuthContext";
import { crudFor } from "../../_services/railsApi";
import Button from "../UI/Button";
import ScheduleCard from "../schedule/ScheduleCard";
import CalendarIcon from "../../../public/assets/icons/Calendar.svg";

import styles from "../../_styles/home/Session.module.css";

const ScheduleSession = () => {
    const [error, setError] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const { role } = useAuth();
    const [loading, setLoading] = useState(true);

    const schedulesApi = useMemo(
        () => crudFor("schedules", 'public'),
        [role]
    );

    useEffect(() => {
        setLoading(true);
        setError(null);
        schedulesApi
            .getAll()
            .then((schedules) => setSchedules(schedules.schedules))
            .catch((e) => setError(e?.message || 'Falha ao carregar sessões'))
            .finally(() => setLoading(false));
    }, [role]);

    return(
        <div className={styles.pageContainer}>
            <header className={styles.sessionHeader}>
                <h1 className={styles.pageTitle}>Sessões Marcadas</h1>
                <Link href="/calendar">
                    <Button size="md" className={styles.linkButton}>
                        <Image
                        src={CalendarIcon}
                        alt="Menu"
                        width={20}
                        height={20}
                        style={{ filter: "brightness(0) invert(1)" }}
                        />
                        <span className={styles.buttnoText}>
                        Ver todas
                        </span>
                    </Button>
                </Link>
            </header>

            {error && <div className={styles.error}>Erro: {error}</div>}
            {loading && <div>Carregando…</div>}
            {!loading && !error && schedules.length === 0 && (
                <div>Nenhuma sessão encontrada.</div>
            )}
            <section className={styles.sessionContainer}>
                {schedules.slice(0, 6).map((schedule) => (
                    <ScheduleCard key={schedule.id} schedule={schedule} />
                ))}
            </section>
        </div>  
    )
}

export default ScheduleSession;