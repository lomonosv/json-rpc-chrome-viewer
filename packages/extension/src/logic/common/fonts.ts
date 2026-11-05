import geistCyrillic from '@fontsource-variable/geist/files/geist-cyrillic-wght-normal.woff2';
import geistLatin from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2';
import geistLatinExt from '@fontsource-variable/geist/files/geist-latin-ext-wght-normal.woff2';
import geistMonoCyrillic from '@fontsource-variable/geist-mono/files/geist-mono-cyrillic-wght-normal.woff2';
import geistMonoLatin from '@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2';
import geistMonoLatinExt from '@fontsource-variable/geist-mono/files/geist-mono-latin-ext-wght-normal.woff2';

// Ranges from @fontsource-variable's wght.css.
const latin = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,'
  + 'U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const latinExt = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,'
  + 'U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
const cyrillic = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116';

const faces: [family: string, url: string, unicodeRange: string][] = [
  ['Geist', geistLatin, latin],
  ['Geist', geistLatinExt, latinExt],
  ['Geist', geistCyrillic, cyrillic],
  ['Geist Mono', geistMonoLatin, latin],
  ['Geist Mono', geistMonoLatinExt, latinExt],
  ['Geist Mono', geistMonoCyrillic, cyrillic]
];

/**
 * Registers the bundled Geist fonts. FontFace rather than @font-face: the sass
 * plugin injects styles at runtime and does not resolve url().
 */
export const registerFonts = () => {
  if (typeof FontFace === 'undefined') {
    return;
  }

  faces.forEach(([family, url, unicodeRange]) => {
    document.fonts.add(new FontFace(family, `url(${ url }) format('woff2')`, {
      weight: '100 900',
      display: 'swap',
      unicodeRange
    }));
  });
};
