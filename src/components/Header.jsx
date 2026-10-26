import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'HOME', end: true },
  { to: '/about', label: 'ABOUT COMBINE' },
  { to: '/records', label: 'PLAYER RECORDS' },
  { to: '/schools', label: 'SCHOOLS' },
  { to: '/gallery', label: 'GALLERY' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

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
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
