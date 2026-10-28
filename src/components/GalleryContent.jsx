import { useCallback, useEffect, useRef, useState } from 'react';
import { useData } from '../lib/data.jsx';
import PageBanner from './PageBanner.jsx';

const COLS = 3;

// 앨범(학교) 사진 크게 보기: 이전/다음, 키보드 ←/→, Esc 닫기
function AlbumViewer({ album, startIndex = 0, onClose }) {
  const ref = useRef(null);
  const [i, setI] = useState(0);
  const total = album?.photos.length ?? 0;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (album) {
      setI(Math.min(Math.max(startIndex, 0), album.photos.length - 1));
      if (!d.open) d.showModal();
    } else if (d.open) d.close();
  }, [album, startIndex]);

  const go = useCallback((delta) => setI((v) => (v + delta + total) % total), [total]);

  const onKey = (e) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  };

  const photo = album?.photos[i];
  return (
    <dialog
      ref={ref}
      className="album-viewer"
      onClose={onClose}
      onKeyDown={onKey}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={album ? `${album.dateLabel} ${album.schoolName} 현장 사진` : undefined}
    >
      {album && (
        <>
          <div className="av-head">
            <div>
              <div className="av-date num">{album.dateLabel}</div>
              <div className="av-school">{album.schoolName}</div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>닫기 ✕</button>
          </div>
          <div className="av-stage">
            <img key={photo.src} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} />
            {total > 1 && (
              <>
                <button type="button" className="av-nav prev" onClick={() => go(-1)} aria-label="이전 사진">‹</button>
                <button type="button" className="av-nav next" onClick={() => go(1)} aria-label="다음 사진">›</button>
              </>
            )}
          </div>
          <div className="av-foot">
            <span className="num" aria-live="polite">{i + 1} / {total}</span>
            <div className="av-thumbs">
              {album.photos.map((p, k) => (
                <button
                  key={p.thumb}
                  type="button"
                  className="av-thumb"
                  aria-current={k === i ? 'true' : undefined}
                  aria-label={`${k + 1}번 사진 보기`}
                  onClick={() => setI(k)}
                >
                  <img src={p.thumb} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}

export default function GalleryContent() {
  const { galleryAlbums } = useData();
  // 공유용: ?album=<앨범 id>&photo=<번호> 로 접속하면 해당 사진이 바로 열림
  const [start] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return { album: galleryAlbums.find((a) => a.id === p.get('album')) ?? null, index: Math.max(Number(p.get('photo')) - 1 || 0, 0) };
  });
  const [open, setOpen] = useState(start.album);

  // 3칸 그리드를 채우도록 빈 칸은 COMING SOON으로 표시
  const placeholders = Math.max(COLS - galleryAlbums.length, (COLS - (galleryAlbums.length % COLS)) % COLS);

  return (
    <section className="home-section" id="gallery" aria-labelledby="gallery-title">
      <PageBanner as="h2" id="gallery-title" title="현장 갤러리">
        SPYDER BASEBALL COMBINE 측정 현장의 분위기와 운영 모습을 전합니다.
      </PageBanner>
      <div className="container">
        <ul className="album-grid">
          {galleryAlbums.map((a) => (
            <li key={a.id}>
              <button type="button" className="album-tile" onClick={() => setOpen(a)} aria-label={`${a.dateLabel} ${a.schoolName} 현장 사진 ${a.photos.length}장 보기`}>
                <img src={a.cover.thumb} alt="" loading="lazy" />
                <span className="album-overlay" aria-hidden="true">
                  <span className="album-date num">{a.dateLabel}</span>
                  <span className="album-school">{a.schoolName}</span>
                </span>
                <span className="album-count" aria-hidden="true">{a.photos.length}</span>
              </button>
            </li>
          ))}
          {Array.from({ length: placeholders }, (_, k) => (
            <li key={`ph-${k}`} aria-hidden="true">
              <div className="gallery-placeholder">COMING SOON</div>
            </li>
          ))}
        </ul>
        <p className="muted small mt-16">측정 현장 사진은 공개 동의와 권한 확인을 마친 자료만 게시됩니다.</p>
      </div>
      <AlbumViewer album={open} startIndex={open === start.album ? start.index : 0} onClose={() => setOpen(null)} />
    </section>
  );
}
