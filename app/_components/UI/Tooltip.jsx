"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../../_styles/UI/Tooltip.module.css";

export default function Tooltip({ content, placement = 'top', children, maxWidth = 260 }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({});
  const wrapRef = useRef(null);
  const tipRef = useRef(null);
  const hideTimer = useRef(null);

  const show = () => {
    if (!wrapRef.current) return;
    setVisible(true);
  };
  const hide = () => {
    setVisible(false);
  };

  // Simple touch support: show briefly on touch
  const onTouch = (e) => {
    try { e.stopPropagation(); } catch (_) {}
    show();
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(hide, 1800);
  };

  useEffect(() => {
    if (!visible) return;
    const el = wrapRef.current;
    const tip = tipRef.current;
    if (!el || !tip) return;
    const r = el.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const gap = 8;
    let style = {};
    switch (placement) {
      case 'bottom':
        style = { top: r.height + gap, left: (r.width - t.width) / 2 };
        break;
      case 'left':
        style = { top: (r.height - t.height) / 2, left: -t.width - gap };
        break;
      case 'right':
        style = { top: (r.height - t.height) / 2, left: r.width + gap };
        break;
      case 'top':
      default:
        style = { top: -t.height - gap, left: (r.width - t.width) / 2 };
    }
    setPos(style);
  }, [visible, placement, content]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  return (
    <span
      ref={wrapRef}
      className={styles.wrap}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onTouchStart={onTouch}
      tabIndex={0}
    >
      {children}
      {visible && (
        <span ref={tipRef} className={`${styles.tip} ${styles[placement]}`} style={{ ...pos, maxWidth }} role="tooltip">
          <span className={styles.inner}>
            {typeof content === 'string' ? (<span style={{ whiteSpace: 'pre-line' }}>{content}</span>) : content}
          </span>
        </span>
      )}
    </span>
  );
}

