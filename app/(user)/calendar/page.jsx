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
  editAdminDateDimension
} from "../../_services/railsApi";
import dayjs from "dayjs";
import { useAuth } from "../../_context/AuthContext";

export default function CalendarPage() {
  const [groups, setGroups] = useState([]);
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

  useEffect(() => {
    if (!Array.isArray(dateDims) || dateDims.length === 0) return;
  
    const toDisable = dateDims
      .filter(d => !d.available)
      .map(d =>
        dayjs(`${d.year}-${d.month}-${d.day}`, 'YYYY-M-D').toDate()
      );
  
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
      console.log(dateDim, '1')
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

  const changeDateAvailability = async (dateDimensionId, data) => {

    try {
      let result;
      result = await editAdminDateDimension(dateDimensionId, { available: data})
      const updatedDateDimId = result.date_dimension.id;
      setDateDims((prev) =>
        prev.map((dd) =>
          dd.id === updatedDateDimId
            ? { ...dd, available: result.date_dimension.available }
            : dd
        )
      );
      setEditing(false);
      setIsOpen(false);
    } catch (e) {
      setError(e.message);
    }
  }

  const handleSave = async (data) => {
    try {
      let result;

      if (editing) {
        result = await editAdminSchedule(data.id, data);

        setSchedules((prev) =>
          prev.map((s) => (s.id === result.schedule.id ? result.schedule : s))
        );
      } else {
        result = await createAdminSchedule(data);
        setSchedules((prev) => [...prev, result.schedule ]);
      }
  
      const updatedDateDimId = result.schedule.date_dimension_id;

      setDateDims((prev) =>
        prev.map((dd) =>
          dd.id === updatedDateDimId
            ? { ...dd, schedule: result.schedule }
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
        isAdmin={role === 'Admin'}
      />

      {
        role &&
        <ScheduleFormDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSave={handleSave}
          disabledDates={disabledDates}
          initialData={currentSchedule || {}}
          changeDateAvailability={changeDateAvailability}
          groups={groups}
          userRole={role}
        />
      }
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
