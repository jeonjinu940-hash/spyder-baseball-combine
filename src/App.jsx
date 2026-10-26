import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DataProvider, useData } from './lib/data.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Records from './pages/Records.jsx';
import PlayerDetail from './pages/PlayerDetail.jsx';
import Schools from './pages/Schools.jsx';
import NotFound from './pages/NotFound.jsx';

// 경로가 바뀌면 맨 위로, #앵커가 있으면 해당 섹션으로 이동
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

// 탭 이동 시 화면을 부드럽게 전환 (경로가 바뀔 때마다 페이드 인)
function PageTransition({ children }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
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
      <ScrollManager />
      <a className="skip-link" href="#main">본문 바로가기</a>
      <DemoBanner />
      <Header />
      <main id="main" tabIndex={-1}>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/schools" element={<Schools />} />
            <Route path="/records" element={<Records />} />
            <Route path="/players/:id" element={<PlayerDetail />} />
            {/* 기존 주소 호환: 소개·갤러리는 홈으로 통합 */}
            <Route path="/about" element={<Navigate to={{ pathname: '/', hash: '#about' }} replace />} />
            <Route path="/gallery" element={<Navigate to={{ pathname: '/', hash: '#gallery' }} replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>
      <Footer />
    </DataProvider>
  );
}
