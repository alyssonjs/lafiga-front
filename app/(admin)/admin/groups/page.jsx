"use client";

import { useState, useEffect, useMemo } from "react";
import Button from "../../../_components/Button";
import GroupFormDialog from "../../../_components/GroupFormDialog";
import GroupInfo from "../../../_components/GroupInfo";
import GroupCard from "../../../_components/GroupCard";
import { crudFor } from "../../../_services/railsApi";
import { useAuth } from "../../../_context/AuthContext";

import styles from "../../../_styles/GroupsPage.module.css";

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const { role } = useAuth();
  const groupsApi = useMemo(
    () => crudFor("groups", role),
    [role]
  );
  useEffect(() => {
    if (!role) return;
    groupsApi
      .getAll()
      .then(({ groups }) => setGroups(groups))
      .catch(console.error)
  }, [role]);

  const addGroup = (grp) => {
    setGroups((prev) => [...prev, grp]);
    setIsCreateOpen(false);
  };

  const editGroup = (grp) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === grp.id ? grp : g))
    );
    closeEditGroup()
  };

  const closeEditGroup = () => {
    setIsEditOpen(false);
    setSelected(null);
  }

  const removeGroup = async (id) => {
    if (!confirm("Confirma exclusão deste grupo?")) return;
    try {
      await deleteAdminGrosup(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
      setSelected(null);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Grupos</h1>
        <Button size="lg" onClick={() => setIsCreateOpen(true)}>
          Novo Grupo
        </Button>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.list}>
        {groups.map((g) => (
          <GroupCard key={g.id} group={g} onClick={setSelected} />
        ))}
      </div>
      {selected && !isEditOpen && (
        <div className={styles.detailPanel}>
          <GroupInfo 
            group={selected} 
            onClose={() => setSelected(null)} 
            setIsEditOpen={() => setIsEditOpen(true)}
          />
        </div>
      )}

      {isCreateOpen && 
        <GroupFormDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSave={addGroup}
        />
      }

      {selected && isEditOpen && (
        <GroupFormDialog
          isOpen={isEditOpen}
          onClose={() => closeEditGroup()}
          onSave={editGroup}
          group={selected}
        />
      )}
    </div>
  );
};

export default GroupsPage;
