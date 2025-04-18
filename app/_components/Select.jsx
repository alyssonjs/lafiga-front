import React, { useState, useEffect, useRef } from "react";
import styles from "../_styles/Select.module.css";
import Badge from "./Badge";

const Select = ({
  placeholder = "Placeholder",
  options,
  multiselect = false,
  value = multiselect ? [] : null,
  onChange = () => {},
}) => {
  const [selectedOptions, setSelectedOptions] = useState(
    multiselect ? value : []
  );
  const [defaultSelectText, setDefaultSelectText] = useState(
    placeholder
  );
  const [showOptionList, setShowOptionList] = useState(false);
  const [listDirection, setListDirection] = useState("down");
  const selectContainerRef = useRef(null);

  // sempre que value mudar, sincroniza
  useEffect(() => {
    if (multiselect) {
      setSelectedOptions(value);
    } else if (value) {
      setDefaultSelectText(
        options.find((o) => o.id === value)?.name || placeholder
      );
    }
  }, [value, options, placeholder, multiselect]);

  // resto dos hooks iguais...

  const handleOptionClick = (e) => {
    const id = e.target.getAttribute("data-id");
    const name = e.target.getAttribute("data-name");
    if (multiselect) {
      let newSel;
      const exists = selectedOptions.some((o) => o.id === id);
      if (exists) {
        newSel = selectedOptions.filter((o) => o.id !== id);
      } else {
        newSel = [...selectedOptions, { id, name }];
      }
      setSelectedOptions(newSel);
      onChange(newSel);
    } else {
      setDefaultSelectText(name);
      setShowOptionList(false);
      onChange(id);
    }
  };

  const removeSelectedOption = (id) => {
    const newSel = selectedOptions.filter((o) => o.id !== id);
    setSelectedOptions(newSel);
    onChange(newSel);
  };

  const availableOptions = options.filter(
    (o) => !selectedOptions.some((s) => s.id === o.id)
  );

  return (
    <div className={styles.customSelectContainer} ref={selectContainerRef}>
      <div
        className={`${styles.selectedText} ${
          showOptionList ? styles.active : ""
        }`}
        tabIndex={0}
        onClick={() => {
          // calcula direção...
          setShowOptionList((v) => !v);
        }}
      >
        {multiselect
          ? selectedOptions.length === 0
            ? placeholder
            : selectedOptions.map((o) => (
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
          : defaultSelectText}
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
              data-id={opt.id}
              data-name={opt.name}
              className={styles.customSelectOption}
              onClick={handleOptionClick}
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
