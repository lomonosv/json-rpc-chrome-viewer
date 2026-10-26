import Script from 'next/script';

const gaIdPattern = /^G-[A-Z0-9]+$/;

// Google Analytics (gtag.js), the same setup as the user's other Next sites.
// The id comes from the NEXT_PUBLIC_GA_ID build arg; unset - local dev, CI -
// loads nothing. The format check keeps an odd value out of the inline script.
export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!gaId) {
    return null;
  }

  if (!gaIdPattern.test(gaId)) {
    // Runs at build time, so a mistyped Dokploy build arg shows in the build log.
    // eslint-disable-next-line no-console
    console.warn(`NEXT_PUBLIC_GA_ID has an unexpected format: "${ gaId }" - analytics disabled.`);

    return null;
  }

  return (
    <>
      <Script src={ `https://www.googletagmanager.com/gtag/js?id=${ gaId }` } strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        { `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ gaId }');` }
      </Script>
    </>
  );
}
