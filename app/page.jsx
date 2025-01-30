'use client';

import { useState } from 'react';
import Card from './components/Card';
import Modal from './components/Modal';
import SessionForm from './components/SessionForm';
import SessionPage from './session/page'
import styles from './styles/Home.module.css';

const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cards, setCards] = useState([]);

  const handleAddCard = (newCard) => {
    setCards([...cards, newCard]);
    setIsModalOpen(false);
  };

  return (
    <SessionPage/>
  );
};

export default HomePage;
