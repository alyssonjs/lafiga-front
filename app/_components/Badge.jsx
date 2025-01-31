import * as React from "react"
import styles from '../_styles/Badge.module.css'

const Badge = ({ variant, ...props }) => {
  return (
    <div
      data-variant={variant}
      className={styles.badge}
      {...props} />
  )
}

export default Badge;