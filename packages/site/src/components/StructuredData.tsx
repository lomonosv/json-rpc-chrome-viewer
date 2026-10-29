import { faq } from '~/lib/faq';
import { chromeWebStoreUrl, githubUrl, siteUrl } from '~/lib/links';

const data = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'JSON-RPC Chrome Viewer',
    description: 'Chrome DevTools extension to inspect, debug and mock JSON-RPC 2.0 calls over HTTP and WebSocket.',
    url: `${ siteUrl }/`,
    image: `${ siteUrl }/og.png`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Chrome',
    downloadUrl: chromeWebStoreUrl,
    installUrl: chromeWebStoreUrl,
    license: 'https://opensource.org/licenses/MIT',
    sameAs: [githubUrl, chromeWebStoreUrl],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  }
];

export default function StructuredData() {
  return (
    <script
      type="application/ld+json"
      // Static, build-time data with no user input.
      dangerouslySetInnerHTML={ { __html: JSON.stringify(data) } }
    />
  );
}
