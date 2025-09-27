import React from "react";
import styles from "../../_styles/UI/Drawer.module.css";
import Button from "./Button";

/**
 * Drawer component
 * Props:
 * - open: boolean (drawer aberto ou fechado)
 * - onClose: function (callback para fechar)
 * - type: 'overlay' | 'push' (tipo do drawer)
 * - side: 'left' | 'right' | 'top' | 'bottom' (opcional, padrão 'left')
 * - width: string (opcional, padrão 'var(--drawer-width)')
 * - children: conteúdo do drawer
 */
const Drawer = ({ open, onClose, type = "overlay", side = "left", width = "var(--drawer-width)", children }) => {
  const overlayClass = [
    styles.overlay,
    !open ? styles.overlayClosed : "",
  ].join(" ");

  let drawerClass;
  if (type === "push") {
    if (side === "left") {
      drawerClass = [styles.pushDrawer, styles.pushDrawerLeft, open ? styles.pushDrawerOpen : styles.pushDrawerClosedLeft].join(" ");
    } else if (side === "right") {
      drawerClass = [styles.pushDrawer, styles.pushDrawerRight, open ? styles.pushDrawerOpen : styles.pushDrawerClosedRight].join(" ");
    } 
  } else {
    if (side === "left") {
      drawerClass = [styles.drawer, styles.drawerLeft, open ? styles.drawerOpen : styles.drawerClosedLeft].join(" ");
    } else if (side === "right") {
      drawerClass = [styles.drawer, styles.drawerRight, open ? styles.drawerOpen : styles.drawerClosedRight].join(" ");
    } else if (side === "top") {
      drawerClass = [styles.drawer, styles.drawerTop, open ? styles.drawerOpenTop : styles.drawerClosedTop].join(" ");
    } else if (side === "bottom") {
      drawerClass = [styles.drawer, styles.drawerBottom, open ? styles.drawerOpenBottom : styles.drawerClosedBottom].join(" ");
    }
  }

  const drawerStyle =
    side === "top" || side === "bottom"
      ? { height: width }
      : { width };

  return (
    <>
      {type === "overlay" && <div className={overlayClass} onClick={onClose} />}
      <div
        className={drawerClass}
        style={drawerStyle}
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