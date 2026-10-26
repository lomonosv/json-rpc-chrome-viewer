import PageBackground from '~/components/PageBackground';
import Features from '~/components/sections/Features';
import FinalCta from '~/components/sections/FinalCta';
import Hero from '~/components/sections/Hero';
import Interceptor from '~/components/sections/Interceptor';
import Nav from '~/components/sections/Nav';
import Problem from '~/components/sections/Problem';
import ServerCapture from '~/components/sections/ServerCapture';
import Trust from '~/components/sections/Trust';

export default function Home() {
  return (
    <>
      <PageBackground />
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Features />
        <Interceptor />
        <ServerCapture />
        <Trust />
      </main>
      <FinalCta />
    </>
  );
}
