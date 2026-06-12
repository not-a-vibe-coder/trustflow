import type { ReactNode } from "react";

/**
 * Glass "jelly" surface primitives. The frosted look only reads when it sits
 * over a tinted backdrop — wrap pages/sections in <AppCanvas> (or any element
 * with the `app-canvas` class) so the teal blobs show through the blur.
 */

type Variant = "light" | "dark";

export function GlassCard({
  children,
  className = "",
  variant = "light",
  hover = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  hover?: boolean;
  style?: React.CSSProperties;
}) {
  const base = variant === "dark" ? "glass-dark text-white" : "glass-card text-gray-900";
  return (
    <div className={`${base} ${hover ? "glass-card-hover" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}

/** Same surface, no rounded-card defaults baked in — for bespoke layouts. */
export function GlassPanel({
  children,
  className = "",
  variant = "light",
  style,
}: {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  style?: React.CSSProperties;
}) {
  const base = variant === "dark" ? "glass-dark" : "glass-card";
  return (
    <div className={`${base} ${className}`} style={style}>
      {children}
    </div>
  );
}

/** Full-bleed tinted canvas with drifting teal blobs behind the content. */
export function AppCanvas({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`app-canvas min-h-screen ${className}`}>{children}</div>;
}
