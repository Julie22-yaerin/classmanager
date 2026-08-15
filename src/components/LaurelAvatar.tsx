import { useId } from "react";

export default function LaurelAvatar({ size = 32, className = "" }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const bgGrad = `bgGrad-${uid}`;
  const leafGrad = `leafGrad-${uid}`;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={bgGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1c1c1e" />
          <stop offset="100%" stopColor="#050506" />
        </linearGradient>
        <linearGradient id={leafGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f3cf6b" />
          <stop offset="100%" stopColor="#c8942f" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill={`url(#${bgGrad})`} />
      <g>
        <path d="M 29.09 54.07 Q 25.63 54.88 23.43 58.74 Q 27.63 57.32 29.09 54.07 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 25.09 53.01 Q 21.24 53.10 18.06 56.69 Q 22.83 56.12 25.09 53.01 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 21.41 51.16 Q 17.33 50.40 13.17 53.48 Q 18.33 53.94 21.41 51.16 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 18.18 48.61 Q 14.07 46.91 9.04 49.22 Q 14.34 50.84 18.18 48.61 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 15.55 45.46 Q 11.63 42.79 5.87 44.10 Q 11.05 46.95 15.55 45.46 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 13.62 41.86 Q 10.13 38.22 3.85 38.33 Q 8.61 42.42 13.62 41.86 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 12.46 37.95 Q 9.64 33.42 3.11 32.16 Q 7.16 37.44 12.46 37.95 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 12.13 33.90 Q 10.19 28.61 3.72 25.89 Q 6.75 32.22 12.13 33.90 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 12.62 29.88 Q 11.77 24.01 5.70 19.81 Q 7.45 26.99 12.62 29.88 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 34.91 54.07 Q 36.37 57.32 40.57 58.74 Q 38.37 54.88 34.91 54.07 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 38.91 53.01 Q 41.17 56.12 45.94 56.69 Q 42.76 53.10 38.91 53.01 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 42.59 51.16 Q 45.67 53.94 50.83 53.48 Q 46.67 50.40 42.59 51.16 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 45.82 48.61 Q 49.66 50.84 54.96 49.22 Q 49.93 46.91 45.82 48.61 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 48.45 45.46 Q 52.95 46.95 58.13 44.10 Q 52.37 42.79 48.45 45.46 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 50.38 41.86 Q 55.39 42.42 60.15 38.33 Q 53.87 38.22 50.38 41.86 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 51.54 37.95 Q 56.84 37.44 60.89 32.16 Q 54.36 33.42 51.54 37.95 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 51.87 33.90 Q 57.25 32.22 60.28 25.89 Q 53.81 28.61 51.87 33.90 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
        <path d="M 51.38 29.88 Q 56.55 26.99 58.30 19.81 Q 52.23 24.01 51.38 29.88 Z" fill={`url(#${leafGrad})`} stroke="#7a5a12" strokeWidth="0.4" />
      </g>
      <circle cx="32" cy="55" r="1.6" fill="#c8942f" />
    </svg>
  );
}
