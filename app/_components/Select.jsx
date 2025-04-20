import React, { useState, useEffect, useRef } from "react";
import styles from "../_styles/Select.module.css";
import Badge from "./Badge";

const Select = ({
  placeholder = "Placeholder",
  options = [],
  multiselect = false,
  // value: for multiselect it's an array of option objects; for single select it's the selected id
  value, // no default to prevent identity changes
  onChange = () => {},
}) => {
  // Initialize state once using the initial value prop
  const [selectedOptions, setSelectedOptions] = useState(
    () => (multiselect ? (Array.isArray(value) ? value : []) : [])
  );
  const [selectedOption, setSelectedOption] = useState(
    () => (!multiselect && value != null
      ? options.find((o) => o.id === value) || null
      : null)
  );
  const [showOptionList, setShowOptionList] = useState(false);
  const [listDirection, setListDirection] = useState("down");
  const selectContainerRef = useRef(null);

  // Sync internal state when value prop changes (only if value !== undefined)
  useEffect(() => {
    if (multiselect && value !== undefined) {
      setSelectedOptions(Array.isArray(value) ? value : []);
    }
    if (!multiselect && value != null) {
      const found = options.find((o) => o.id === value) || null;
      setSelectedOption(found);
    }
  }, [value, multiselect]);

  // Close dropdown when clicking outside
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Determine dropdown direction (up/down) when opening
  useEffect(() => {
    if (showOptionList && selectContainerRef.current) {
      const rect = selectContainerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // approximate dropdown height
      const dropdownHeight = Math.min(options.length * 40, 200);
      setListDirection(spaceBelow < dropdownHeight ? "up" : "down");
    }
  }, [showOptionList, options.length]);

  const handleOptionClick = (opt) => {
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
    const newSel = selectedOptions.filter((o) => o.id !== id);
    setSelectedOptions(newSel);
    onChange(newSel);
  };

  const availableOptions = multiselect
    ? options.filter((o) => !selectedOptions.some((s) => s.id === o.id))
    : options;

  return (
    <div
      className={styles.customSelectContainer}
      ref={selectContainerRef}
    >
      <div
        className={`${styles.selectedText} ${
          showOptionList ? styles.active : ""
        }`}
        tabIndex={0}
        onClick={() => setShowOptionList((v) => !v)}
      >
        {multiselect ? (
          selectedOptions.length === 0 ? (
            placeholder
          ) : (
            selectedOptions.map((o) => (
              <Badge key={o.id}>
                {o.name}
                <span
                  className={styles.badgeClose}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSelectedOption(o.id);
                  }}
                >
                  &times;
                </span>
              </Badge>
            ))
          )
        ) : selectedOption ? (
          selectedOption.name
        ) : (
          placeholder
        )}
      </div>
      {showOptionList && (
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
