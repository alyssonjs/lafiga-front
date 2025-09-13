"use client";

import { forwardRef, useEffect, Children, isValidElement, cloneElement } from "react";
import styles from "../../_styles/UI/Dialog.module.css";
import Button from "./Button";
import { createPortal } from "react-dom";

const Dialog = forwardRef(({ isOpen, onClose, size = "md", children, inline = false, mode, showClose = true, ...props }, ref) => {
  // Backward-compatible: if `isOpen` is undefined, treat as open.
  const open = typeof isOpen === "undefined" ? true : !!isOpen;
  const handleCloseClick = (e) => {
    e.preventDefault();
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [onClose, open]);

  const effectiveMode = inline || mode === 'inline' ? 'inline' : 'modal';

  if (!open) return null;

  if (effectiveMode === 'inline') {
    return (
      <div className={styles.inlineWrap} {...props}>
        <div className={`${styles.dialog} ${styles.inlineDialog}`} data-size={size}>
          {showClose && (
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
          )}
          <div className={styles.dialogBody}>{children}</div>
        </div>
      </div>
    );
  }

  const dialogContent = (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialog} data-size={size}>
        {showClose && (
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
        )}
        <div className={styles.dialogBody}>{children}</div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
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
