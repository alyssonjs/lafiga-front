'use client';

import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import styles from '../../_styles/UI/DatePicker.module.css';

/**
 * DatePicker component
 * --------------------
 * Props
 *  - onChange       (Date | string) => void   Callback fired when user picks a date
 *  - date           Date | string | null      Currently selected date (controlled)
 *  - disabledDates  Array<Date | string>      Specific days to disable (optional)
 *  - isDisabled     boolean                  Locks the picker entirely when true
 */

function normaliseDate(d) {
  if (d instanceof Date && !isNaN(d)) return d;
  if (typeof d === 'string') {
    const parsed = new Date(d);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

export default function DatePicker({
  onChange,
  date = null,
  disabledDates = [],
  isDisabled = true,
}) {
  const inputRef = useRef(null);
  const fpInstance = useRef(null);

  const safeDisabled = disabledDates.map(normaliseDate).filter(Boolean);
  useEffect(() => {
    if (!inputRef.current) return;

    fpInstance.current = flatpickr(inputRef.current, {
      dateFormat: 'd/m/Y',
      defaultDate: date ?? undefined,
      disable: safeDisabled,
      theme: 'none',
      clickOpens: !isDisabled,

      onReady: () => {
        document
          .querySelector('.flatpickr-calendar')
          ?.classList.add('custom-flatpickr');
      },
      onChange: (selectedDates) => {
        if (selectedDates.length > 0) {
          onChange(selectedDates[0].toLocaleDateString());
        }
      },
    });

    return () => fpInstance.current?.destroy();
  }, [date]);

  useEffect(() => {
    if (fpInstance.current) {
      fpInstance.current.set('disable', safeDisabled);
    }
  }, [safeDisabled]);

  useEffect(() => {
    if (fpInstance.current && date) {
      const parsed = normaliseDate(date);
      if (parsed) fpInstance.current.setDate(parsed, true);
    }
  }, [date]);

  return (
    <input
      ref={inputRef}
      className={`${styles.datePicker} pixel`}
      placeholder="Selecione a data"
      readOnly
      disabled={isDisabled}
    />
  );
}
