interface IconProps {
  size?: number;
  className?: string;
}

const base = (p: IconProps) => ({
  width: p.size ?? 18,
  height: p.size ?? 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: p.className,
});

export const IconSheet = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
    <path d="M3.5 9.5h17M9.5 9.5V20.5M3.5 15h17" />
  </svg>
);

export const IconServer = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4" width="17" height="6.5" rx="1.5" />
    <rect x="3.5" y="13.5" width="17" height="6.5" rx="1.5" />
    <path d="M7 7.2h.01M7 16.7h.01M10.5 7.2h3M10.5 16.7h3" />
  </svg>
);

export const IconSpark = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    <path d="M19 15.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4z" strokeWidth={1.4} />
  </svg>
);

export const IconDownload = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4v10m0 0l-4-4m4 4l4-4" />
    <path d="M4.5 16.5v2A1.5 1.5 0 006 20h12a1.5 1.5 0 001.5-1.5v-2" />
  </svg>
);

export const IconCopy = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M5.5 15.5h-1a1 1 0 01-1-1v-9a1 1 0 011-1h9a1 1 0 011 1v1" />
  </svg>
);

export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const IconFile = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 3.5h8l4 4V20a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 016 20V3.5z" />
    <path d="M14 3.5V8h4.5" />
  </svg>
);

export const IconFolder = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 6.5A1.5 1.5 0 015 5h4l2 2.5h8A1.5 1.5 0 0120.5 9v9A1.5 1.5 0 0119 19.5H5A1.5 1.5 0 013.5 18V6.5z" />
  </svg>
);

export const IconTerminal = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="M7 9.5l3 2.7-3 2.7M12.5 15.5h4.5" />
  </svg>
);

export const IconKey = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="8" cy="14.5" r="4" />
    <path d="M11 11.5L20 3m-3.5 3.5L19 9m-5-1l2 2" />
  </svg>
);

export const IconPlay = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7.5 5.5v13l10-6.5-10-6.5z" />
  </svg>
);

export const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 12h16m0 0l-5-5m5 5l-5 5" />
  </svg>
);

export const IconZip = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 3.5h8l4 4V20a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 016 20V3.5z" />
    <path d="M14 3.5V8h4.5M9.5 12h5M9.5 15.5h5" />
  </svg>
);

export const IconReset = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 8A8.5 8.5 0 1112 20.5" />
    <path d="M4.5 3.5V8H9" />
  </svg>
);

export const IconGauge = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 17a8.5 8.5 0 1116 0" />
    <path d="M12 17l3.5-5.5" />
    <path d="M3.5 17h17" />
  </svg>
);

export const IconBraces = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8.5 4.5C7 4.5 6.5 5.5 6.5 7v2.5c0 1.2-.8 2-2 2.5 1.2.5 2 1.3 2 2.5V17c0 1.5.5 2.5 2 2.5" />
    <path d="M15.5 4.5c1.5 0 2 1 2 2.5V9.5c0 1.2.8 2 2 2.5-1.2.5-2 1.3-2 2.5V17c0 1.5-.5 2.5-2 2.5" />
  </svg>
);

export const IconWarn = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4L2.8 19.5h18.4L12 4z" />
    <path d="M12 10v4m0 2.6h.01" />
  </svg>
);
