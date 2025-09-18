import * as React from "react";
import styles from "../../_styles/UI/Divider.module.css";

const Divider = React.forwardRef(({ className, color = "white", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`${styles.hrWrap} ${className || ""}`}
      style={{ "--divider-color": color }}
      {...props}
    >
      <hr className={styles.divider} />
    </div>
  );
});

Divider.displayName = "Divider";
export default Divider;