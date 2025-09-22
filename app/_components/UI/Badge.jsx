"use client"
import React, { useRef, useEffect, useState } from 'react';
import styles from '../../_styles/UI/Badge.module.css';

const Badge = ({ children, text, className = '', variant = '', ...props }) => {
  const svgRef = useRef(null);
  const textRef = useRef(null);
  const [width, setWidth] = useState(0);

  const height = 30;
  const padding = 25;
  const diamondOffset = 7.5;

  const badgeText = children ?? text;

  useEffect(() => {
    if (!textRef.current) return;

    const bbox = textRef.current.getBBox();
    const newWidth = bbox.width + padding * 2;
    setWidth(newWidth);
  }, [badgeText]);

  const fontSize = 10;
  const textColor = 'var(--badge-text-color, #222)';
  const y = height / 2 + (fontSize / 3) - 2;

  const bgPath = () => `
    M15 2
    H${width - 15}
    L${width - 2} ${height / 2}
    L${width - 15} ${height - 2}
    H15
    L2 ${height / 2}
    Z
  `;

  const leftDiamond = () => `
    M15 ${height / 2 - diamondOffset / 2}
    L18.535 ${height / 2}
    L15 ${height / 2 + diamondOffset / 2}
    L11.4645 ${height / 2}
    Z
  `;

  const rightDiamond = () => `
    M${width - 15} ${height / 2 - diamondOffset / 2}
    L${width - 11.4645} ${height / 2}
    L${width - 15} ${height / 2 + diamondOffset / 2}
    L${width - 18.535} ${height / 2}
    Z
  `;

  return (
    <svg
      ref={svgRef}
      className={`${styles['badge']} ${className}`}
      data-variant={variant}
      width={width || 'auto'}
      height={height}
      viewBox={`0 0 ${width || 100} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path id="bg" d={bgPath()} className={styles['badge-bg']} />
      <text
        ref={textRef}
        x={width / 2}
        y={y}
        fontSize={fontSize}
        textAnchor="middle"
        fill={textColor}
        className={styles['badge-text']}
      >
        {badgeText}
      </text>
      <path id="left-diamond" d={leftDiamond()} className={styles['badge-diamond']} />
      <path id="right-diamond" d={rightDiamond()} className={styles['badge-diamond']} />
    </svg>
  );
};

export default Badge;