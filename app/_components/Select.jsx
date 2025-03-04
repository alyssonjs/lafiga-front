import React, { useState, useEffect, useRef } from "react";
import styles from "../_styles/Select.module.css";
import Badge from "./Badge";

const Select = ({ placeholder = "Placeholder", options, multiselect = false }) => {
  const [defaultSelectText, setDefaultSelectText] = useState(placeholder);

  const [selectedOptions, setSelectedOptions] = useState([]);

  const [showOptionList, setShowOptionList] = useState(false);
  const [listDirection, setListDirection] = useState("down");
  const selectContainerRef = useRef(null);

  useEffect(() => {
    setDefaultSelectText(placeholder);
  }, [placeholder]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        selectContainerRef.current &&
        !selectContainerRef.current.contains(e.target)
      ) {
        setShowOptionList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleListDisplay = () => {
    if (selectContainerRef.current) {
      const rect = selectContainerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < 250 && spaceAbove > spaceBelow) {
        setListDirection("up");
      } else {
        setListDirection("down");
      }
    }
    setShowOptionList((prevState) => !prevState);
  };

  const handleOptionClick = (e) => {
    const selectedName = e.target.getAttribute("data-name");
    const selectedId = e.target.getAttribute("data-id");

    if (multiselect) {
      const isSelected = selectedOptions.some(
        (option) => option.id === selectedId
      );

      if (isSelected) {
        setSelectedOptions((prevOptions) =>
          prevOptions.filter((option) => option.id !== selectedId)
        );
      } else {
        setSelectedOptions((prevOptions) => [
          ...prevOptions,
          { id: selectedId, name: selectedName },
        ]);
      }
    } else {
      setDefaultSelectText(selectedName);
      setShowOptionList(false);
    }
  };

  const removeSelectedOption = (id) => {
    setSelectedOptions((prevOptions) =>
      prevOptions.filter((option) => option.id !== id)
    );
  };

  const availableOptions = options.filter(
    (option) => !selectedOptions.some((selected) => selected.id === option.id)
  );

  return (
    <div className={styles.customSelectContainer} ref={selectContainerRef}>
      <div
        className={`${styles.selectedText} ${
          showOptionList ? styles.active : ""
        }`}
        tabindex="0"
        onClick={handleListDisplay}
      >
        {multiselect
          ? selectedOptions.length === 0
            ? placeholder
            : selectedOptions.map((option) => (
                <Badge key={option.id}>
                  {option.name}
                  <span
                    className={styles.badgeClose}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSelectedOption(option.id);
                    }}
                  >
                    &times;
                  </span>
                </Badge>
              ))
          : defaultSelectText}
      </div>
      {showOptionList && (
        <ul
          className={`${styles.selectOptions} ${
            listDirection === "up" ? styles.selectOptionsUp : ""
          }`}
        >
          {availableOptions.map((option) => (
            <li
              className={`${styles.customSelectOption} ${
                !multiselect && defaultSelectText === option.name
                  ? styles.selected
                  : ""
              }`}
              data-name={option.name}
              data-id={option.id}
              key={option.id}
              onClick={handleOptionClick}
            >
              {option.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Select;
