import React from "react";
import {
  SuccessIcon,
  FailureIcon,
  WarningIcon,
  CloseIcon,
} from "../_components/Icons";
import styles from "../_styles/Toast.module.css";

const Toast = ({ message, type, onClose }) => {
  const iconMap = {
    success: <SuccessIcon />,
    failure: <FailureIcon />,
    warning: <WarningIcon />,
  };

  const toastIcon = iconMap[type] || null;

  return (
    <div className={`${styles.toast} ${styles[`toast--${type}`]}`} role="alert">
      <div className={styles.toastMessage}>
        {toastIcon && (
          <div className={`${styles.icon} ${styles.iconLg} ${styles.iconThumb}`}>
            {toastIcon}
          </div>
        )}
        <p>{message}</p>
      </div>
      <button className={styles.toastCloseBtn} onClick={onClose}>
        <span className={styles.icon}>
          <CloseIcon />
        </span>
      </button>
    </div>
  );
};

export default Toast;
