import React from "react";
import styles from "../../_styles/UI/PushDrawer.module.css";
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

const PushDrawer = ({ open, onClose, side = "left", width = "var(--drawer-width)", children }) => {
  const drawerClass = [
    styles.pushDrawer,
    side === "left" ? styles.pushDrawerLeft : styles.pushDrawerRight,
    open ? styles.pushDrawerOpen : side === "left" ? styles.pushDrawerClosedLeft : styles.pushDrawerClosedRight,
  ].join(" ");

  return (
    <div
      className={drawerClass}
      style={{ width }}
    >
      <Button className={styles.pushDrawerCloseButton} size="icon" onClick={onClose}>{`x`}</Button>
      {children}
    </div>
  );
};

export default PushDrawer;