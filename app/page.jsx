'use client';

import { useState } from 'react';
import SessionPage from './(user)/session/page';

const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cards, setCards] = useState([]);

  // const handleAddCard = (newCard) => {
  //   setCards([...cards, newCard]);
  //   setIsModalOpen(false);
  // };

  return (
    <SessionPage/>
  );
};

export default HomePage;
