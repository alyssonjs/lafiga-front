"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "../../_styles/UI/Popover.module.css";

export default function Popover({
  anchorEl,
  open,
  onClose,
  placement = 'bottom',
  width = 300,
  marginThreshold = 8,
  anchorOrigin,
  transformOrigin,
  children
}) {
  const popRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, transform: undefined, arrowX: '50%', arrowY: '50%' });
  const [w, setW] = useState(width);

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
    const gap = Number(marginThreshold) || 8;
    let top = 0, left = 0, transform;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    // Clamp width to viewport with margins
    const effWidth = Math.max(160, Math.min(Number(width || 300), vw - gap * 2));
    setW(effWidth);
    // Resolve anchor/transform origins (MUI-like)
    const ao = anchorOrigin || (() => {
      if (placement === 'top') return { vertical: 'top', horizontal: 'center' };
      if (placement === 'left') return { vertical: 'center', horizontal: 'left' };
      if (placement === 'right') return { vertical: 'center', horizontal: 'right' };
      return { vertical: 'bottom', horizontal: 'center' };
    })();
    const to = transformOrigin || (() => {
      if (placement === 'top') return { vertical: 'bottom', horizontal: 'center' };
      if (placement === 'left') return { vertical: 'center', horizontal: 'right' };
      if (placement === 'right') return { vertical: 'center', horizontal: 'left' };
      return { vertical: 'top', horizontal: 'center' };
    })();

    const ax = ao.horizontal === 'left' ? rect.left : ao.horizontal === 'right' ? rect.right : (rect.left + rect.right) / 2;
    const ay = ao.vertical === 'top' ? rect.top : ao.vertical === 'bottom' ? rect.bottom : (rect.top + rect.bottom) / 2;

    const ph = popRef.current?.offsetHeight || 0;
    const pw = effWidth;
    const tox = to.horizontal === 'left' ? 0 : to.horizontal === 'right' ? pw : pw / 2;
    const toy = to.vertical === 'top' ? 0 : to.vertical === 'bottom' ? ph : ph / 2;
    left = ax - tox;
    top = ay - toy;
    transform = undefined;

    // Clamp to viewport / flip if needed
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const ph2 = popRef.current?.offsetHeight || 0;
    if ((ao.vertical === 'bottom' || placement === 'bottom') && (top + ph2 > vh - gap) && (rect.top - ph2 - gap >= gap)) {
      top = rect.top - ph2 - gap;
    }
    if ((ao.vertical === 'top' || placement === 'top') && (top < gap) && (rect.bottom + gap + ph2 <= vh - gap)) {
      top = rect.bottom + gap; // flip down
    }
    if (top < gap) top = gap;
    if (top + ph2 > vh - gap) top = Math.max(gap, vh - ph2 - gap);
    left = Math.min(Math.max(left, gap), Math.max(gap, vw - pw - gap));

    // Arrow offsets relative to final position
    const arrowX = `${Math.max(0, Math.min(100, Math.round(((ax - left) / pw) * 100)))}%`;
    const arrowY = `${Math.max(0, Math.min(100, Math.round(((ay - top) / (ph2 || 1)) * 100)))}%`;
    setCoords({ top, left, transform, arrowX, arrowY });
  };

  useEffect(() => {
    if (!open) return;
    // Compute immediately and in the next frame to account for actual height after mount
    compute();
    const raf = requestAnimationFrame(() => compute());
    // Recompute when popover content resizes (e.g., images/fonts/wrap)
    const ro = (window.ResizeObserver && popRef.current) ? new ResizeObserver(() => compute()) : null;
    if (ro) ro.observe(popRef.current);
    const onScroll = () => compute();
    const onResize = () => compute();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
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
      style={{
        top: coords.top,
        left: coords.left,
        width: w,
        transform: coords.transform,
        position: 'fixed',
        maxWidth: 'calc(100vw - 16px)',
        maxHeight: 'calc(100vh - 16px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        '--arrow-x': coords.arrowX,
        '--arrow-y': coords.arrowY
      }}
    role="dialog"
    >
      <div className={styles.inner}>
        {children}
      </div>
    </div>
  );
}
