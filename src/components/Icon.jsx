const paths = {
  warning: (
    <>
      <path d="M12 3 2 21h20L12 3Z" />
      <path d="M12 9v5m0 3h.01" />
    </>
  ),
  rotateLeft: <path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" />,
  rotateRight: <path d="M21 10a9 9 0 1 0-2 8M21 4v6h-6" />,
  flipX: <path d="M12 3v2m0 4v2m0 4v2m0 4v1M3 6l6 6-6 6V6Zm18 0-6 6 6 6V6Z" />,
  flipY: <path d="M3 12h2m4 0h2m4 0h2m4 0h1M6 3l6 6 6-6H6Zm0 18 6-6 6 6H6Z" />,
  hand: (
    <>
      <path
        d="M7 12V7a2 2 0 0 1 4 0v4-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v7-3a2 2 0 0 1 4 0v7c0 4-3 6-7 6h-3c-2 0-3-1-4-3l-5-6a2 2 0 0 1 3-3l3 3"
        transform="translate(-2 0) scale(.95)"
      />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-8h6v8" />
    </>
  ),
  panel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M9 4v16m5-11-3 3 3 3" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.4" />
      <rect x="14" y="3" width="7" height="7" rx="1.4" />
      <rect x="3" y="14" width="7" height="7" rx="1.4" />
      <rect x="14" y="14" width="7" height="7" rx="1.4" />
    </>
  ),
  chart: <path d="M4 4v16h17M8 15v-4m5 4V7m5 8v-6" />,
  math: <path d="M18 4H6l6 8-6 8h12" />,
  camera: (
    <>
      <path d="m3 8 12-3 3 9-12 3zM9 17l1 3h6m-3-4 1 4M17 8l4-1 1 5-4 1" />
      <path d="m7 10 5-1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  arrow: <path d="m5 3 14 11-7 1-3 7z" />,
  wall: <path d="M3 5h18v14H3zM3 12h18M9 5v7m7 0v7" />,
  save: <path d="M4 3h13l4 4v14H3V3zM7 3v6h10V3M7 21v-8h10v8" />,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6" />,
  upload: <path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5" />,
  trash: <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  down: <path d="m6 9 6 6 6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4m0 14v4M1 12h4m14 0h4" />
    </>
  ),
  layers: <path d="m12 3 10 6-10 6L2 9zM2 13l10 6 10-6M2 17l10 6 10-6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10h.01" />
    </>
  ),
  folder: <path d="M3 6V4h6l2 3h10v14H3z" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  reset: <path d="M4 9a8 8 0 1 1 1 9M4 3v6h6" />,
  expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5" />,
  book: <path d="M12 5v16M3 3l9 2 9-2v16l-9 2-9-2z" />,
  cross: <path d="M12 3v18M3 12h18m-3-3 3 3-3 3M9 6l3-3 3 3" />,
}
export default function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.grid}
    </svg>
  )
}
