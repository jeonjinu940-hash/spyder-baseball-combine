import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { DataProvider, useData } from './lib/data.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Records from './pages/Records.jsx';
import PlayerDetail from './pages/PlayerDetail.jsx';
import Schools from './pages/Schools.jsx';
import Gallery from './pages/Gallery.jsx';
import NotFound from './pages/NotFound.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function DemoBanner() {
  const { demo } = useData();
  if (!demo) return null;
  return (
    <div className="demo-banner" role="status">
      <strong>DEMO</strong> UI 확인용 가상 데이터입니다. 실제 측정 기록이 아닙니다.
      <a href="?demo=0">실제 데이터로 보기</a>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <ScrollToTop />
      <a className="skip-link" href="#main">본문 바로가기</a>
      <DemoBanner />
      <Header />
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/records" element={<Records />} />
          <Route path="/players/:id" element={<PlayerDetail />} />
          <Route path="/schools" element={<Schools />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </DataProvider>
  );
}
