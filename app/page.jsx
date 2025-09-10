"use client";

import { useState } from "react";
import SessionPage from "./_components/home/SessionPage";
import Toaster from "./_components/UI/toast/Toaster";

const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cards, setCards] = useState([]);

  return (
    <>
      <SessionPage />
      {/* <Toaster /> */}
    </>
  );
};

export default HomePage;
