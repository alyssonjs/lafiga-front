import React from "react";
import { Card, CardContent } from "../UI/Card";
import Badge from "../UI/Badge";
import dayjs from "dayjs";
import cardStyles from "../../_styles/schedule/ScheduleCard.module.css";

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
      onClick={() => onClick(schedule)} className={cardStyles.card}
    >
      <CardContent className={cardStyles.content}>
        <h4 className={cardStyles.title}>{title}</h4>

        <p className={cardStyles.date}>{formattedDate}</p>

        <Badge variant={statusColor} className={cardStyles.badge}>
          {statusName}
        </Badge>

        {group && <p className={cardStyles.group}>{group.name}</p>}
      </CardContent>
    </Card>
  );
}
