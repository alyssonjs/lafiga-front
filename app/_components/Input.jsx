import * as React from "react";
import styles from "../_styles/Input.module.css";

const Input = React.forwardRef(({ type, className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={`${styles.input} ${className}`}
      {...props}
    />
  );
});

Input.displayName = "Input";
export default Input;
