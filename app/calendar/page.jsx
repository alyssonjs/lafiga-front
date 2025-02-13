"use client";

import { useState } from "react";
import Calendar, { CalendarDayHeader } from "../_components/Calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../_components/Dialog";
import Input from "../_components/Input";
import Button from "../_components/Button";

const CalendarPage = () => {
  const [yearAndMonth, setYearAndMonth] = useState([2025, 2]);
  const [isOpen, setIsOpen] = useState(false);

  const handleNewSession = (day) => {
    setIsOpen(true)
  };

  return (
    <>
      <Calendar
        yearAndMonth={yearAndMonth}
        onYearAndMonthChange={setYearAndMonth}
        handleNewSession={handleNewSession}
      />
      {isOpen && (
        <Dialog onClose={() => setIsOpen(false)}>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <DialogContent>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1em" }}
            >
              <Input type="email" placeholder="Input" />
              <Input type="email" placeholder="Input 2" />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Close Dialog Modal
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </>
  );
};

export default CalendarPage;
