import { useId } from "react";

/**
 * Google Gemini mark — the four-point concave "spark" star in the brand
 * gradient (blue → purple → magenta). Used wherever the UI is branded
 * "Gemini" / "Powered by Google Gemini".
 */
export function GeminiLogo({
  size = 18,
  className = "",
  title = "Google Gemini",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4285F4" />
          <stop offset="0.45" stopColor="#9B72CB" />
          <stop offset="1" stopColor="#D96570" />
        </linearGradient>
      </defs>
      <path
        d="M12 0C12 6 6 12 0 12C6 12 12 18 12 24C12 18 18 12 24 12C18 12 12 6 12 0Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}

export default GeminiLogo;
