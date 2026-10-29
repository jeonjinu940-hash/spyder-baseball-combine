import { useData } from '../lib/data.jsx';
import { formatDate } from '../lib/records.js';

export default function UpdatedAt() {
  const { updatedAt } = useData();
  // 날짜만 있으면(예: 2026-10-28, 엑셀 파일 기준일) 날짜만 표시
  const hasTime = typeof updatedAt === 'string' && updatedAt.includes('T');
  const text = formatDate(updatedAt, hasTime);
  return (
    <span className="updated">
      <span className={`dot${text ? '' : ' off'}`} aria-hidden="true" />
      {text ? `기록 업데이트 ${text}${hasTime ? ' (KST)' : ''}` : '기록 업데이트 전'}
    </span>
  );
}
