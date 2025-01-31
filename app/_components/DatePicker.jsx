'use client';

import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import styles from '../_styles/DatePicker.module.css';

const DatePicker = ({ onChange }) => {
  const inputRef = useRef(null);
  const fpInstance = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      fpInstance.current = flatpickr(inputRef.current, {
        dateFormat: 'd/m/Y',
        onChange: (selectedDates) => {
          if (selectedDates.length > 0) {
            onChange(selectedDates[0].toLocaleDateString());
          }
        },
        // Forçar a classe do tema
        theme: 'none', // Desabilita o tema padrão
        onReady: () => {
          // Aplica classes personalizadas aos elementos internos
          document.querySelector('.flatpickr-calendar')?.classList.add('custom-flatpickr');
        }
      });
    }

    return () => {
      if (fpInstance.current) {
        fpInstance.current.destroy();
      }
    };
  }, [onChange]);

  return (
    <input 
      ref={inputRef} 
      className={`${styles.datePicker} pixel`} 
      placeholder="Selecione a data" 
      readOnly 
    />
  );
};

export default DatePicker;