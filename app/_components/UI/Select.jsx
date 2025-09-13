"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "../../_styles/UI/Select.module.css";
import Badge from "./Badge";

/**
 * Select component
 * ---------------
 * Props:
 *  - placeholder: string
 *  - options:     Array<{ id: string | number, name: string }>
 *  - multiselect: boolean
 *  - value:       multiselect ? array<option> : id
 *  - onChange:    function
 *  - disabled:    boolean (NEW) → when true the select is non‑interactive
 *  - ...props:    spread to root container (data‑attrs etc.)
 */

const Select = ({
  placeholder = "Placeholder",
  options = [],
  multiselect = false,
  value,
  onChange = () => {},
  disabled = false,
  clearable = false,
  size = "md",
  ...props
}) => {
  // --- state --------------------------------------------------------------
  const [selectedOptions, setSelectedOptions] = useState(() =>
    multiselect ? (Array.isArray(value) ? value : []) : []
  );
  const [selectedOption, setSelectedOption] = useState(() =>
    !multiselect && value != null ? options.find((o) => o.id === value) || null : null
  );
  const [showOptionList, setShowOptionList] = useState(false);
  const [listDirection, setListDirection] = useState("down");
  const selectContainerRef = useRef(null);

  // --- effects ------------------------------------------------------------
  useEffect(() => {
    if (multiselect && value !== undefined) {
      setSelectedOptions(Array.isArray(value) ? value : []);
    }
    if (!multiselect && value != null) {
      setSelectedOption(options.find((o) => o.id === value) || null);
    }
  }, [value, multiselect, options]);

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
      const dropdownHeight = Math.min(options.length * 40, 200);
      setListDirection(spaceBelow < dropdownHeight ? "up" : "down");
    }
  }, [showOptionList, options.length]);

  // --- handlers -----------------------------------------------------------
  const handleOptionClick = (opt) => {
    if (disabled) return;

    if (multiselect) {
      const exists = selectedOptions.some((o) => o.id === opt.id);
      const newSelection = exists
        ? selectedOptions.filter((o) => o.id !== opt.id)
        : [...selectedOptions, opt];
      setSelectedOptions(newSelection);
      onChange(newSelection);
    } else {
      setSelectedOption(opt);
      setShowOptionList(false);
      onChange(opt.id);
    }
  };

  const removeSelectedOption = (id) => {
    if (disabled) return;
    const newSel = selectedOptions.filter((o) => o.id !== id);
    setSelectedOptions(newSel);
    onChange(newSel);
  };

  const availableOptions = multiselect
    ? options.filter((o) => !selectedOptions.some((s) => s.id === o.id))
    : options;

  // --- render -------------------------------------------------------------
  const hasValue = multiselect
    ? Array.isArray(selectedOptions) && selectedOptions.length > 0
    : !!selectedOption;

  return (
    <div
      className={`${styles.customSelectContainer} ${disabled ? styles.disabled : ""}`}
      ref={selectContainerRef}
      data-size={size}
      {...props}
    >
      <div
        className={`${styles.selectedText} ${!multiselect ? styles.singleLine : ""} ${showOptionList ? styles.active : ""}`}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-disabled={disabled}
        onClick={() => !disabled && setShowOptionList((v) => !v)}
        data-size={size}
      >
        {multiselect ? (
          selectedOptions.length === 0 ? (
            placeholder
          ) : (
            selectedOptions.map((o) => (
              <Badge key={o.id} disabled={disabled}>
                {o.name}
                {!disabled && (
                  <span
                    className={styles.badgeClose}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSelectedOption(o.id);
                    }}
                  >
                    &times;
                  </span>
                )}
              </Badge>
            ))
          )
        ) : selectedOption ? (
          selectedOption.name
        ) : (
          placeholder
        )}

        {!multiselect && clearable && hasValue && (
          <button
            type="button"
            className={styles.clearBtn}
            aria-label="Limpar seleção"
            onClick={(e) => { e.stopPropagation(); setSelectedOption(null); onChange(null); }}
          >
            ×
          </button>
        )}
      </div>

      {showOptionList && !disabled && (
        <ul
          className={`${styles.selectOptions} ${
            listDirection === "up" ? styles.selectOptionsUp : ""
          }`}
        >
          {availableOptions.map((opt) => (
            <li
              key={opt.id}
              className={styles.customSelectOption}
              onClick={() => handleOptionClick(opt)}
            >
              {opt.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Select;
