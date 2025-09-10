import React, { useEffect, useRef } from "react";
import Toast from "./Toast";
import styles from "../../../_styles/UI/ToastList.module.css";

const ToastList = ({ data, position, removeToast }) => {
  const listRef = useRef(null);

  const handleScrolling = React.useCallback((el) => {
    const isTopPosition = ["topLeft", "topRight"].includes(position);
    if (isTopPosition) {
      el?.scrollTo(0, el.scrollHeight);
    } else {
      el?.scrollTo(0, 0);
    }
  }, [position]);

  useEffect(() => {
    handleScrolling(listRef.current);
  }, [position, data, handleScrolling]);

  const sortedData = position.includes("bottom")
    ? [...data].reverse()
    : [...data];

  return (
    sortedData.length > 0 && (
      <div
        className={styles.toastList}
        aria-live="assertive"
        ref={listRef}
      >
        {sortedData.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    )
  );
};

export default ToastList;