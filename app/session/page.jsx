'use client';

import { useState } from 'react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import SessionForm from '../components/SessionForm';

import styles from '../styles/Session.module.css';

const SessionPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cards, setCards] = useState([]);

  const handleAddCard = (newCard) => {
    setCards([...cards, newCard]);
    setIsModalOpen(false);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.sessionTitle}>
          <h1 className={styles.pageTitle}>Quadro de Sessões</h1>
          <button className={styles.createButton} onClick={() => setIsModalOpen(true)}>
            Nova Sessão
          </button>
        </div>
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
