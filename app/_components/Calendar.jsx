"use client";

import { useEffect, useState } from "react";
import {
  daysOfWeek,
  createDaysForCurrentMonth,
  createDaysForNextMonth,
  createDaysForPreviousMonth,
  isWeekendDay,
  getMonthDropdownOptions,
  getYearDropdownOptions,
  dateToday,
  isDateInThePast,
  isCurrentMonth,
  isNextMonth,
} from "../_helpers/calendarHelper";
import styles from "../_styles/Calendar.module.css";
import Button from "./Button";

const Calendar = ({ yearAndMonth, onYearAndMonthChange, handleNewSession }) => {
  const [year, month] = yearAndMonth;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  let currentMonthDays = createDaysForCurrentMonth(year, month);
  let previousMonthDays = createDaysForPreviousMonth(
    year,
    month,
    currentMonthDays
  );
  let nextMonthDays = createDaysForNextMonth(year, month, currentMonthDays);
  let calendarGridDayObjects = [
    ...previousMonthDays,
    ...currentMonthDays,
    ...nextMonthDays,
  ];

  const handleMonthBackButtonClick = () => {
    let nextYear = year;
    let nextMonth = month - 1;
    if (nextMonth === 0) {
      nextMonth = 12;
      nextYear = year - 1;
    }
    onYearAndMonthChange([nextYear, nextMonth]);
  };

  const handleMonthForwardButtonClick = () => {
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth === 13) {
      nextMonth = 1;
      nextYear = year + 1;
    }
    onYearAndMonthChange([nextYear, nextMonth]);
  };

  const handleMonthSelect = (evt) => {
    let nextYear = year;
    let nextMonth = parseInt(evt.target.value, 10);
    onYearAndMonthChange([nextYear, nextMonth]);
  };

  const handleYearSelect = (evt) => {
    let nextMonth = month;
    let nextYear = parseInt(evt.target.value, 10);
    onYearAndMonthChange([nextYear, nextMonth]);
  };

  const renderDay = (dayOfMonth) => {
    return <div className={styles.dayContentWrapper}>{dayOfMonth}</div>;
  };

  const renderCard = (day) => {
    if (day.isFutureDay)
      return (
        <div key={day.dateString} onClick={() => handleNewSession()} className={styles.dayEnabled}>
          {renderDay(day.dayOfMonth)}
        </div>
      );

    if (day.isToday) {
      return (
        <div key={day.dateString} onClick={() => handleNewSession()} className={styles.dayToday}>
          {renderDay(day.dayOfMonth)}
        </div>
      );
    }

    return (
      <div key={day.dateString} className={styles.dayDisabled}>
        {renderDay(day.dayOfMonth)}
      </div>
    );
  };

  return (
    isClient && (
      <div className={styles.calendarRoot}>
        <div className={styles.navigationHeader}>
          <Button variant="primary" onClick={() => handleNewSession()}>+ Marcar Sessão</Button>
          <div className={styles.monthArrowButtons}>
            <div className={styles.dateDisplay}>{dateToday(year, month)}</div>
            <Button
              size="icon"
              variant="primary"
              disabled={isCurrentMonth(year, month)}
              onClick={handleMonthBackButtonClick}
            >
              {"<"}
            </Button>
            <Button
              size="icon"
              variant="primary"
              disabled={isNextMonth(year, month)}
              onClick={handleMonthForwardButtonClick}
            >
              {">"}
            </Button>
          </div>
        </div>
        <div className={styles.daysOfWeek}>
          {daysOfWeek.map((day, index) => (
            <div key={day} className={styles.dayOfWeekHeaderCell}>
              {day}
            </div>
          ))}
        </div>
        <div className={styles.daysGrid}>
          {calendarGridDayObjects.map((day) => renderCard(day))}
        </div>
      </div>
    )
  );
};

export default Calendar;
