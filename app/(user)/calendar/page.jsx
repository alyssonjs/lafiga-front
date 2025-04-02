"use client";

import { useState, useEffect } from "react";
import Calendar from "../../_components/Calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../_components/Dialog";
import Input from "../../_components/Input";
import Button from "../../_components/Button";
import DatePicker from "../../_components/DatePicker";
import Select from "../../_components/Select";
import dayjs from "dayjs";
import styles from "../../_styles/CalendarPage.module.css";
import { fetchSchedules } from '../../_services/railsApi';

require("dayjs/locale/pt-br");
dayjs.locale("pt-br");

const CalendarPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSchedules()
      .then((data) => {
        console.log("Schedules recebidos:", data);
        setSchedules(data);
      })
      .catch((err) => {
        console.error("Erro ao buscar schedules:", err);
        setError(err.message);
      });
  }, []);

  const [yearAndMonth, setYearAndMonth] = useState([
    dayjs().year(),
    dayjs().month() + 1,
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(null);
  const [edit, setEdit] = useState(false);

  let options = [
    { id: 1, name: "Jorge o Rei da Floresta" },
    { id: 2, name: "Nelson da Capitinga" },
    { id: 3, name: "Almir Rouche" },
    { id: 4, name: "Mano Brown" },
    { id: 5, name: "Arnold Schwarzenegger" },
    { id: 6, name: "Bob Dylan" },
    { id: 7, name: "Jão" },
    { id: 8, name: "Padre Cícero" },
    { id: 9, name: "Janja" },
    { id: 10, name: "Militão" },
  ];

  const handleNewSession = (date, scheduleForDay) => {
    if (date) {
      setDate(dayjs(date).format("DD/MM/YYYY"));
      setEdit(!scheduleForDay)
    } else {
      setDate(null);
    }

    setIsOpen(true);
  };

  return (
    <>
      <Calendar
        schedules={schedules}
        yearAndMonth={yearAndMonth}
        onYearAndMonthChange={setYearAndMonth}
        handleNewSession={handleNewSession}
      />
      {isOpen && (
        <Dialog onClose={() => setIsOpen(false)}>
          <DialogHeader>
            <DialogTitle>A Marcagem de Sessão</DialogTitle>
            <DialogDescription>Marcando Sessão</DialogDescription>
          </DialogHeader>
          <DialogContent>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1em" }}
            >
              <DatePicker date={date} />
              <Input type="title" placeholder="Título" />
              <Select
                type="chars"
                options={options}
                placeholder="Personagens"
                multiselect
              />
            </div>
          </DialogContent>
          <DialogFooter>
            <div className={styles.footer}>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              {
                edit ??
                <Button variant="highlight" onClick={() => setIsOpen(false)}>
                Marcar
              </Button>
              }
            </div>
          </DialogFooter>
        </Dialog>
      )}
    </>
  );
};

export default CalendarPage;
