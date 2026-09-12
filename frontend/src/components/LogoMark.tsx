interface LogoMarkProps {
  className?: string
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg className={className} viewBox="0 0 400 400" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logo-mark-gleam" x1="60" y1="40" x2="360" y2="380" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2f3336" />
          <stop offset="0.6" stopColor="#2f3336" />
          <stop offset="0.72" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.8" stopColor="#2f3336" />
          <stop offset="1" stopColor="#2f3336" />
        </linearGradient>
      </defs>
      <g stroke="url(#logo-mark-gleam)" strokeWidth="2" vectorEffect="non-scaling-stroke">
        <circle cx="200" cy="200" r="190" vectorEffect="non-scaling-stroke" />
        <circle cx="200" cy="200" r="126" vectorEffect="non-scaling-stroke" />
        <circle cx="200" cy="200" r="46" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  )
}
