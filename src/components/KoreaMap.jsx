import map from '../data/korea-map.json';
import { provinceLabel } from '../lib/regions.js';

// 수도권은 영역이 겹쳐 배지를 바깥으로 빼고 연결선을 그린다
const BADGE_OFFSET = {
  seoul: [-62, -62],
  incheon: [-44, 22],
  gyeonggi: [52, -46],
};

export default function KoreaMap({ counts, selected, onSelect, compact = false }) {
  const keyHandler = (key) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(key);
    }
  };

  return (
    <svg
      className="korea-map"
      viewBox={`0 0 ${map.width} ${map.height}`}
      role="group"
      aria-label="대한민국 참가 학교 지도. 숫자는 지역별 참가 학교 수입니다."
      style={compact ? { maxHeight: 420 } : undefined}
    >
      <defs>
        <pattern id="sel-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#9a9a9a" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="#e5e5e5" strokeWidth="3" />
        </pattern>
      </defs>
      {map.regions.map((r) => {
        const n = counts[r.key] ?? 0;
        const isSel = selected === r.key;
        const cls = `region${n ? ' has' : ''}${isSel ? ' selected' : ''}`;
        if (!n || !onSelect) {
          return (
            <path key={r.key} className={cls} d={r.d}>
              <title>{`${provinceLabel(r.key)} ${n ? `참가 학교 ${n}개` : '참가 학교 없음'}`}</title>
            </path>
          );
        }
        return (
          <path
            key={r.key}
            className={cls}
            d={r.d}
            role="button"
            tabIndex={0}
            aria-pressed={isSel}
            aria-label={`${provinceLabel(r.key)} 참가 학교 ${n}개${isSel ? ', 선택됨' : ''}`}
            onClick={() => onSelect(r.key)}
            onKeyDown={keyHandler(r.key)}
          />
        );
      })}
      {/* 선택 지역을 맨 위에 다시 그려 외곽선이 가려지지 않게 */}
      {selected && map.regions.filter((r) => r.key === selected).map((r) => (
        <path key="sel-outline" d={r.d} fill="none" stroke="#fff" strokeWidth="2.4" pointerEvents="none" />
      ))}
      {map.regions
        .filter((r) => counts[r.key])
        .map((r) => {
          const [dx, dy] = BADGE_OFFSET[r.key] ?? [0, 0];
          const bx = r.cx + dx;
          const by = r.cy + dy;
          return (
            <g key={`b-${r.key}`} className={`badge${selected === r.key ? ' selected' : ''}`} aria-hidden="true">
              {(dx || dy) && <line className="leader" x1={r.cx} y1={r.cy} x2={bx} y2={by} />}
              <circle cx={bx} cy={by} r="15" />
              <text x={bx} y={by + 1}>{counts[r.key]}</text>
              {(dx || dy || !compact) && (
                <text x={bx} y={by + 26} style={{ fill: '#d4d4d4', fontSize: 12, fontWeight: 700 }}>
                  {provinceLabel(r.key)}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}
