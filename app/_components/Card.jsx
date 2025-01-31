import * as React from "react";
import styles from "../_styles/Card.module.css";

const Card = React.forwardRef(({ date, title, status, characters, ...props }, ref) => {
  return (
    <div ref={ref} className={`${styles.card}`} {...props} />
    // <div className={`${styles.card} ${styles.pixel}`}>
    //   <div className={styles.cardDate}>{date}</div>
    //   <div className={styles.cardTitle}>{title}</div>
    //   <div className={`${styles.cardStatus} ${styles[status]}`}>{status}</div>
    //   <div className={styles.cardDescription}>
    //     <ul className={styles.characterList}>
    //       {characters.map((char, index) => (
    //         <li key={index}>{char}</li>
    //       ))}
    //     </ul>
    //   </div>
    // </div>
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ ...props }, ref) => (
  <div ref={ref} className={styles.cardHeader} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ ...props }, ref) => (
  <h1 ref={ref} className={styles.cardTitle} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ ...props }, ref) => (
  <div ref={ref} className={styles.cardDescription} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ ...props }, ref) => (
  <div ref={ref} className={styles.cardContent} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ ...props }, ref) => (
  <div ref={ref} className={styles.cardFooter} {...props} />
));
CardFooter.displayName = "CardFooter";

const CardComponent = {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};

export default CardComponent;
