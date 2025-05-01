import * as React from "react";
import styles from "../_styles/Alert.module.css";

const Alert = React.forwardRef(
  ({className, variant, ...props }, ref) => {
    return (
      <div
        data-slot="alert"
        role="alert"
        data-variant={variant}
        className={`${styles.alert} ${className ? className : ""}`}
        {...props}
      />
    );
  }
);

const AlertTitle = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        data-slot="alert-title"
        className={`${styles.alertTitle} ${className ? className : ""}`}
        {...props}
      />
    );
  }
);

const AlertDescription = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        data-slot="alert-description"
        className={`${styles.alertDescription} ${className ? className : ""}`}
        {...props}
      />
    );
  }
);

Alert.displayName = "Alert";
AlertTitle.displayName = "AlertTitle";
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription }
export default Alert;