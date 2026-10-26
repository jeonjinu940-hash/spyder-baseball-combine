// 베이스 경로 다이어그램: sprint = 홈→1루→외야(직선), baserun = 홈→1루→2루
const HOME = [110, 220];
const FIRST = [170, 160];
const SECOND = [110, 100];
const THIRD = [50, 160];
const OUTFIELD = [230, 100];

const pt = (p) => p.join(',');

export default function BaseDiagram({ event }) {
  const route = event === 'sprint' ? [HOME, FIRST, OUTFIELD] : [HOME, FIRST, SECOND];
  const on = event === 'sprint' ? ['home', 'first'] : ['home', 'first', 'second'];
  const label = event === 'sprint' ? '홈에서 1루를 지나 외야까지 직선 55M 경로' : '홈에서 1루를 거쳐 2루까지 55M 베이스러닝 경로';
  const id = `arrow-${event}`;

  return (
    <svg className="diagram" viewBox="0 0 260 250" role="img" aria-label={label}>
      <defs>
        <marker id={id} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#fff" />
        </marker>
      </defs>
      <line className="baseline" x1={HOME[0]} y1={HOME[1]} x2="250" y2="80" strokeDasharray="3 5" />
      <line className="baseline" x1={HOME[0]} y1={HOME[1]} x2="10" y2="120" strokeDasharray="3 5" />
      <polygon className="baseline" points={[HOME, FIRST, SECOND, THIRD].map(pt).join(' ')} />
      <polyline className="run" points={route.map(pt).join(' ')} markerEnd={`url(#${id})`} />
      {[
        ['home', HOME],
        ['first', FIRST],
        ['second', SECOND],
        ['third', THIRD],
      ].map(([k, [x, y]]) => (
        <rect
          key={k}
          className={`base${on.includes(k) ? ' on' : ''}`}
          x={x - 6}
          y={y - 6}
          width="12"
          height="12"
          transform={`rotate(45 ${x} ${y})`}
        />
      ))}
      <text x={HOME[0]} y={HOME[1] + 24} textAnchor="middle" className="strong">HOME</text>
      <text x={FIRST[0] + 12} y={FIRST[1] + 20} className="strong">1ST</text>
      <text x={SECOND[0]} y={SECOND[1] - 14} textAnchor="middle" className={event === 'baserun' ? 'strong' : ''}>2ND</text>
      <text x={THIRD[0] - 12} y={THIRD[1] + 20} textAnchor="end">3RD</text>
      {event === 'sprint' && (
        <text x={OUTFIELD[0] - 4} y={OUTFIELD[1] - 12} textAnchor="end" className="strong">OUTFIELD</text>
      )}
    </svg>
  );
}
