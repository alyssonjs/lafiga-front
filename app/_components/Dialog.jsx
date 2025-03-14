"use client";

import { useEffect, forwardRef, useState } from "react";
import styles from "../_styles/Dialog.module.css";
import Button from "./Button";
import { createPortal } from "react-dom";

const Dialog = forwardRef(({ isOpen, onClose, children, ...props }, ref) => {
  const handleCloseClick = (e) => {
    e.preventDefault();
    onClose();
  };

  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const dialogContent = (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialog}>
        <div className={styles.dialogCloseButton}>
          <Button
            variant="primary"
            size="icon"
            href="#"
            onClick={handleCloseClick}
          >
            x
          </Button>
        </div>
        {children}
      </div>
    </div>
  );

  return createPortal(dialogContent, document.getElementById("dialogRoot"));
});
Dialog.displayName = "Dialog";

const DialogContent = forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className={styles.dialogContent} {...props}>
    {children}
  </div>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ ...props }) => (
  <div className={styles.dialogHeader} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ ...props }) => (
  <div className={styles.dialogFooter} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = forwardRef(({ ...props }, ref) => (
  <h1 ref={ref} className={styles.dialogTitle} {...props} />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = forwardRef(({ ...props }, ref) => (
  <div ref={ref} className={styles.dialogDescription} {...props} />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
