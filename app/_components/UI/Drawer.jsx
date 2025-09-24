import React from "react";
import styles from "../../_styles/UI/Drawer.module.css";
import Button from "./Button";

/**
 * Drawer component
 * Props:
 * - open: boolean (drawer aberto ou fechado)
 * - onClose: function (callback para fechar)
 * - type: 'overlay' | 'push' (tipo do drawer)
 * - side: 'left' | 'right' (opcional, padrão 'left')
 * - width: string (opcional, padrão 'var(--drawer-width)')
 * - children: conteúdo do drawer
 */
const Drawer = ({ open, onClose, type = "overlay", side = "left", width = "var(--drawer-width)", children }) => {
  // Classes para overlay
  const overlayClass = [
    styles.overlay,
    !open ? styles.overlayClosed : "",
  ].join(" ");

  // Classes para drawer
  const drawerClass = type === "push"
    ? [
        styles.pushDrawer,
        side === "left" ? styles.pushDrawerLeft : styles.pushDrawerRight,
        open ? styles.pushDrawerOpen : side === "left" ? styles.pushDrawerClosedLeft : styles.pushDrawerClosedRight,
      ].join(" ")
    : [
        styles.drawer,
        side === "left" ? styles.drawerLeft : styles.drawerRight,
        open ? styles.drawerOpen : side === "left" ? styles.drawerClosedLeft : styles.drawerClosedRight,
      ].join(" ");

  return (
    <>
      {type === "overlay" && <div className={overlayClass} onClick={onClose} />}
      <div
        className={drawerClass}
        style={{ width }}
      >
        <Button
          className={type === "push" ? styles.pushDrawerCloseButton : styles.closeButton}
          size="icon"
          onClick={onClose}
        >
          x
        </Button>
        {children}
      </div>
    </>
  );
};

export default Drawer;