import React from "react";
import styles from "../../_styles/UI/Drawer.module.css";
import Button from "./Button";

/**
 * Drawer component
 * Props:
 * - open: boolean (drawer aberto ou fechado)
 * - onClose: function (callback para fechar)
 * - side: 'left' | 'right' (opcional, padrão 'left')
 * - width: string (opcional, padrão '300px')
 * - children: conteúdo do drawer
 */

const Drawer = ({ open, onClose, side = "left", width = "var(--drawer-width)", children }) => {
  const drawerClass = [
    styles.drawer,
    side === "left" ? styles.drawerLeft : styles.drawerRight,
    open ? styles.drawerOpen : side === "left" ? styles.drawerClosedLeft : styles.drawerClosedRight,
  ].join(" ");

  const overlayClass = [
    styles.overlay,
    !open ? styles.overlayClosed : "",
  ].join(" ");

  return (
    <>
      <div className={overlayClass} onClick={onClose} />
      <div
        className={drawerClass}
        style={{ width }}
      >
        <Button className={styles.closeButton} size="icon" onClick={onClose}>{`x`}</Button>
        {children}
      </div>
    </>
  );
};

export default Drawer;