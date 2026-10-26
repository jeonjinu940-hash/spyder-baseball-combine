// 참가 학교 / 선수 기록 탭 상단 배너: 가운데 정렬 제목 + 한 줄 설명
export default function PageBanner({ title, children }) {
  return (
    <section className="container page-banner-wrap">
      <div className="page-banner">
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
    </section>
  );
}
