// components/Carousel.tsx
'use client';

import { useState, useEffect } from 'react';
import styles from '../_styles/Carousel.module.css';
import Image from "next/image";


export default function Carousel({ slides, onSlideChange }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const totalSlides = slides.length;

  const getVisibleSlides = () => {
    const prevIndex = (activeIndex - 1 + totalSlides) % totalSlides;
    const nextIndex = (activeIndex + 1) % totalSlides;
    return [prevIndex, activeIndex, nextIndex];
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeIndex, totalSlides]);

  useEffect(() => {
    onSlideChange?.(slides[activeIndex]);
  }, [activeIndex, onSlideChange, slides]);

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.carousel}>
        <div className={styles.carouselTrack}>
            {slides.map((slide, index) => {
                const diff = (index - activeIndex + totalSlides) % totalSlides;
                const isPrev = diff === totalSlides - 1;
                const isNext = diff === 1;
                const isActive = diff === 0;

                let positionClass = '';
                if (isActive) {
                  positionClass = styles.active;
                  } else if (isPrev) {
                  positionClass = styles.prev;
                  } else if (isNext) {
                  positionClass = styles.next;
                }            
                return (
                  <div
                    key={slide.id}
                    className={`${styles.carouselSlide} ${positionClass}`}
                    style={{
                      zIndex: isActive ? 3 : isPrev || isNext ? 2 : 1,
                      display: !isActive && !isPrev && !isNext ? 'none' : 'block',
                    }}
                  >
                    <Image
                        src={slide.image}
                        alt={slide.title}
                        width={450}
                        height={300}
                        className={styles.carouselImage}
                        priority
                    />
                    <div className={styles.carouselCaption}>
                      <h3>{slide.title}</h3>
                    </div>
                  </div>
            );
          })}
        </div>
        <button
          className={`${styles.carouselControl} ${styles.prev}`}
          onClick={() => setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides)}
        >
          ‹
        </button>
        <button
          className={`${styles.carouselControl} ${styles.next}`}
          onClick={() => setActiveIndex((prev) => (prev + 1) % totalSlides)}
        >
          ›
        </button>
        <div className={styles.carouselIndicators}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.carouselIndicator} ${
                index === activeIndex ? styles.active : ''
              }`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}