'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CertificationsCarousel({ images = [], intervalMs = 2500 }) {
  const viewportRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);

  // Autoplay using native scroll + snap
  useEffect(() => {
    if (!viewportRef.current) return;
    let id;

    const tick = () => {
      const el = viewportRef.current;
      if (!el) return;

      const atEnd = Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth;
      if (atEnd) {
        // jump back to start without animation
        el.scrollTo({ left: 0, behavior: 'auto' });
      } else {
        el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
      }
    };

    if (!isHovering) {
      id = setInterval(tick, intervalMs);
    }
    return () => id && clearInterval(id);
  }, [isHovering, intervalMs]);

  const scrollPrev = () => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
  };

  const scrollNext = () => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

      {/* Viewport */}
      <div
        ref={viewportRef}
        className="overflow-x-auto scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' /* Firefox */ }}
      >
        <div className="flex gap-8 sm:gap-10 lg:gap-12 px-2 sm:px-4">
          {images.map((c, i) => (
            <div
              key={`${c.alt}-${i}`}
              className="snap-start shrink-0"
              style={{ width: '15rem', maxWidth: '60vw' }} // responsive tile width
            >
              <div className="relative h-28 sm:h-32 lg:h-36 w-full rounded-2xl bg-background border border-border shadow-sm p-5 sm:p-6">
                <Image
                  src={c.src}
                  alt={c.alt}
                  fill
                  className="object-contain"
                  sizes="(min-width:1024px) 240px, (min-width:640px) 208px, 176px"
                  priority={i < 6}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-between z-20">
        <button
          onClick={scrollPrev}
          aria-label="Previous"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/80 border border-border shadow hover:bg-background"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={scrollNext}
          aria-label="Next"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/80 border border-border shadow hover:bg-background"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <p className="sr-only">Carousel of certification logos. Use previous and next buttons or swipe/scroll. Autoplay pauses on hover.</p>
    </div>
  );
}
