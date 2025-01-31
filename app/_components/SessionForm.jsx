"use client";

import { useState } from "react";
import DatePicker from "./DatePicker";
import styles from "../_styles/SessionForm.module.css";
import Button from "./Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./Card";
import Input from "./Input";

const SessionForm = ({ onSubmit }) => {
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [characters, setCharacters] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      date,
      title,
      characters: characters.split(",").map((char) => char.trim()),
    });
    resetForm();
  };

  const resetForm = () => {
    setDate("");
    setTitle("");
    setCharacters("");
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label htmlFor="date">Data:</label>
      <DatePicker onChange={(date) => setDate(date)} />
      <input type="hidden" id="date" value={date} />

      <label htmlFor="title">Título:</label>
      <input
        type="text"
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <label htmlFor="characters">Personagens (separados por vírgula):</label>
      <input
        type="text"
        id="characters"
        value={characters}
        onChange={(e) => setCharacters(e.target.value)}
        required
      />

      <Button type="submit" variant="success" size="lg">
        Adicionar Sessão
      </Button>
      {/* <button type="submit" className={styles.submitButton}>Adicionar Sessão</button> */}
    </form>
  );
};

export default SessionForm;
