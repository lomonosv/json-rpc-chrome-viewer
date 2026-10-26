import type { SVGProps } from 'react';

const paths = {
  capture: 'M3 12h4l3-8 4 16 3-8h4',
  layers: 'M12 3 2 8l10 5 10-5-10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5',
  timer: 'M10 2h4M12 14l3-3M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
  search: 'm21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z',
  mask: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-3 7h.01M15 10h.01M8.5 15a4 4 0 0 0 7 0',
  server: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01',
  replay: 'M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  palette: [
    'M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-1.5a2 2 0 0 0-1.4 3.4A2 2 0 0 1 12 22Z',
    'M7.5 11h.01M10 7h.01M15 7h.01'
  ].join(''),
  socket: 'M5 12h3m8 0h3M8 8v8m8-8v8M8 12a4 4 0 0 1 8 0',
  github: [
    'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.3 6.4-1.5 6.4-7',
    'A5.4 5.4 0 0 0 20 4.8 5 5 0 0 0 19.9 1S18.7.6 16 2.5a13.4 13.4 0 0 0-7 0',
    'C6.3.6 5.1 1 5.1 1A5 5 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.7c0 5.4 3.3 6.6 6.4 7',
    'A3.4 3.4 0 0 0 9 18.1V22'
  ].join(''),
  chrome: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-6a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9.2-8',
    'H12M3.9 6.1 8.5 14m3.9 7.9L16.9 14'
  ].join(''),
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  check: 'm5 12 5 5L20 7'
} as const;

export type IconName = keyof typeof paths;

interface IIconProps extends SVGProps<SVGSVGElement> {
  name: IconName,
  size?: number,
}

export default function Icon({ name, size = 20, ...props }: IIconProps) {
  return (
    <svg
      width={ size }
      height={ size }
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={ 1.7 }
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      { ...props }
    >
      <path d={ paths[name] } />
    </svg>
  );
}
