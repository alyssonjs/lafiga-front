import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import weekOfYear from "dayjs/plugin/weekOfYear";

require('dayjs/locale/pt-br');

dayjs.extend(weekday);
dayjs.extend(weekOfYear);
dayjs.locale('pt-br')

export const daysOfWeek = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado"
];

export const getYearDropdownOptions = (currentYear) => {
  const minYear = currentYear - 1;
  const maxYear = currentYear;
  return range(minYear, maxYear + 1).map((y) => ({ label: `${y}`, value: y }));
};

export const getMonthDropdownOptions = () => {
  return range(1, 13).map((m) => ({
    value: m,
    label: dayjs()
      .month(m - 1)
      .format('MMMM'),
  }));
};

export const getNumberOfDaysInMonth = (year, month) => {
  return dayjs(`${year}-${month}-01`).daysInMonth();
};

export const createDaysForCurrentMonth = (year, month) => {
  return [...Array(getNumberOfDaysInMonth(year, month))].map((_, index) => {
    return {
      dateString: dayjs(`${year}-${month}-${index + 1}`).format('YYYY-MM-DD'),
      dayOfMonth: index + 1,
      isCurrentMonth: true,
      isFutureDay: isFutureDay(dayjs(`${year}-${month}-${index + 1}`)),
      isToday: isToday(dayjs(`${year}-${month}-${index + 1}`))
    };
  });
};

export const createDaysForPreviousMonth = (year, month, currentMonthDays) => {
  const firstDayOfTheMonthWeekday = getWeekday(currentMonthDays[0].dateString);
  const previousMonth = dayjs(`${year}-${month}-01`).subtract(1, 'month');

  const visibleNumberOfDaysFromPreviousMonth = firstDayOfTheMonthWeekday;

  const previousMonthLastMondayDayOfMonth = dayjs(
    currentMonthDays[0].dateString
  )
    .subtract(visibleNumberOfDaysFromPreviousMonth, 'day')
    .date();

  return [...Array(visibleNumberOfDaysFromPreviousMonth)].map((_, index) => {
    return {
      dateString: dayjs(
        `${previousMonth.year()}-${previousMonth.month() + 1}-${
          previousMonthLastMondayDayOfMonth + index
        }`
      ).format('YYYY-MM-DD'),
      dayOfMonth: previousMonthLastMondayDayOfMonth + index,
      isCurrentMonth: false,
      isPreviousMonth: true,
    };
  });
};

export const createDaysForNextMonth = (year, month, currentMonthDays) => {
  const lastDayOfTheMonthWeekday = getWeekday(
    `${year}-${month}-${currentMonthDays.length}`
  );
  const nextMonth = dayjs(`${year}-${month}-01`).add(1, 'month');
  const visibleNumberOfDaysFromNextMonth = 6 - lastDayOfTheMonthWeekday;

  return [...Array(visibleNumberOfDaysFromNextMonth)].map((day, index) => {
    return {
      dateString: dayjs(
        `${nextMonth.year()}-${nextMonth.month() + 1}-${index + 1}`
      ).format('YYYY-MM-DD'),
      dayOfMonth: index + 1,
      isCurrentMonth: false,
      isNextMonth: true,
    };
  });
};

export const getWeekday = (dateString) => {
  return dayjs(dateString).weekday();
};

export const isWeekendDay = (dateString) => {
  return [6, 0].includes(getWeekday(dateString));
};

const range = (from, to) => {
  const result = [];
  for (let i = from; i < to; i++) {
    result.push(i);
  }
  return result;
};

export const dateToday = (year, month) => {
  return dayjs(`${year}-${month}-01`).format('MMMM, YYYY');
};

const isFutureDay = (date) => {
  const today = dayjs();
  return dayjs(date).isAfter(today, 'day');
};

const isToday = (date) => {
  const today = dayjs();
  const inputDate = dayjs(date);
  return inputDate.isSame(today, 'day');
};

export const isCurrentMonth = (year, month) => {
  const today = dayjs();
  const inputDate = dayjs(`${year}-${month}-01`);
  return inputDate.isSame(today, 'month');
};

export const isNextMonth = (year, month) => {
  const today = dayjs();
  const inputDate = dayjs(`${year}-${month}-01`);
  const nextMonth = today.add(1, 'month');
  return inputDate.isSame(nextMonth, 'month');
};