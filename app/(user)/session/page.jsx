"use client";

import { useState } from "react";
import Card from "../../_components/Card";
import Modal from "../../_components/Modal";
import SessionForm from "../../_components/SessionForm";
import Button from "../../_components/Button";
import Dialog from "../../_components/Button";

import styles from "../../_styles/Session.module.css";

const SessionPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cards, setCards] = useState([]);

  const handleAddCard = (newCard) => {
    setCards([...cards, newCard]);
    setIsModalOpen(false);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.sessionTitle}>
        <h3 className={styles.pageTitle}>Quadro de Sessões</h3>
        {/* <button className={styles.createButton} onClick={() => setIsModalOpen(true)}>
            Nova Sessão
          </button> */}
        <Button size="lg" onClick={() => setIsModalOpen(true)}>
          Nova Sessão
        </Button>
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.cardsContainer}>
          {cards.map((card, index) => (
            <Card key={index} {...card} />
          ))}
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Criar Nova Sessão</h2>
        <SessionForm onSubmit={handleAddCard} />
      </Modal>
    </div>
  );
};

export default SessionPage;
