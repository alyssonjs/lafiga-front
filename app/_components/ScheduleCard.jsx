import React from "react";
import Card, { CardContent } from "./Card";
import Badge from "./Badge";
import dayjs from "dayjs";
import cardStyles from "../_styles/ScheduleCard.module.css";

export default function ScheduleCard({ schedule, onClick = () => {} }) {
  const {
    title,
    status,
    group,
    date_dimension: dim,
  } = schedule;

  const formattedDate = dayjs(dim.date).format("DD/MM/YYYY");

  const statusColor = {
    waiting: "highlight",
    reserved: "primary",
  }[status] || "secondary";

  const statusName = {
    waiting: "Aguardando",
    reserved: "Confirmada",
  }[status] || "secondary";

  return (
    <Card
      onClick={() => onClick(schedule)} styles={cardStyles.card}
    >
      <CardContent styles={cardStyles.content}>
        <h4 styles={cardStyles.title}>{title}</h4>

        <p styles={cardStyles.date}>{formattedDate}</p>

        <Badge variant={statusColor} styles={cardStyles.badge}>
          {statusName}
        </Badge>

        {group && <p styles={cardStyles.group}>{group.name}</p>}
      </CardContent>
    </Card>
  );
}
