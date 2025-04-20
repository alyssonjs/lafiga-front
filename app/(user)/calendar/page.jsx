"use client";

import { useEffect, useState } from "react";
import Calendar from "../../_components/Calendar";
import ScheduleFormDialog from "../../_components/ScheduleFormDialog";
import ScheduleInfoDialog from "../../_components/ScheduleInfoDialog";
import {
  fetchDateDimensions,
  fetchPublicSchedules,
  getPublicGroups,
  createAdminSchedule,
  editAdminSchedule,
} from "../../_services/railsApi";
import dayjs from "dayjs";

export default function CalendarPage() {
  const [groups, setGroups] = useState([]);
  const [dateDims, setDateDims] = useState([]);
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

  useEffect(() => {
    getPublicGroups()
      .then((data) => setGroups(data))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    fetchDateDimensions(year, month)
      .then((data) => setDateDims(data))
      .catch((e) => setError(e.message));

    fetchPublicSchedules()
      .then((data) => setSchedules(data))
      .catch((e) => setError(e.message));
  }, [year, month]);

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
      });
      setEditing(false);
      setIsOpen(true);
    }
    setError(null);
  };

  const handleSave = async (data) => {
    try {
      let result;

      if (editing) {
        result = await editAdminSchedule(data.id, data);

        setSchedules((prev) =>
          prev.map((s) => (s.id === result.id ? result : s))
        );
      } else {
        result = await createAdminSchedule(data);
        setSchedules((prev) => [...prev, result]);
      }
  
      const updatedDateDimId = result.date_dimension_id;

      setDateDims((prev) =>
        prev.map((dd) =>
          dd.id === updatedDateDimId
            ? { ...dd, schedule: result }   // injeta a schedule no dateDim
            : dd
        )
      );
      setEditing(false);
      setIsOpen(false);
    } catch (e) {
      setError(e.message);
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
      />

      <ScheduleFormDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={handleSave}
        initialData={currentSchedule || {}}
        groups={groups}
      />

      <ScheduleInfoDialog
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        schedule={infoSchedule}
        dateDimension={infoDateDim}
        openEditModal={openEditModal}
      />

      {error && <div style={{ color: "red" }}>{error}</div>}
    </>
  );
}
