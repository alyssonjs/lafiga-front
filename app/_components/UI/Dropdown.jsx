"use client";

import { useState, useRef, useEffect } from "react";
import styles from "../../_styles/UI/Dropdown.module.css";

const Dropdown = ({ trigger, children, contentWidth = "auto", onOutsideClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        if (onOutsideClick) {
          onOutsideClick();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onOutsideClick]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (!newState && onOutsideClick) {
      onOutsideClick();
    }
  };

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <div className={`${styles.dropdown} ${isOpen ? styles.active : ''}`}>
        <div 
          className={styles.triggerWrapper}
          onClick={handleToggle}
          aria-expanded={isOpen}
        >
          {trigger}
        </div>
        
        {isOpen && (
          <div 
            className={styles.dropdownContent}
            style={{ width: contentWidth }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropdown;