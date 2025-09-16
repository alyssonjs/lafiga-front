"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../_context/AuthContext";
import { crudFor } from "../../_services/railsApi";
import GroupCard from "../group/GroupCard";
import Link from "next/link";
import Image from "next/image";
import Button from "../UI/Button";
import GroupIcon from "../../../public/assets/icons/Multiple-User.svg";


import styles from "../../_styles/home/Session.module.css";

const GroupSession = () => {
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const groupsApi = useMemo(
    () => crudFor("groups", 'public'),
    [role]
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    groupsApi
      .getAll()
      .then((groups) => setGroups(groups))
      .catch((e) => setError(e?.message || 'Falha ao carregar grupos'))
      .finally(() => setLoading(false));
  }, [role]);

  return (
    <div className={styles.pageContainer}>
        <header className={styles.sessionHeader}>
          <h1 className={styles.pageTitle}>Grupos</h1>
            <Link href="/groups">
              <Button size="md" className={styles.linkButton}>
                <Image
                  src={GroupIcon}
                  alt="Menu"
                  width={20}
                  height={20}
                  style={{ filter: "brightness(0) invert(1)" }}
                />
                <span className={styles.buttnoText}>
                  Ver todos
                </span>
              </Button>
            </Link>
        </header>

        {error && <div className={styles.error}>Erro: {error}</div>}
        {loading && <div>Carregando…</div>}
        {!loading && !error && groups.length === 0 && (
          <div>Nenhum grupo encontrado.</div>
        )}

        <section className={styles.characterContainer}>
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
        ))}
        </section>
    </div>
  )
}

export default GroupSession;