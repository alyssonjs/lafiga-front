import * as React from "react"
import styles from '../../_styles/UI/Badge.module.css'

const Badge = ({ variant, className = '', ...props }) => {
  return (
    <div
      data-variant={variant}
      className={`${styles.badge} ${className}`}
      {...props} />
  )
}

export default Badge;