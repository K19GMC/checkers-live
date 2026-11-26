'use client';
import { useEffect } from 'react';

// One entrance per page: every [data-enter] element settles in once on load.
// GSAP is imported lazily so it never runs on the server and only loads in the browser.
export function useEntrance(ref) {
  useEffect(() => {
    const root = ref?.current;
    if (!root) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let cancelled = false;
    let ctx;
    (async () => {
      try {
        const { gsap } = await import('gsap');
        if (cancelled) return;
        const items = root.querySelectorAll('[data-enter]');
        if (!items.length) return;
        ctx = gsap.context(() => {
          gsap.from(items, {
            y: 16,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.08,
            clearProps: 'opacity,transform',
          });
        }, root);
      } catch {
        // Motion is an enhancement; the page is complete without it.
      }
    })();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [ref]);
}