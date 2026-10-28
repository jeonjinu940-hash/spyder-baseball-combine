import { useCallback, useEffect, useRef, useState } from 'react';

// 측정 방법 설명 애니메이션 (영상처럼 재생/일시정지/다시보기/탐색 가능)
// 좌표계: 1280×720 (16:9). 원근감 있는 내야 — 홈(H)·1루(F)·2루(S)·3루(T)
const H = [330, 640];
const F = [760, 370];
const S = [370, 150];
const T = [S[0] + H[0] - F[0], S[1] + H[1] - F[1]];
const BASE = 27.4; // 베이스 간 거리(M)
const O = [H[0] + (F[0] - H[0]) * (55 / BASE), H[1] + (F[1] - H[1]) * (55 / BASE)]; // 직선 55M 지점
const C = [(H[0] + S[0]) / 2, (H[1] + S[1]) / 2];

const INTRO = 0.8;
const RUN = 4.6;
const TOTAL = 8;

// 화면 문구의 측정 횟수 (사이트 측정 종목 문구와 동일하게 유지)
const COUNT_LABEL = '인당 1회 측정';

const SCENES = {
  sprint: {
    title: '55M 직선 스프린트',
    route: '① 홈 플레이트 → 1루 → 외야',
    path: [H, F, O],
    lens: [BASE, 55 - BASE],
    gates: [
      { d: 0, label: 'START' },
      { d: 5, label: '5M' },
      { d: BASE, label: '27M', sub: '1루' },
      { d: 55, label: '55M', sub: '도착' },
    ],
    segments: [
      { from: 0, to: 5, title: '1 구간', lines: ['거리: 5M'], at: [470, 610] },
      { from: 5, to: BASE, title: '2 구간', lines: ['위치: 홈 → 1루', '거리: 약 27M', '1루 지점 자동 측정'], at: [455, 262] },
      { from: BASE, to: 55, title: '3 구간', lines: ['위치: 1루 → 외야', '거리: 약 27M (누적 55M)'], at: [790, 70] },
    ],
    showMeter: true,
  },
  baserun: {
    title: '55M 베이스러닝',
    route: '② 홈 플레이트 → 1루 → 2루',
    path: [H, F, S],
    lens: [BASE, 55 - BASE],
    // 거리 표기는 좌측 패널의 55M만 유지하고, 게이트·구간에는 베이스 이름만 표기
    gates: [
      { d: 0, label: 'START' },
      { d: BASE, label: '1루' },
      { d: 55, label: '2루' },
    ],
    segments: [
      { from: 0, to: BASE, title: '1 구간', lines: ['위치: 홈 → 1루', '1루 지점 자동 측정'], at: [640, 470] },
      { from: BASE, to: 55, title: '2 구간', lines: ['위치: 1루 → 2루'], at: [560, 100] },
    ],
    showMeter: false,
  },
};

const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const scaleFrom = (p, k) => [C[0] + (p[0] - C[0]) * k, C[1] + (p[1] - C[1]) * k];
const pts = (arr) => arr.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');

function pointAt(scene, d) {
  let acc = 0;
  for (let i = 0; i < scene.lens.length; i++) {
    if (d <= acc + scene.lens[i]) return lerp(scene.path[i], scene.path[i + 1], (d - acc) / scene.lens[i]);
    acc += scene.lens[i];
  }
  return scene.path[scene.path.length - 1];
}

function trail(scene, d) {
  const out = [scene.path[0]];
  let acc = 0;
  for (let i = 0; i < scene.lens.length; i++) {
    if (d <= acc + scene.lens[i]) break;
    acc += scene.lens[i];
    out.push(scene.path[i + 1]);
  }
  out.push(pointAt(scene, d));
  return out;
}

// 시간 → 누적 거리 (가속하는 달리기 느낌)
function distanceAt(t) {
  const u = Math.min(Math.max((t - INTRO) / RUN, 0), 1);
  return 55 * Math.pow(u, 1.45);
}

function Gate({ p, gate, passed }) {
  const [x, y] = p;
  return (
    <g className={`mv-gate${passed ? ' on' : ''}`}>
      <line x1={x} y1={y - 44} x2={x} y2={y} />
      <line x1={x} y1={y} x2={x - 12} y2={y + 12} />
      <line x1={x} y1={y} x2={x + 12} y2={y + 12} />
      <rect x={x - 6} y={y - 62} width="12" height="18" rx="2" />
      <text x={x} y={y + 36} className="mv-gate-label">{gate.label}</text>
      {gate.sub && <text x={x} y={y + 56} className="mv-gate-sub">{gate.sub}</text>}
    </g>
  );
}

function SegmentCard({ seg, visible, active }) {
  const [x, y] = seg.at;
  const h = 46 + seg.lines.length * 26;
  return (
    <g className={`mv-card${visible ? ' show' : ''}${active ? ' active' : ''}`} transform={`translate(${x} ${y})`}>
      <rect width="230" height={h} rx="14" />
      <rect className="mv-card-pill" x="12" y="12" width="88" height="26" rx="13" />
      <text x="26" y="30" className="mv-card-title">{seg.title}</text>
      {seg.lines.map((l, i) => (
        <text key={l} x="16" y={64 + i * 26} className="mv-card-line">{l}</text>
      ))}
    </g>
  );
}

export default function MeasureVideo({ event }) {
  const scene = SCENES[event];
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [t, setT] = useState(reduced ? TOTAL : 0);
  const [playing, setPlaying] = useState(!reduced);
  const last = useRef(null);

  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    const tick = (now) => {
      if (last.current != null) {
        setT((prev) => {
          const next = prev + (now - last.current) / 1000;
          if (next >= TOTAL) {
            setPlaying(false);
            return TOTAL;
          }
          return next;
        });
      }
      last.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      last.current = null;
    };
  }, [playing]);

  const toggle = useCallback(() => {
    if (t >= TOTAL) setT(0);
    setPlaying((p) => !p || t >= TOTAL);
  }, [t]);

  const replay = () => {
    setT(0);
    setPlaying(true);
  };

  const d = distanceAt(t);
  const runner = pointAt(scene, d);
  const done = t >= INTRO + RUN;
  const introK = Math.min(t / INTRO, 1);

  const dirt = [H, F, S, T].map((p) => scaleFrom(p, 1.16));
  const grass = [H, F, S, T].map((p) => scaleFrom(p, 0.84));
  const foulEnd = lerp(H, F, 3.2);
  const foulEnd3 = lerp(H, T, 3.2);

  return (
    <div className="mv">
      <svg className="mv-stage" viewBox="0 0 1280 720" role="img" aria-label={`${scene.title} 측정 방법: ${scene.route.slice(2)}, 총 55M`}>
        <defs>
          <pattern id={`mv-grass-${event}`} width="70" height="70" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)">
            <rect width="70" height="70" fill="#2c5a26" />
            <rect width="35" height="70" fill="#326629" />
          </pattern>
          <radialGradient id={`mv-vig-${event}`} cx="50%" cy="45%" r="75%">
            <stop offset="55%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.7" />
          </radialGradient>
          <filter id={`mv-glow-${event}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 필드 */}
        <rect width="1280" height="720" fill={`url(#mv-grass-${event})`} />
        <polygon points={pts(dirt)} fill="#7a4128" stroke="#7a4128" strokeWidth="44" strokeLinejoin="round" />
        <polygon points={pts(grass)} fill={`url(#mv-grass-${event})`} />
        <ellipse cx={H[0]} cy={H[1]} rx="120" ry="76" fill="#7a4128" />
        <ellipse cx={C[0]} cy={C[1]} rx="72" ry="44" fill="#7a4128" />
        <rect x={C[0] - 14} y={C[1] - 3} width="28" height="6" fill="#ddd" opacity="0.8" />
        <polyline points={pts([foulEnd3, H, foulEnd])} fill="none" stroke="#eee" strokeOpacity="0.75" strokeWidth="3" />
        <polyline points={pts([F, S, T])} fill="none" stroke="#eee" strokeOpacity="0.25" strokeWidth="2" />
        {[F, S].map((p) => (
          <rect key={p.join()} x={p[0] - 9} y={p[1] - 6} width="18" height="12" fill="#f2f2f2" transform={`rotate(-32 ${p[0]} ${p[1]})`} />
        ))}
        <polygon points={pts([[H[0] - 10, H[1] - 6], [H[0] + 10, H[1] - 6], [H[0] + 10, H[1] + 4], [H[0], H[1] + 10], [H[0] - 10, H[1] + 4]])} fill="#f2f2f2" />
        <rect width="1280" height="720" fill="#080808" opacity="0.38" />
        <rect width="1280" height="720" fill={`url(#mv-vig-${event})`} />

        {/* 측정 경로 (예정 경로 점선 + 달린 경로) */}
        <polyline points={pts(scene.path)} className="mv-route" />
        <polyline points={pts(trail(scene, d))} className="mv-trail" filter={`url(#mv-glow-${event})`} />

        {/* 측정 게이트 */}
        {scene.gates.map((g) => (
          <Gate key={g.label} p={pointAt(scene, g.d)} gate={g} passed={d >= g.d && t > INTRO} />
        ))}

        {/* 구간 안내 */}
        {scene.segments.map((s) => (
          <SegmentCard key={s.title} seg={s} visible={d >= s.from && t > INTRO} active={d >= s.from && d < s.to && !done} />
        ))}

        {/* 선수(러너) */}
        {t > INTRO * 0.5 && (
          <g filter={`url(#mv-glow-${event})`}>
            <circle cx={runner[0]} cy={runner[1]} r="13" fill="#e0242f" />
            <circle cx={runner[0]} cy={runner[1]} r="6" fill="#fff" />
          </g>
        )}

        {/* 좌측 정보 패널 */}
        <g opacity={introK} transform={`translate(${-30 * (1 - introK)} 0)`}>
          <rect x="0" y="160" width="250" height="230" className="mv-panel" />
          <text x="125" y="214" className="mv-panel-route">{scene.route}</text>
          <text x="125" y="262" className="mv-panel-big">55M</text>
          <line x1="65" y1="292" x2="185" y2="292" stroke="#fff" strokeOpacity="0.35" />
          <text x="125" y="338" className="mv-panel-count">{COUNT_LABEL}</text>
        </g>

        {/* 누적 거리 */}
        {scene.showMeter && (
          <g className="mv-meter">
            <text x="1236" y="640" className="mv-meter-label">누적 거리</text>
            <text x="1236" y="694" className="mv-meter-value">{Math.round(d)}M</text>
          </g>
        )}

        {done && (
          <g className="mv-done">
            <rect x="490" y="12" width="300" height="48" rx="24" />
            <text x="640" y="43">{scene.showMeter ? '측정 완료 · 총 55M' : '측정 완료'}</text>
          </g>
        )}
        <text x="20" y="704" className="mv-caption">* 측정 방법 이해를 돕기 위한 그래픽입니다.</text>
      </svg>

      <div className="mv-controls">
        <button type="button" className="mv-btn" onClick={toggle} aria-label={playing ? '일시정지' : '재생'}>
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
          )}
        </button>
        <button type="button" className="mv-btn" onClick={replay} aria-label="처음부터 다시 보기">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v5h5" /></svg>
        </button>
        <input
          type="range"
          className="mv-seek"
          min="0"
          max={TOTAL}
          step="0.01"
          value={t}
          aria-label="재생 위치"
          onChange={(e) => {
            setPlaying(false);
            setT(Number(e.target.value));
          }}
        />
        <span className="mv-time num">0:{String(Math.floor(t)).padStart(2, '0')} / 0:{String(TOTAL).padStart(2, '0')}</span>
      </div>
    </div>
  );
}
