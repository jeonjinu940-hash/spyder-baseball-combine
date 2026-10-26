export default function SearchBar({ value, onChange, id = 'search', label = '선수명 또는 학교명 검색', placeholder }) {
  return (
    <div className="search" role="search">
      <label htmlFor={id} className="sr-only">{label}</label>
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder ?? '선수명 또는 학교명을 입력하세요'}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" className="clear" aria-label="검색어 지우기" onClick={() => onChange('')}>
          <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
