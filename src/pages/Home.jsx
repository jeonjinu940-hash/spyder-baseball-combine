import AboutContent from '../components/AboutContent.jsx';
import GalleryContent from '../components/GalleryContent.jsx';

export default function Home() {
  return (
    <>
      <section className="hero-image" aria-label="SPYDER BASEBALL COMBINE — NEXT UP BASEBALL">
        <img
          src="/images/hero-main-1672.jpg"
          srcSet="/images/hero-main-900.jpg 900w, /images/hero-main-1672.jpg 1672w"
          sizes="100vw"
          width="1672"
          height="941"
          alt="SPYDER BASEBALL COMBINE — NEXT UP BASEBALL. 스프린트 측정 중인 선수"
          fetchpriority="high"
        />
      </section>
      <AboutContent />
      <GalleryContent />
    </>
  );
}
