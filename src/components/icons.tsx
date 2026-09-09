// סט אייקונים כ-SVG inline. אין ספריית אייקונים — שומרים על אפליקציה קלה.
// כל אייקון יורש currentColor וגודל 24 כברירת מחדל.

type P = { className?: string; size?: number };

function svg(path: React.ReactNode, size = 24, className?: string) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

export const IconPlus = ({ className, size }: P) =>
  svg(
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>,
    size,
    className,
  );

// חץ ימינה — "חזרה" בממשק RTL.
export const IconArrowRight = ({ className, size }: P) =>
  svg(
    <>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </>,
    size,
    className,
  );

export const IconChevronUp = ({ className, size }: P) =>
  svg(<polyline points="18 15 12 9 6 15" />, size, className);

export const IconChevronDown = ({ className, size }: P) =>
  svg(<polyline points="6 9 12 15 18 9" />, size, className);

export const IconSearch = ({ className, size }: P) =>
  svg(
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>,
    size,
    className,
  );

export const IconTag = ({ className, size }: P) =>
  svg(
    <>
      <path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L3 13V3h10l7.59 7.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />
    </>,
    size,
    className,
  );

export const IconPin = ({ className, size }: P) =>
  svg(
    <>
      <path d="M12 17v5" />
      <path d="M9 3h6l-1 7 3 3H7l3-3-1-7z" />
    </>,
    size,
    className,
  );

export const IconLayers = ({ className, size }: P) =>
  svg(
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>,
    size,
    className,
  );

export const IconX = ({ className, size }: P) =>
  svg(
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>,
    size,
    className,
  );

export const IconDots = ({ className, size }: P) =>
  svg(
    <>
      <circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </>,
    size,
    className,
  );

export const IconSettings = ({ className, size }: P) =>
  svg(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>,
    size,
    className,
  );

export const IconDice = ({ className, size }: P) =>
  svg(
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.3" fill="currentColor" stroke="none" />
    </>,
    size,
    className,
  );

export const IconCheck = ({ className, size }: P) =>
  svg(<polyline points="20 6 9 17 4 12" />, size, className);

export const IconClock = ({ className, size }: P) =>
  svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </>,
    size,
    className,
  );

export const IconCloud = ({ className, size }: P) =>
  svg(
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />,
    size,
    className,
  );

export const IconDownload = ({ className, size }: P) =>
  svg(
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>,
    size,
    className,
  );

export const IconMic = ({ className, size }: P) =>
  svg(
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </>,
    size,
    className,
  );

export const IconPlay = ({ className, size }: P) =>
  svg(<polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" />, size, className);

export const IconStop = ({ className, size }: P) =>
  svg(<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />, size, className);

export const IconPause = ({ className, size }: P) =>
  svg(
    <>
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
    </>,
    size,
    className,
  );

export const IconTrash = ({ className, size }: P) =>
  svg(
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </>,
    size,
    className,
  );

export const IconGrip = ({ className, size }: P) =>
  svg(
    <>
      <circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none" />
    </>,
    size,
    className,
  );
