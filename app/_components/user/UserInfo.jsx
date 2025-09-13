"use client";

import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "../UI/Dialog";
import Button from "../UI/Button";
import styles from "../../_styles/user/UserInfo.module.css";

const UserInfo = ({ user, onClose, setIsEditOpen }) => {
  return (
    <Dialog onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{user.name}</DialogTitle>
      </DialogHeader>

      <DialogContent>
        <div className={styles.infoDetails}>
          <div className={styles.username}>
            <strong>Username:</strong>
            <p>{user.username}</p>
          </div>
          <div className={styles.phone}>
            <strong>Telefone:</strong>
            <p>{user.phone}</p>
          </div>
          <div className={styles.email}>
            <strong>E-mail:</strong>
            <p>{user.email}</p>
          </div>
          <div className={styles.role}>
            <strong>Permissao:</strong>
            <p>{user.role.name}</p>
          </div>
          {user.characters && (
            <div>
              <strong>Personagens:</strong>{" "}
              <div>
                {user.characters.map((m) => m.name).join(", ")}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="highlight" onClick={() => setIsEditOpen(true)}>Editar</Button>
      </DialogFooter>
    </Dialog>
  );
};

export default UserInfo;
