import PageBackground from '~/components/PageBackground';
import Features from '~/components/sections/Features';
import Footer from '~/components/sections/Footer';
import GetStarted from '~/components/sections/GetStarted';
import Hero from '~/components/sections/Hero';
import Nav from '~/components/sections/Nav';

export default function Home() {
  return (
    <>
      <PageBackground />
      <Nav />
      <main>
        <Hero />
        <Features />
        <GetStarted />
      </main>
      <Footer />
    </>
  );
}
