"use client";

import { useEffect, useState, useMemo } from "react";
import Calendar from "../../_components/UI/Calendar";
import ScheduleFormDialog from "../../_components/schedule/ScheduleFormDialog";
import ScheduleInfoDialog from "../../_components/schedule/ScheduleInfoDialog";
import {
  crudFor,
  fetchDateDimensions,
} from "../../_services/railsApi";
import dayjs from "dayjs";
import { useAuth } from "../../_context/AuthContext";

export default function CalendarPage() {
  const [dateDims, setDateDims] = useState([]);
  const [disabledDates, setDisabledDates] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoSchedule, setInfoSchedule] = useState(null);
  const [infoDateDim, setInfoDateDim] = useState(null);
  
  const [yearAndMonth, setYearAndMonth] = useState([
    dayjs().year(),
    dayjs().month() + 1,
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);

  const [error, setError] = useState(null);

  const [year, month] = yearAndMonth;
  const { role } = useAuth();
  const schedulesApi = useMemo(
    () => crudFor("schedules", role),
    [role]
  );
  const dateDimensionsApi = useMemo(
    () => crudFor("date_dimensions", role),
    [role]
  );

  useEffect(() => {
    fetchDateDimensions(year, month, role === 'admin' ? 'admin' : 'public')
      .then((data) => {
        const mapped = data.map((d) => ({
          ...d,
          // força horário local: ano, mês-1, dia
          date: new Date(d.year, d.month - 1, d.day),
        }));
        setDateDims(mapped);
      })
      .catch((e) => setError(e.message));
  }, [year, month, role]);

  useEffect(() => {
    schedulesApi
      .getAll()
      .then(({ schedules }) => setSchedules(schedules))
      .catch(console.error);
  }, [schedulesApi]);

  useEffect(() => {
    if (dateDims.length === 0) return;
    const toDisable = dateDims
      .filter((d) => !d.available)
      .map((d) => d.date);
    setDisabledDates(toDisable);
  }, [dateDims]);

  const openEditModal = (sched, dateDim) => {
    setCurrentSchedule({
      id: sched.id,
      date_dimension_id: dateDim.id,
      date: dateDim.date,
      title: sched.title,
      group_id: sched.group_id,
      status: sched.status,
    });
    setEditing(true);
    setInfoOpen(false);
    setIsOpen(true);
  }

  const handleNewSession = (dateDim, sched) => {
    if (sched) {
      setInfoSchedule(sched);
      setInfoDateDim(dateDim);

      setInfoOpen(true);

    } else {
      setCurrentSchedule({
        date_dimension_id: dateDim.id,
        date: dateDim.date,
        available: dateDim.available
      });
      setEditing(false);
      setIsOpen(true);
    }
    setError(null);
  };

  const changeDateAvailability = async (dateDimensionId, available) => {
    try {
      const { date_dimension: updatedDim } = await dateDimensionsApi.update(dateDimensionId, { available });

      setDateDims((prev) =>
        prev.map((dd) =>
          dd.id === updatedDim.id ? { ...dd, available: updatedDim.available } : dd
        )
      );
    } catch (err) {
      console.error("Erro ao alterar disponibilidade:", err);
      setError("Não foi possível alterar a disponibilidade da data.");
    } finally {
      setEditing(false);
      setIsOpen(false);
    }
  };
  

  const handleSave = async (payload) => {
    try {
      const fn   = editing ? schedulesApi.update : schedulesApi.create;
      const { schedule } = await fn(payload);
  
      setSchedules((prev) => {
        const exists = prev.some((s) => s.id === schedule.id);
        return exists
          ? prev.map((s) => (s.id === schedule.id ? schedule : s)) // replace
          : [...prev, schedule];                                   // append
      });
  
      setDateDims((prev) =>
        prev.map((dd) =>
          dd.id === schedule.date_dimension_id
            ? { ...dd, schedule }
            : dd
        )
      );
  
      setEditing(false);
      setIsOpen(false);
    } catch (err) {
      console.error("Erro ao salvar schedule:", err);
      setError("Não foi possível salvar a sessão. Tente novamente.");
    }
  };
  
  return (
    <>
      <Calendar
        dateDimensions={dateDims}
        schedules={schedules}
        yearAndMonth={yearAndMonth}
        onYearAndMonthChange={setYearAndMonth}
        handleNewSession={handleNewSession}
        isAdmin={role === "admin"}
      />

      {
        role && isOpen &&
        <ScheduleFormDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSave={handleSave}
          disabledDates={disabledDates}
          initialData={currentSchedule || {}}
          changeDateAvailability={changeDateAvailability}
          userRole={role}
        />
      }
      { 
        infoOpen &&
        <ScheduleInfoDialog
          isOpen={infoOpen}
          onClose={() => setInfoOpen(false)}
          schedule={infoSchedule}
          dateDimension={infoDateDim}
          openEditModal={openEditModal}
        />
      }

      {error && <div style={{ color: "red" }}>{error}</div>}
    </>
  );
}
