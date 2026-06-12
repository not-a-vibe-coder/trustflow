import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/** Fires once when `ref` scrolls into view. Honors prefers-reduced-motion. */
export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px", ...options },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);

  return { ref, inView };
}

type Variant = "up" | "scale" | "fade";

/**
 * Wraps children in a reveal-on-scroll animation. `delay` (ms) staggers items;
 * `as` lets callers keep semantic tags. No-ops under reduced motion.
 */
export function Reveal({
  children,
  variant = "up",
  delay = 0,
  className = "",
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  className?: string;
  as?: React.ElementType;
  style?: React.CSSProperties;
}) {
  const { ref, inView } = useInView<HTMLElement>();
  const variantClass = variant === "scale" ? "reveal-scale" : variant === "up" ? "reveal-up" : "";
  return (
    <Tag
      ref={ref}
      className={`reveal ${variantClass} ${inView ? "reveal-in" : ""} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms", ...style }}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
