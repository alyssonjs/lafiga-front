'use client';

import { useEffect, useRef } from 'react';
import styles from '../_styles/Modal.module.css';


const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null);

  // Remove o fechamento do modal ao clicar fora dele
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Impede o scroll da página quando o modal está aberto
    } else {
      document.body.style.overflow = 'auto'; // Restaura o scroll da página quando o modal fecha
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} ref={modalRef}>
        {/* Ícone de "X" para fechar o modal */}
        <button className={styles.closeButton} onClick={onClose}>
          &times; {/* Ícone de "X" */}
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;