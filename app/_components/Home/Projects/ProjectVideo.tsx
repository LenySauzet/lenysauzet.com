'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface ProjectVideoProps {
  src: string;
  className?: string;
}

export function ProjectVideo({ src, className }: ProjectVideoProps) {
  const video = useRef<HTMLVideoElement>(null);
  const still = useReducedMotion();
  const [playing, setPlaying] = useState(false);

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
    <video
      ref={video}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      onPlaying={() => setPlaying(true)}
      className={cn(className, !playing && 'scale-[1.03] opacity-0 blur-lg')}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
