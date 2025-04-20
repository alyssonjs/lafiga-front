"use client";

import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "./Dialog";
import Button from "./Button";
import styles from "../_styles/GroupInfo.module.css";

const GroupInfo = ({ group, onClose, setIsEditOpen }) => (
  <Dialog onClose={onClose}>
    <DialogHeader>
      <DialogTitle>{group.name}</DialogTitle>
      <DialogDescription>Descricao: {group.description}</DialogDescription>
    </DialogHeader>

    <DialogContent>
      <p>
        <strong>Estacao:</strong>{" "}
        {group.season.charAt(0).toUpperCase() + group.season.slice(1)}
      </p>
      <p>
        <strong>Dia:</strong> {group.day} / <strong>Ano:</strong> {group.year}
      </p>
      <div className={styles.description}>
        <strong>Descrição:</strong>
        <p>{group.description}</p>
      </div>
    </DialogContent>
    <DialogFooter>
      <Button variant="highlight" onClick={() => setIsEditOpen(true)}>Editar</Button>
    </DialogFooter>
  </Dialog>
);            

export default GroupInfo;