import * as React from "react";
import styles from "../_styles/TextArea.module.css";

const TextArea = React.forwardRef(({ type, className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      type={type}
      className={`${styles.textarea} ${className}`}
      {...props}
    />
  );
});

TextArea.displayName = "TextArea";
export default TextArea;
