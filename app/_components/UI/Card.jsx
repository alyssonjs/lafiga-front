import * as React from "react";
import styles from "../../_styles/UI/Card.module.css";

// Props:
// - bgVar: name of a CSS variable defined in the theme without the leading `--` (e.g., "medium", "primary", "dark").
// - bgHoverVar: optional hover variant variable name (defaults to "medium-hover").
// - disableHover: disables hover styles entirely.
const Card = React.forwardRef(({ date, title, status, characters, disableHover = false, bgVar, bgHoverVar, className = '', style, ...props }, ref) => {
  const mergedStyle = {
    ...(style || {}),
    ...(bgVar ? { ['--card-bg']: `var(--${bgVar})` } : {}),
    ...(bgHoverVar ? { ['--card-bg-hover']: `var(--${bgHoverVar})` } : {}),
  };

  return (
    <div
      ref={ref}
      className={`${styles.card} ${className}`}
      data-nohover={disableHover ? 'true' : undefined}
      style={mergedStyle}
      {...props}
    />
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

const CardContent = React.forwardRef(({ className = '', ...props }, ref) => (
  <div ref={ref} className={`${styles.cardContent} ${className}`} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ ...props }, ref) => (
  <div ref={ref} className={styles.cardFooter} {...props} />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};

export default Card;
