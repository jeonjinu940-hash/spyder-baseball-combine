import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';

export default function NotFound({ title = '페이지를 찾을 수 없습니다', message = '주소가 바뀌었거나 삭제된 페이지입니다.' }) {
  return (
    <section className="container section">
      <EmptyState
        title={title}
        icon="404"
        actions={
          <>
            <Link className="btn btn-primary btn-sm" to="/">홈으로</Link>
            <Link className="btn btn-ghost btn-sm" to="/records">선수 기록</Link>
          </>
        }
      >
        {message}
      </EmptyState>
    </section>
  );
}
