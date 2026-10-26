import AboutContent from '../components/AboutContent.jsx';
import GalleryContent from '../components/GalleryContent.jsx';

export default function Home() {
  return (
    <>
      <section className="hero-image" aria-label="SPYDER BASEBALL COMBINE — NEXT UP BASEBALL">
        {/* 같은 이미지를 흐리게 깔고 그 위에 유리 프레임(Glassmorphism)으로 원본 비율 이미지를 올림 */}
        <div className="hero-backdrop" aria-hidden="true" />
        <div className="hero-frame">
          <img
            src="/images/hero-main-1672.jpg"
            srcSet="/images/hero-main-900.jpg 900w, /images/hero-main-1672.jpg 1672w"
            sizes="100vw"
            width="1672"
            height="941"
            alt="SPYDER BASEBALL COMBINE — NEXT UP BASEBALL. 스프린트 측정 중인 선수"
            fetchpriority="high"
          />
        </div>
      </section>
      <AboutContent />
      <GalleryContent />
    </>
  );
}
