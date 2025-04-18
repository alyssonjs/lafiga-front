"use client";

import { useEffect, useState } from "react";
import styles from "../_styles/Calendar.module.css";
import Button from "./Button";
import dayjs from "dayjs";

const Calendar = ({
  dateDimensions = [],
  yearAndMonth: [year, month],
  onYearAndMonthChange,
  handleNewSession,
}) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  if (!isClient || dateDimensions.length === 0) {
    return <div className={styles.loading}>Carregando calendário…</div>;
  }

  const today = dayjs().startOf("day");
  
  const monthDates = dateDimensions.filter(
    (d) => d.year === year && d.month === month
  );

  const firstOfMonth = dayjs(new Date(year, month - 1, 1));
  const blanksBefore = (firstOfMonth.day() + 6) % 7;

  const cells = [
    ...Array(blanksBefore).fill(null),
    ...monthDates.map((d) => {
      const date = dayjs(d.date);
      const isPast = date.isBefore(today, "day");
      const isFuture = date.isAfter(today, "day");
      const scheduleForDay = d.schedule

      let cls = styles.dayDisabled;
      if (scheduleForDay) cls = styles.dayReserved;
      else if (date.isSame(today, "day")) cls = styles.dayToday;
      else if (isFuture) cls = styles.dayEnabled;

      return { d, cls, scheduleForDay };
    }),
  ];

  while (cells.length < 35) cells.push(null);

  const renderCell = (cell, idx) => {
    if (!cell) {
      return <div key={idx} className={`${styles.day} ${styles.dayDisabled}`} />;
    }
    const { d, cls, scheduleForDay } = cell;
    const date = dayjs(d.date);

    return (
      <div
        key={d.date}
        className={`${styles.day} ${cls}`}
        onClick={() =>
          cls !== styles.dayDisabled && handleNewSession(d, scheduleForDay)
        }
      >
        <div className={styles.dayContentWrapper}>{date.date()}</div>
        {scheduleForDay && (
          <div className={styles.scheduleInfo}>
            <div>{scheduleForDay.group.name}</div>
          </div>
        )}
      </div>
    );
  };

  const todayYear = today.year();
  const todayMonth = today.month() + 1;

  let prevYear = todayYear;
  let prevMonth = todayMonth - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  let nextYear = todayYear;
  let nextMonth = todayMonth + 1;
  if (nextMonth === 13) {
    nextMonth = 1;
    nextYear += 1;
  }

  return (
    <div className={styles.calendarRoot}>
      <div className={styles.navigationHeader}>
        <Button
          size="icon"
          variant="primary"
          disabled={year === prevYear && month === prevMonth}
          onClick={() => {
            let y = year, m = month - 1;
            if (m === 0) {
              m = 12;
              y -= 1;
            }
            onYearAndMonthChange([y, m]);
          }}
        >
          {"<"}
        </Button>
  
        <div className={styles.dateDisplay}>
          {firstOfMonth.format("MMMM YYYY")}
        </div>
  
        <Button
          size="icon"
          variant="primary"
          // desabilita se estamos já no próximo mês permitido
          disabled={year === nextYear && month === nextMonth}
          onClick={() => {
            let y = year, m = month + 1;
            if (m === 13) {
              m = 1;
              y += 1;
            }
            onYearAndMonthChange([y, m]);
          }}
        >
          {">"}
        </Button>
      </div>

      <div className={styles.daysOfWeek}>
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} className={styles.dayOfWeekHeaderCell}>
            {d}
          </div>
        ))}
      </div>

      <div className={styles.daysGrid}>{cells.map(renderCell)}</div>
    </div>
  );
};

export default Calendar;
