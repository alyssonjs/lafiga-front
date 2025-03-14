import * as React from "react";
import styles from "../_styles/Button.module.css";

const Button = React.forwardRef(
  ({ variant, className, size, status, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-size={size}
        data-variant={variant}
        data-status={status}
        className={`${styles.button} ${className ? className : ""}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
