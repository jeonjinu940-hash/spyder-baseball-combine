import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

// 측정 종목·갤러리는 홈 안의 섹션이므로 홈에 있을 때 홈과 함께 밝게 표시
const NAV = [
  { to: { pathname: '/' }, label: '홈', home: true },
  { to: { pathname: '/', hash: '#events' }, label: '측정 종목', home: true },
  { to: { pathname: '/', hash: '#gallery' }, label: '갤러리', home: true },
  { to: { pathname: '/schools' }, label: '참가 학교', match: '/schools' },
  { to: { pathname: '/records' }, label: '선수 기록', match: ['/records', '/players'] },
];

function isActive(item, pathname) {
  if (item.home) return pathname === '/';
  return [].concat(item.match).some((m) => pathname.startsWith(m));
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => setOpen(false), [pathname, hash]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" className="brand" aria-label="SPYDER BASEBALL COMBINE 홈">
          <img className="wordmark" src="/logos/combine-wordmark.jpg" alt="" width="90" height="38" />
          <span className="divider" aria-hidden="true" />
          <img className="spyder" src="/logos/spyder-logo-white.png" alt="SPYDER" width="72" height="13" />
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
        </button>
        <nav id="site-nav" className={`nav${open ? ' open' : ''}`} aria-label="주요 메뉴">
          {NAV.map((n) => {
            const active = isActive(n, pathname);
            const current = active && (n.to.hash ?? '') === hash;
            return (
              <Link
                key={n.label}
                to={n.to}
                className={active ? 'active' : undefined}
                aria-current={current ? 'page' : undefined}
                onClick={() => {
                  // 이미 같은 위치면 다시 스크롤
                  if (current) {
                    const el = n.to.hash && document.getElementById(n.to.hash.slice(1));
                    if (el) el.scrollIntoView();
                    else window.scrollTo(0, 0);
                  }
                }}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
