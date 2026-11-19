import type { ReactNode } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

type Stroke = { stroke: string; strokeWidth: number; strokeLinecap: 'round'; strokeLinejoin: 'round'; fill: 'none' };

/** Each icon on a 24×24 grid, drawn with the shared 2px rounded stroke. */
const SHAPES = {
  // Tabs, and the More button on Today
  today: (s: Stroke) => (
    <>
      <Circle cx={12} cy={13.5} r={7.5} {...s} />
      <Path d="M12 13.5V9.5M10 2.5h4M12 2.5V6" {...s} />
    </>
  ),
  sos: (s: Stroke) => (
    // Lifebuoy
    <>
      <Circle cx={12} cy={12} r={8.5} {...s} />
      <Circle cx={12} cy={12} r={3.5} {...s} />
      <Path d="M6 6l3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5" {...s} />
    </>
  ),
  community: (s: Stroke) => (
    <>
      <Circle cx={9} cy={8} r={3.2} {...s} />
      <Path d="M3 19.5c0-3.3 2.7-5.8 6-5.8s6 2.5 6 5.8" {...s} />
      <Circle cx={16.8} cy={9} r={2.5} {...s} />
      <Path d="M16.2 13.8c2.7.2 4.8 2.4 4.8 5.2" {...s} />
    </>
  ),
  progress: (s: Stroke) => <Path d="M5 19.5v-5M12 19.5v-9M19 19.5V5" {...s} strokeWidth={2.6} />,
  learn: (s: Stroke) => <Path d="M12 6.5C10 5 7 4.6 3.5 5v13c3.5-.4 6.5 0 8.5 1.5 2-1.5 5-1.9 8.5-1.5V5C17 4.6 14 5 12 6.5zM12 6.5v13" {...s} />,
  more: (s: Stroke) => <Path d="M4 6.5h16M4 12h16M4 17.5h16" {...s} />,

  // Icon-only controls
  bell: (s: Stroke) => <Path d="M6 16.5v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" {...s} />,
  // Points in the reading direction; callers mirror it for right-to-left.
  send: (s: Stroke) => <Path d="M4.5 12h14M13 6l6 6-6 6" {...s} />,
  restart: (s: Stroke) => <Path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4h-4" {...s} />,
  play: (s: Stroke) => <Path d="M8 5.5v13l10.5-6.5z" {...s} fill={s.stroke} strokeWidth={1.5} />,

  // Menus, tools and topics
  settings: (s: Stroke) => (
    // Sliders
    <>
      <Path d="M4 7h9M17 7h3M4 17h3M11 17h9" {...s} />
      <Circle cx={15} cy={7} r={2} {...s} />
      <Circle cx={9} cy={17} r={2} {...s} />
    </>
  ),
  phone: (s: Stroke) => <Path d="M6.5 3.5H9l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5v2.5a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" {...s} />,
  target: (s: Stroke) => (
    <>
      <Circle cx={12} cy={12} r={8.5} {...s} />
      <Circle cx={12} cy={12} r={4.5} {...s} />
      <Circle cx={12} cy={12} r={1} {...s} fill={s.stroke} />
    </>
  ),
  image: (s: Stroke) => (
    <>
      <Rect x={3.5} y={5} width={17} height={14} rx={2} {...s} />
      <Circle cx={9} cy={10} r={1.6} {...s} />
      <Path d="M20.5 16l-5-5-8.5 8" {...s} />
    </>
  ),
  chat: (s: Stroke) => <Path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5h-8.5L6 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6.5A1.5 1.5 0 0 1 5 5z" {...s} />,
  medical: (s: Stroke) => (
    <>
      <Rect x={3.5} y={3.5} width={17} height={17} rx={4} {...s} />
      <Path d="M12 8v8M8 12h8" {...s} />
    </>
  ),
  eye: (s: Stroke) => (
    <>
      <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" {...s} />
      <Circle cx={12} cy={12} r={3} {...s} />
    </>
  ),
  sunrise: (s: Stroke) => <Path d="M3 17.5h18M6.5 17.5a5.5 5.5 0 0 1 11 0M12 4v4M4.6 9.6l2 2M19.4 9.6l-2 2M8 21h8" {...s} />,
  wind: (s: Stroke) => <Path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7" {...s} />,
  bubbles: (s: Stroke) => (
    <>
      <Circle cx={9} cy={14} r={5} {...s} />
      <Circle cx={17} cy={6.5} r={3} {...s} />
      <Circle cx={18} cy={17} r={2} {...s} />
    </>
  ),
  cards: (s: Stroke) => (
    // Memory game: two overlapping cards
    <>
      <Rect x={4} y={7} width={11} height={14} rx={2} {...s} />
      <Path d="M9 3.5h9a2 2 0 0 1 2 2v12" {...s} />
    </>
  ),
  wave: (s: Stroke) => <Path d="M2.5 14c2.4 0 2.4-2 4.75-2s2.35 2 4.75 2 2.4-2 4.75-2 2.35 2 4.75 2M2.5 19c2.4 0 2.4-2 4.75-2s2.35 2 4.75 2 2.4-2 4.75-2 2.35 2 4.75 2M8 9.5C8 6.5 10.5 4 14 4c2.5 0 4 1.5 4 3.5-2-1-4.5 0-4.5 2" {...s} />,
  water: (s: Stroke) => <Path d="M12 3.5c3.5 4.2 6 7.5 6 10.5a6 6 0 0 1-12 0c0-3 2.5-6.3 6-10.5z" {...s} />,
  note: (s: Stroke) => <Path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4" {...s} />,
  bookmark: (s: Stroke) => <Path d="M7 3.5h10a1 1 0 0 1 1 1v16l-6-4-6 4v-16a1 1 0 0 1 1-1z" {...s} />,
  shield: (s: Stroke) => <Path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z" {...s} />,
  cigarette: (s: Stroke) => (
    <>
      <Rect x={2.5} y={13} width={19} height={4} rx={1} {...s} />
      <Path d="M16.5 13v4M18 10c0-1.5 1.5-1.5 1.5-3S18 5.5 18 4" {...s} />
    </>
  ),
  lungs: (s: Stroke) => (
    // Windpipe and two lobes
    <Path d="M12 3v7M12 10c-.8 1.4-1.8 2.1-3 2.6M12 10c.8 1.4 1.8 2.1 3 2.6M8.5 6.5C5 7.5 2.8 11.5 2.8 16.5c0 2.2 1.2 3.7 3.3 3.7 2.6 0 3.9-1.6 3.9-4.3V8.2c0-1.1-.6-1.9-1.5-1.7zM15.5 6.5c3.5 1 5.7 5 5.7 10 0 2.2-1.2 3.7-3.3 3.7-2.6 0-3.9-1.6-3.9-4.3V8.2c0-1.1.6-1.9 1.5-1.7z" {...s} />
  ),
  rolled: (s: Stroke) => (
    // Hand-rolled cigarette: a tilted cigarette with a twisted paper end
    <G transform="rotate(-35 12 12)">
      <Rect x={3} y={10} width={15} height={4} rx={1} {...s} />
      <Path d="M18 10l3 2-3 2M7 10v4" {...s} />
    </G>
  ),
  cigar: (s: Stroke) => (
    // Thick, rounded, with a band
    <>
      <Rect x={2.5} y={11} width={17} height={6} rx={3} {...s} />
      <Path d="M12 11v6M14.5 11v6M20 8c0-1.3 1.3-1.3 1.3-2.6" {...s} />
    </>
  ),
  vape: (s: Stroke) => (
    // Vape pen with mouthpiece and button
    <>
      <Rect x={7} y={9} width={7} height={12} rx={2} {...s} />
      <Path d="M9 9V5.5h3V9M17 6.5c0-1.2 1.3-1.2 1.3-2.4M20 9c0-1.2 1.3-1.2 1.3-2.4" {...s} />
      <Circle cx={10.5} cy={16} r={1} {...s} />
    </>
  ),
  tin: (s: Stroke) => (
    // Round snus / snuff tin
    <Path d="M4.5 9.5c0-1.9 3.4-3.5 7.5-3.5s7.5 1.6 7.5 3.5v5c0 1.9-3.4 3.5-7.5 3.5s-7.5-1.6-7.5-3.5zM4.5 9.5c0 1.9 3.4 3.5 7.5 3.5s7.5-1.6 7.5-3.5" {...s} />
  ),
  heart: (s: Stroke) => <Path d="M12 20.5S3.5 15.5 3.5 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8.5 2.5c0 6-8.5 11-8.5 11z" {...s} />,
  bolt: (s: Stroke) => <Path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" {...s} />,
  cloud: (s: Stroke) => <Path d="M7 15.5a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.5 1.5 3.3 3.3 0 0 1-.5 6.5zM8.5 19l-1 2M12.5 19l-1 2M16.5 19l-1 2" {...s} />,
  repeat: (s: Stroke) => <Path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19M16 3l3 3-3 3M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5M8 21l-3-3 3-3" {...s} />,
  moon: (s: Stroke) => <Path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" {...s} />,
  leaf: (s: Stroke) => <Path d="M5 19C5 10 10 5 19.5 4.5 19 14 14 19 5 19zM5 19l7.5-7.5" {...s} />,
  flame: (s: Stroke) => <Path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-1.5-2-1.5-3C7.5 10 6 12.5 6 15a6 6 0 0 0 6 6z" {...s} />,
  // Craving SOS activities
  walk: (s: Stroke) => (
    <>
      <Circle cx={13.5} cy={4.5} r={1.8} {...s} />
      <Path d="M10 21l2.5-6 2.5 2.5V21M12.5 15l-1-5.5 3.5 2.5 3 1M11.5 9.5L8 11l-1.5 3.5" {...s} />
    </>
  ),
  fist: (s: Stroke) => (
    <Path d="M7.5 11.5V8.5a1.5 1.5 0 0 1 3 0v2M10.5 10.5V7.5a1.5 1.5 0 0 1 3 0v3M13.5 10.5V8.5a1.5 1.5 0 0 1 3 0V13M7.5 11.5a1.5 1.5 0 0 0-3 0v1.5c0 4 3 7 7 7h1c3 0 5-2.5 5-5.5V12" {...s} />
  ),
  blocks: (s: Stroke) => <Path d="M4 13.5h5v5H4zM9 13.5h5v5H9zM9 8.5h5v5H9zM15 4.5h5v5h-5z" {...s} />,
  left: (s: Stroke) => <Path d="M14.5 6l-6 6 6 6" {...s} />,
  right: (s: Stroke) => <Path d="M9.5 6l6 6-6 6" {...s} />,
  down: (s: Stroke) => <Path d="M12 4.5v14M6.5 13l5.5 5.5 5.5-5.5" {...s} />,
} satisfies Record<string, (s: Stroke) => ReactNode>;

export type IconName = keyof typeof SHAPES;

/**
 * The app's one icon family: small monochrome outlines (2px stroke, 24px grid) in a theme colour,
 * matching the native tab bars (SF Symbols on iOS, Material on Android). Drawn with
 * react-native-svg: no icon font to download, and identical on every platform, unlike emoji or
 * text symbols. Used for the web tab bar, list rows, the tour, and icon-only controls.
 *
 * Always decorative: the control or row around it carries the accessible name.
 */
export function Icon({ name, color, size = 24 }: { name: IconName; color: string; size?: number }) {
  const stroke: Stroke = { stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {SHAPES[name](stroke)}
    </Svg>
  );
}
