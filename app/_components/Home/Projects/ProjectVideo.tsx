'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

interface ProjectVideoProps {
  src: string;
  poster: string;
  className?: string;
}

export function ProjectVideo({ src, poster, className }: ProjectVideoProps) {
  const video = useRef<HTMLVideoElement>(null);
  const still = useReducedMotion();

  useEffect(() => {
    const element = video.current;
    if (!element || still) return;

    const watched = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? element.play().catch(() => {}) : element.pause()),
      { threshold: 0.25 }
    );
    watched.observe(element);

    return () => watched.disconnect();
  }, [still]);

  return (
    <video ref={video} muted loop playsInline preload="none" poster={poster} aria-hidden className={className}>
      <source src={src} type="video/mp4" />
    </video>
  );
}
