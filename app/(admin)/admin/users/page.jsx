"use client";

import { useState, useEffect, useMemo } from "react";
import UserFormDialog from "../../../_components/UserFormDialog";
import UserInfo from "../../../_components/UserInfo";
import UserCard from "../../../_components/UserCard";
import { crudFor } from "../../../_services/railsApi";
import { useAuth } from "../../../_context/AuthContext";

import styles from "../../../_styles/Users.module.css";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreationOpen, setIsCreationOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { role } = useAuth();
  const usersApi = useMemo(
    () => crudFor("users", role),
    [role]
  );

  useEffect(() => {
    if (!role) return;
    usersApi
      .getAll()
      .then(({ users }) => setUsers(users))
      .catch(console.error)
  }, [role]);

  const handleAddUser = (newChar) => {
    setUsers((prev) => [...prev, newChar]);
    setIsCreationOpen(false);
  };

  const closeEditUser = () => {
    setIsEditOpen(false);
    setSelectedUser(null);
  }

  const editUser = (usr) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === usr.id ? usr : u))
    );
    closeEditUser()
  };

  const handleCardClick = (char) => {
    setSelectedUser((prev) =>
      prev?.id === char.id ? null : char
    );
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        {/* <Button size="lg" onClick={() => setIsCreationOpen(true)}>
          Criar User
        </Button> */}
      </div>

      {error && <div className={styles.error}>Erro: {error}</div>}

      <div className={styles.cardsContainer}>
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onClick={() => handleCardClick(user)}
          />
        ))}
      </div>

      {isCreationOpen && (
        <UserFormDialog
          isOpen={open}
          onClose={() => setIsCreationOpen(false)}
          onSave={handleAddUser}
        />
      )}

      {selectedUser && isEditOpen && (
        <UserFormDialog
          isOpen={isEditOpen}
          onClose={() => closeEditUser()}
          onSave={editUser}
          user={selectedUser}
        />
      )}

      {selectedUser && !isEditOpen && (
        <UserInfo
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          setIsEditOpen={() => setIsEditOpen(true)}
          />
      )}
    </div>
  );
};

export default UsersPage;
