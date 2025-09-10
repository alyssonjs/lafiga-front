"use client";

import React from "react";
import Card, { CardContent } from "./UI/Card";
import styles from "../_styles/UserCard.module.css";

const userCard = ({ user, onClick }) => {
  return (
    <Card onClick={() => onClick(user)} style={{width: "350px"}}>
      <CardContent className={styles.cardContent}>
        <div className={styles.details}>
          <span className={styles.name}>{user.name}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default userCard;
