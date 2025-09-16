"use client";

import React from "react";
import { Card, CardContent } from "../UI/Card";
import styles from "../../_styles/group/GroupCard.module.css";

const GroupCard = ({ group, onClick }) => {
  return (
    <Card onClick={() => onClick(group)} style={{width: "350px"}}>
      <CardContent className={styles.cardContent}>
        <h3 className={styles.name}>{group.name}</h3>
        <p className={styles.info}>
          {group.season.charAt(0).toUpperCase() + group.season.slice(1)}{" "}
          {group.year} – Dia {group.day}
        </p>
      </CardContent>

    </Card>
  );
};

export default GroupCard;
