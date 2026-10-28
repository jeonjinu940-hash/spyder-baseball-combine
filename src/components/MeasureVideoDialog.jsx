import { useEffect, useRef } from 'react';
import MeasureVideo from './MeasureVideo.jsx';

export default function MeasureVideoDialog({ event, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (event && !d.open) d.showModal();
    if (!event && d.open) d.close();
  }, [event]);

  return (
    <dialog
      ref={ref}
      className="mv-dialog"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="mv-title"
    >
      {event && (
        <div className="mv-dialog-inner">
          <div className="mv-dialog-head">
            <h3 id="mv-title">{event.label} 측정 방법</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>닫기 ✕</button>
          </div>
          {/* key로 종목이 바뀔 때마다 처음부터 재생 */}
          <MeasureVideo key={event.key} event={event.key} />
        </div>
      )}
    </dialog>
  );
}
