import { useEffect, useRef, useState } from 'react';
import { useData } from '../lib/data.jsx';
import { formatDate } from '../lib/records.js';
import EmptyState from '../components/EmptyState.jsx';

const CATEGORIES = [
  { key: '', label: '전체' },
  { key: 'field', label: '측정 현장' },
  { key: 'player', label: '선수' },
  { key: 'school', label: '학교별' },
];

export default function Gallery() {
  const { gallery, schoolsById } = useData();
  const [cat, setCat] = useState('');
  const [open, setOpen] = useState(null);
  const dialogRef = useRef(null);

  const items = gallery.filter((g) => !cat || g.category === cat);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <section className="container page-hero">
        <p className="eyebrow">Field Gallery</p>
        <h1>GALLERY</h1>
        <p>SPYDER BASEBALL COMBINE 측정 현장의 분위기와 운영 모습을 전합니다.</p>
      </section>

      <section className="container">
        <div className="chips" role="group" aria-label="사진 카테고리">
          {CATEGORIES.map((c) => (
            <button key={c.key} type="button" className="chip" aria-pressed={cat === c.key} onClick={() => setCat(c.key)}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-24">
          {!gallery.length ? (
            <EmptyState title="현장 사진을 준비하고 있습니다" icon="◎">
              측정 현장 사진은 공개 동의와 권한 확인을 마친 자료만 게시됩니다.
            </EmptyState>
          ) : !items.length ? (
            <EmptyState title="이 카테고리에 사진이 없습니다" icon="◎" />
          ) : (
            <div className="gallery-grid">
              {items.map((g) => (
                <button key={g.id} type="button" className="gallery-item" onClick={() => setOpen(g)} aria-label={`${g.alt} 크게 보기`}>
                  <img src={g.thumb ?? g.src} alt={g.alt} loading="lazy" />
                  {(g.caption || g.date) && (
                    <span className="cap" style={{ display: 'block' }}>
                      {g.caption}
                      {g.date && <span className="num"> · {formatDate(g.date)}</span>}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <dialog ref={dialogRef} className="lightbox" onClose={() => setOpen(null)} aria-label={open?.alt}>
        {open && (
          <>
            <img src={open.src} alt={open.alt} />
            <div className="lb-bar">
              <span className="muted">
                {open.caption}
                {open.schoolId && schoolsById[open.schoolId] && ` · ${schoolsById[open.schoolId].name}`}
                {open.date && ` · ${formatDate(open.date)}`}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(null)}>닫기 ✕</button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
