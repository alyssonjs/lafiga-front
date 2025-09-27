"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "../../_styles/UI/Select.module.css";

/**
 * Select component
 * ---------------
 * Props:
 *  - placeholder: string
 *  - options:     Array<{ id: string | number, name: string }>
 *  - value:       id of selected option
 *  - onChange:    function
 *  - disabled:    boolean → when true the select is non‑interactive
 *  - clearable:   boolean → show clear button when option is selected
 *  - size:        string → "sm" | "md" | "lg"
 *  - ...props:    spread to root container (data‑attrs etc.)
 */

const Select = ({
  placeholder = "Placeholder",
  options = [],
  value,
  onChange = () => {},
  disabled = false,
  clearable = false,
  size = "md",
  ...props
}) => {
  
  const [selectedOption, setSelectedOption] = useState(() =>
    value != null ? options.find((o) => o.id === value) || null : null
  );
  const [showOptionList, setShowOptionList] = useState(false);
  const [listDirection, setListDirection] = useState("down");
  const selectContainerRef = useRef(null);

  useEffect(() => {
    if (value != null) {
      setSelectedOption(options.find((o) => o.id === value) || null);
    } else {
      setSelectedOption(null);
    }
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        selectContainerRef.current &&
        !selectContainerRef.current.contains(event.target)
      ) {
        setShowOptionList(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showOptionList && selectContainerRef.current) {
      const rect = selectContainerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // Ajusta a altura do dropdown baseado no size
      let optionHeight;
      switch (size) {
        case 'sm':
          optionHeight = 32; // mesma altura do item sm
          break;
        case 'lg':
          optionHeight = 48; // mesma altura do item lg
          break;
        default:
          optionHeight = 40; // altura padrão md
      }
      
      const dropdownHeight = Math.min(options.length * optionHeight, 200);
      setListDirection(spaceBelow < dropdownHeight ? "up" : "down");
    }
  }, [showOptionList, options.length, size]); 

  const handleOptionClick = (opt) => {
    if (disabled) return;
    
    setSelectedOption(opt);
    setShowOptionList(false);
    onChange(opt.id);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedOption(null);
    onChange(null);
  };

  const hasValue = !!selectedOption;

  const TriangleIcon = ({ isOpen }) => (
    <svg 
      className={`${styles.triangleIcon} ${isOpen ? styles.open : ''}`}
      viewBox="0 0 12 12" 
      fill="currentColor"
    >
      {isOpen ? (
        <polygon points="6,9 11,3 1,3" /> 
      ) : (
        <polygon points="6,9 11,3 1,3" /> 
      )}
    </svg>
  );

  const DiamondIndicator = () => (
    <div className={styles.diamondIndicator}></div>
  );

  return (
    <div
      className={`${styles.customSelectContainer} ${disabled ? styles.disabled : ""}`}
      ref={selectContainerRef}
      data-size={size}
      {...props}
    >
      <div
        className={`${styles.selectedText} ${showOptionList ? styles.active : ""} ${
          hasValue ? styles.hasValue : ""
        }`}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-disabled={disabled}
        onClick={() => !disabled && setShowOptionList((v) => !v)}
        data-size={size}
      >
        <span className={styles.selectedTextContent}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        
        <div className={styles.controlsContainer}>
          {clearable && hasValue && (
            <button
              type="button"
              className={styles.clearBtn}
              aria-label="Limpar seleção"
              onClick={handleClear}
            >
              ×
            </button>
          )}
          <TriangleIcon isOpen={showOptionList} />
        </div>
      </div>

      {showOptionList && !disabled && (
        <ul
          className={`${styles.selectOptions} ${
            listDirection === "up" ? styles.selectOptionsUp : ""
          }`}
        >
          {options.map((opt) => (
            <li
              key={opt.id}
              className={`${styles.customSelectOption} ${
                selectedOption && selectedOption.id === opt.id ? styles.selected : ""
              }`}
              onClick={() => handleOptionClick(opt)}
            >
              {selectedOption && selectedOption.id === opt.id && <DiamondIndicator />}
              <span>{opt.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Select;