import { useData } from '../lib/data.jsx';
import { formatDate } from '../lib/records.js';

export default function UpdatedAt() {
  const { updatedAt } = useData();
  const text = formatDate(updatedAt, true);
  return (
    <span className="updated">
      <span className={`dot${text ? '' : ' off'}`} aria-hidden="true" />
      {text ? `기록 업데이트 ${text} (KST)` : '기록 업데이트 전'}
    </span>
  );
}
