import Image from 'next/image';
import Icon from '~/components/ui/Icon';
import { chromeWebStoreUrl, githubUrl, newTabProps } from '~/lib/links';
import styles from './nav.module.css';

const links = [
  { href: '#features', label: 'Features' },
  { href: '#start', label: 'Get started' },
  { href: '#faq', label: 'FAQ' }
];

export default function Nav() {
  return (
    <header className={ styles.nav }>
      <div className={ `container ${ styles.inner }` }>
        <a href="#top" className={ styles.brand }>
          <Image src="/icon.png" alt="" width={ 26 } height={ 26 } className={ styles.logo } />
          <span>JSON-RPC <span className={ styles.brandDim }>Chrome Viewer</span></span>
        </a>
        <nav className={ styles.links } aria-label="Sections">
          { links.map((link) => <a key={ link.href } href={ link.href }>{ link.label }</a>) }
        </nav>
        <div className={ styles.actions }>
          <a href={ githubUrl } className={ styles.iconLink } aria-label="GitHub repository">
            <Icon name="github" size={ 19 } />
          </a>
          <a href={ chromeWebStoreUrl } { ...newTabProps } className={ styles.install }>Add to Chrome</a>
        </div>
      </div>
    </header>
  );
}
