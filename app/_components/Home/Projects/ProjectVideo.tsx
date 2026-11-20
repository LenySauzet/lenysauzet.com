'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

const IN_VIEW = 0.25;

interface ProjectVideoProps {
  src: string;
  onPlaying: () => void;
  className?: string;
}

export function ProjectVideo({ src, onPlaying, className }: ProjectVideoProps) {
  const video = useRef<HTMLVideoElement>(null);
  const still = useReducedMotion();

  useEffect(() => {
    const element = video.current;
    if (!element || still) return;

    const watched = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? element.play().catch(() => {}) : element.pause()),
      { threshold: IN_VIEW }
    );
    watched.observe(element);

    return () => watched.disconnect();
  }, [still]);

  return (
    <video
      ref={video}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      onPlaying={onPlaying}
      className={className}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
