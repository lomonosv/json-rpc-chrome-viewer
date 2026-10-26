'use client';

import LightRays from '~/components/reactbits/LightRays/LightRays';
import styles from './pageBackground.module.css';

// One fixed WebGL layer behind the whole page rather than a background per
// section: a single canvas is one GPU context instead of several. Soft white
// rays from the top of the viewport, deliberately monochrome - the page's
// colour comes from the headline and the panel, not the backdrop.
export default function PageBackground() {
  return (
    <div className={ styles.background } aria-hidden="true">
      <LightRays
        raysOrigin="top-center"
        raysColor="#e2e8f5"
        raysSpeed={ 0.6 }
        lightSpread={ 0.8 }
        rayLength={ 2.2 }
        intensity={ 1 }
        glow={ 0.6 }
        haze={ 0.25 }
        clickPulse={ false }
      />
    </div>
  );
}
