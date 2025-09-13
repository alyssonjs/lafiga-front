"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "../../_styles/UI/Popover.module.css";

export default function Popover({ anchorEl, open, onClose, placement = 'bottom', width = 300, children }) {
  const popRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, transform: undefined });

  useEffect(() => {
    function handle(e) {
      if (!popRef.current) return;
      if (anchorEl && (anchorEl.contains(e.target) || popRef.current.contains(e.target))) return;
      onClose && onClose();
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, onClose, anchorEl]);

  const compute = () => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const gap = 8;
    let top = 0, left = 0, transform;
    if (placement === 'bottom') {
      top = rect.bottom + gap;
      // center over anchor then clamp
      left = rect.left + rect.width / 2 - width / 2;
      transform = undefined;
    } else if (placement === 'top') {
      // place above anchor using pop height if known
      const ph = popRef.current?.offsetHeight || 0;
      top = rect.top - gap - ph;
      left = rect.left + rect.width / 2 - width / 2;
      transform = undefined;
    } else if (placement === 'right') {
      const ph = popRef.current?.offsetHeight || 0;
      top = rect.top + (rect.height - ph) / 2;
      left = rect.right + gap;
      transform = undefined;
    } else {
      // left
      const ph = popRef.current?.offsetHeight || 0;
      top = rect.top + (rect.height - ph) / 2;
      left = rect.left - gap - width;
      transform = undefined;
    }
    // Clamp to viewport
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const ph2 = popRef.current?.offsetHeight || 0;
    if (placement === 'bottom' && (top + ph2 > vh - gap) && rect.top - gap - ph2 >= 0) {
      // flip to top if overflow bottom
      top = rect.top - gap - ph2;
    }
    left = Math.min(Math.max(left, gap), Math.max(gap, vw - width - gap));
    setCoords({ top, left, transform });
  };

  useEffect(() => {
    compute();
    const onScroll = () => compute();
    const onResize = () => compute();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorEl, placement, open]);

  if (!open || !anchorEl) return null;

  return (
    <div
      ref={popRef}
      className={`${styles.popover} ${styles[placement]}`}
      style={{ top: coords.top, left: coords.left, width, transform: coords.transform, position: 'fixed' }}
      role="dialog"
    >
      <div className={styles.inner}>
        {children}
      </div>
    </div>
  );
}
