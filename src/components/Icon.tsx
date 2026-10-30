export type IconName =
  | 'shuttle'
  | 'upload'
  | 'file'
  | 'sparkle'
  | 'shuffle'
  | 'undo'
  | 'trash'
  | 'edit'
  | 'grip'
  | 'arrow-left'
  | 'arrow-right'
  | 'check'
  | 'close'
  | 'image'
  | 'download'
  | 'share'
  | 'calendar'
  | 'pin'
  | 'users'
  | 'plus'
  | 'move'
  | 'alert'
  | 'settings'
  | 'refresh'
  | 'copy';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 22,
  className,
  strokeWidth = 1.8,
}: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
    focusable: false,
  };

  switch (name) {
    case 'shuttle':
      return (
        <svg {...common}>
          <path d="M12 9.5 8.5 3.5M14 8.7l.7-5.2M16.2 10l4.3-3" />
          <path d="M12.2 9.2c3.1-.4 5.8 1.4 6.2 4.2.4 2.7-1.7 5.1-4.6 5.3-2.8.2-5.3-1.9-5.5-4.7-.1-2 1.2-3.9 3-4.6" />
        </svg>
      );
    case 'upload':
      return (
        <svg {...common}>
          <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
          <path d="M4 15.5v2.2A2.3 2.3 0 0 0 6.3 20h11.4a2.3 2.3 0 0 0 2.3-2.3v-2.2" />
        </svg>
      );
    case 'file':
      return (
        <svg {...common}>
          <path d="M6 3.5h7l5 5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
          <path d="M13 3.5V9h5M8.5 13h7M8.5 16.5h5" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg {...common}>
          <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z" />
          <path d="m18.5 16 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" />
        </svg>
      );
    case 'shuffle':
      return (
        <svg {...common}>
          <path d="M4 7h3.5c4.5 0 5 10 9.5 10H20" />
          <path d="m17 14 3 3-3 3M4 17h3.5c1.5 0 2.6-1.1 3.7-2.5M13.7 9.2C14.6 7.8 15.5 7 17 7h3" />
          <path d="m17 4 3 3-3 3" />
        </svg>
      );
    case 'undo':
      return (
        <svg {...common}>
          <path d="M8.5 7 4 11.5 8.5 16" />
          <path d="M4 11.5h9.2a5.3 5.3 0 0 1 0 10.6H11" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...common}>
          <path d="M4.5 7h15M9.5 3.8h5M7 7l.8 13h8.4L17 7" />
          <path d="M10 11v5.5M14 11v5.5" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...common}>
          <path d="m14.5 5.5 4 4M5 19l1-4.5L16.5 4a1.4 1.4 0 0 1 2 0l1.5 1.5a1.4 1.4 0 0 1 0 2L9.5 18 5 19Z" />
        </svg>
      );
    case 'grip':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <circle cx="9" cy="7" r="1.4" />
          <circle cx="15" cy="7" r="1.4" />
          <circle cx="9" cy="12" r="1.4" />
          <circle cx="15" cy="12" r="1.4" />
          <circle cx="9" cy="17" r="1.4" />
          <circle cx="15" cy="17" r="1.4" />
        </svg>
      );
    case 'arrow-left':
      return (
        <svg {...common}>
          <path d="m14.5 5-7 7 7 7" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...common}>
          <path d="m9.5 5 7 7-7 7" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="m4.5 12.5 5 5 10-11" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="m5.5 5.5 13 13M18.5 5.5l-13 13" />
        </svg>
      );
    case 'image':
      return (
        <svg {...common}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
          <circle cx="9" cy="9.5" r="1.6" />
          <path d="m5 17 4.5-4.5 3 3 3-2.5 3.5 4" />
        </svg>
      );
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5" />
          <path d="M5 18.5h14" />
        </svg>
      );
    case 'share':
      return (
        <svg {...common}>
          <circle cx="18" cy="5.5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="18.5" r="2.5" />
          <path d="m8.3 10.8 7.4-4M8.3 13.2l7.4 4" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
          <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21Z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="8.5" r="3" />
          <path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5" />
          <path d="M16 5.8a3 3 0 0 1 0 5.4M17.2 14.4c1.8.6 3 2.2 3.3 4.6" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'move':
      return (
        <svg {...common}>
          <path d="M12 3.5v17M3.5 12h17M12 3.5 9.5 6M12 3.5 14.5 6M12 20.5 9.5 18M12 20.5l2.5-2.5M3.5 12 6 9.5M3.5 12 6 14.5M20.5 12 18 9.5M20.5 12 18 14.5" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5v5.5M12 16.5h.01" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="8" cy="17" r="2" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M19.5 9A8 8 0 1 0 20 14" />
          <path d="M19.5 4v5h-5" />
        </svg>
      );
    case 'copy':
      return (
        <svg {...common}>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
        </svg>
      );
    default:
      return null;
  }
}
