"use client";

import { useState } from "react";
import SessionPage from "./(user)/session/page";
import Toaster from "./_components/Toaster";

const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cards, setCards] = useState([]);

  return (
    <>
      <SessionPage />
      <Toaster />
    </>
  );
};

export default HomePage;
